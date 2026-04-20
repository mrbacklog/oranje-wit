import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

export interface WijzigingsSignaal {
  type: "nieuw-lid" | "afmelding" | "status-wijziging" | "activiteit-wijziging";
  relCode: string;
  naam: string;
  beschrijving: string;
  oud: string | null;
  nieuw: string | null;
  bron: "leden-sync" | "notificatie" | "team-sync";
}

const VENSTER_NIEUW_LID_DAGEN = 180;
const VENSTER_NOTIFICATIE_DAGEN = 30;
const MAX_SIGNALEN = 200;

const TYPE_PRIORITEIT: Record<WijzigingsSignaal["type"], number> = {
  "nieuw-lid": 0,
  afmelding: 1,
  "status-wijziging": 2,
  "activiteit-wijziging": 3,
};

/**
 * Is deze spelactiviteit daadwerkelijk korfbal-gerelateerd (speler-kandidaat),
 * of gaat het om een niet-spelende hoedanigheid (bestuur, ouder, vrijwilliger)?
 */
function isKorfbalActiviteit(activiteit: string | null): boolean {
  if (!activiteit) return false;
  const a = activiteit.trim().toLowerCase();
  if (!a || a === "geen") return false;
  return true;
}

/**
 * Laag 3: Detecteer wijzigingen die gevolgen kunnen hebben voor de teamindeling.
 */
export async function detecteerWijzigingen(): Promise<WijzigingsSignaal[]> {
  const signalen: WijzigingsSignaal[] = [];
  const gezien = new Set<string>();

  const voegToe = (signaal: WijzigingsSignaal) => {
    const key = `${signaal.relCode}|${signaal.type}`;
    if (gezien.has(key)) return;
    gezien.add(key);
    signalen.push(signaal);
  };

  // 1. Nieuwe leden met speler-potentie (zonder Speler-record)
  //    Alleen als:
  //      - recent ingeschreven (binnen venster), of
  //      - heeft een korfbal-activiteit (niet 'geen')
  const ledenZonderSpeler = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string;
      achternaam: string;
      lid_status: string;
      spelactiviteiten: string | null;
      lid_sinds: Date | null;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.lid_status, l.spelactiviteiten, l.lid_sinds
    FROM leden l
    LEFT JOIN "Speler" s ON l.rel_code = s.id
    WHERE s.id IS NULL
      AND l.lid_status = 'ACTIVE'
      AND l.rel_code ~ '^[A-Z]{1,3}'
      AND (
        (
          l.spelactiviteiten IS NOT NULL
          AND l.spelactiviteiten <> ''
          AND LOWER(l.spelactiviteiten) <> 'geen'
        )
        OR l.lid_sinds >= NOW() - (${VENSTER_NIEUW_LID_DAGEN}::int * INTERVAL '1 day')
      )
    ORDER BY l.lid_sinds DESC NULLS LAST
  `;

  for (const lid of ledenZonderSpeler) {
    const activiteit = lid.spelactiviteiten?.trim() || "geen";
    const sindsStr = lid.lid_sinds
      ? ` — lid sinds ${lid.lid_sinds.toISOString().slice(0, 10)}`
      : "";
    voegToe({
      type: "nieuw-lid",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`.trim(),
      beschrijving: `Actief lid zonder speler-record. Activiteit: ${activiteit}${sindsStr}`,
      oud: null,
      nieuw: lid.lid_status,
      bron: "leden-sync",
    });
  }

  // 2. Spelers waarvan Lid-status niet meer ACTIVE is
  const statusWijzigingen = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string | null;
      achternaam: string | null;
      lid_status: string;
      speler_status: string;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.lid_status, s.status as speler_status
    FROM leden l
    JOIN "Speler" s ON l.rel_code = s.id
    WHERE l.lid_status != 'ACTIVE'
      AND s.status NOT IN ('GAAT_STOPPEN', 'NIET_SPELEND')
  `;

  for (const lid of statusWijzigingen) {
    voegToe({
      type: "status-wijziging",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam ?? ""} ${lid.achternaam ?? ""}`.trim() || lid.rel_code,
      beschrijving: `Lid-status: ${lid.lid_status}, speler-status: ${lid.speler_status}`,
      oud: lid.speler_status,
      nieuw: lid.lid_status,
      bron: "leden-sync",
    });
  }

  // 3. Spelers met afmelddatum die nog niet GAAT_STOPPEN zijn
  const afmeldingen = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string | null;
      achternaam: string | null;
      afmelddatum: Date;
      speler_status: string;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.afmelddatum, s.status as speler_status
    FROM leden l
    JOIN "Speler" s ON l.rel_code = s.id
    WHERE l.afmelddatum IS NOT NULL
      AND s.status NOT IN ('GAAT_STOPPEN')
    ORDER BY l.afmelddatum DESC
  `;

  for (const lid of afmeldingen) {
    voegToe({
      type: "afmelding",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam ?? ""} ${lid.achternaam ?? ""}`.trim() || lid.rel_code,
      beschrijving: `Afmelddatum: ${lid.afmelddatum.toISOString().slice(0, 10)}`,
      oud: lid.speler_status,
      nieuw: "GAAT_STOPPEN",
      bron: "leden-sync",
    });
  }

  // 4. Recente relevante notificaties (membership + player events)
  //    Naam gejoined met leden voor leesbare labels.
  const sindsDatum = new Date(Date.now() - VENSTER_NOTIFICATIE_DAGEN * 24 * 60 * 60 * 1000);
  const recenteNotificaties = await prisma.$queryRaw<
    {
      rel_code: string;
      entiteit: string;
      actie: string;
      beschrijving: string;
      datum: Date;
      roepnaam: string | null;
      achternaam: string | null;
    }[]
  >`
    SELECT n."relCode" AS rel_code,
           n.entiteit,
           n.actie,
           n.beschrijving,
           n.datum,
           l.roepnaam,
           l.achternaam
    FROM "SportlinkNotificatie" n
    LEFT JOIN leden l ON l.rel_code = n."relCode"
    WHERE n.entiteit IN ('membership', 'player')
      AND n."gesyncOp" >= ${sindsDatum}
    ORDER BY n.datum DESC
    LIMIT 50
  `;

  for (const notif of recenteNotificaties) {
    const naam = `${notif.roepnaam ?? ""} ${notif.achternaam ?? ""}`.trim() || notif.rel_code;
    const datum = notif.datum.toISOString().slice(0, 10);

    if (notif.beschrijving.includes("Lid geworden van Oranje Wit")) {
      voegToe({
        type: "nieuw-lid",
        relCode: notif.rel_code,
        naam,
        beschrijving: `${notif.beschrijving} op ${datum}`,
        oud: null,
        nieuw: "Nieuw lid",
        bron: "notificatie",
      });
    } else if (notif.entiteit === "player") {
      voegToe({
        type: "activiteit-wijziging",
        relCode: notif.rel_code,
        naam,
        beschrijving: `${notif.beschrijving} (${notif.actie}) op ${datum}`,
        oud: null,
        nieuw: notif.actie,
        bron: "notificatie",
      });
    }
  }

  // Sortering: type-prioriteit, dan naam
  signalen.sort((a, b) => {
    const delta = TYPE_PRIORITEIT[a.type] - TYPE_PRIORITEIT[b.type];
    if (delta !== 0) return delta;
    return a.naam.localeCompare(b.naam);
  });

  const begrensd = signalen.slice(0, MAX_SIGNALEN);
  logger.info(
    `[sportlink] Wijzigingsdetectie: ${begrensd.length} signalen (${signalen.length} ruw)`
  );
  return begrensd;
}
