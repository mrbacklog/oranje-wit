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

/**
 * Laag 3: Detecteer wijzigingen die gevolgen kunnen hebben voor de teamindeling.
 */
export async function detecteerWijzigingen(): Promise<WijzigingsSignaal[]> {
  const signalen: WijzigingsSignaal[] = [];

  // 1. Leden zonder Speler-record (actieve bondsleden)
  const ledenZonderSpeler = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string;
      achternaam: string;
      lid_status: string;
      spelactiviteiten: string | null;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.lid_status, l.spelactiviteiten
    FROM leden l
    LEFT JOIN "Speler" s ON l.rel_code = s.id
    WHERE s.id IS NULL
      AND l.lid_status = 'ACTIVE'
      AND l.rel_code ~ '^[A-Z]{1,3}'
  `;

  for (const lid of ledenZonderSpeler) {
    signalen.push({
      type: "nieuw-lid",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`,
      beschrijving: `Actief lid zonder speler-record. Activiteit: ${lid.spelactiviteiten || "geen"}`,
      oud: null,
      nieuw: lid.lid_status,
      bron: "leden-sync",
    });
  }

  // 2. Spelers waarvan Lid-status niet meer ACTIVE is
  const statusWijzigingen = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string;
      achternaam: string;
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
    signalen.push({
      type: "status-wijziging",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`,
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
      roepnaam: string;
      achternaam: string;
      afmelddatum: Date;
      speler_status: string;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.afmelddatum, s.status as speler_status
    FROM leden l
    JOIN "Speler" s ON l.rel_code = s.id
    WHERE l.afmelddatum IS NOT NULL
      AND s.status NOT IN ('GAAT_STOPPEN')
  `;

  for (const lid of afmeldingen) {
    signalen.push({
      type: "afmelding",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`,
      beschrijving: `Afmelddatum: ${lid.afmelddatum.toISOString().slice(0, 10)}`,
      oud: lid.speler_status,
      nieuw: "GAAT_STOPPEN",
      bron: "leden-sync",
    });
  }

  // 4. Recente relevante notificaties (membership + player events)
  const recenteNotificaties = await prisma.sportlinkNotificatie.findMany({
    where: {
      entiteit: { in: ["membership", "player"] },
      gesyncOp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { datum: "desc" },
    take: 50,
  });

  for (const notif of recenteNotificaties) {
    if (notif.beschrijving.includes("Lid geworden van Oranje Wit")) {
      signalen.push({
        type: "nieuw-lid",
        relCode: notif.relCode,
        naam: notif.relCode, // naam niet beschikbaar in notificatie
        beschrijving: `${notif.beschrijving} op ${notif.datum.toISOString().slice(0, 10)}`,
        oud: null,
        nieuw: "Nieuw lid",
        bron: "notificatie",
      });
    } else if (notif.entiteit === "player") {
      signalen.push({
        type: "activiteit-wijziging",
        relCode: notif.relCode,
        naam: notif.relCode,
        beschrijving: `${notif.beschrijving} (${notif.actie}) op ${notif.datum.toISOString().slice(0, 10)}`,
        oud: null,
        nieuw: notif.actie,
        bron: "notificatie",
      });
    }
  }

  logger.info(`[sportlink] Wijzigingsdetectie: ${signalen.length} signalen gevonden`);
  return signalen;
}
