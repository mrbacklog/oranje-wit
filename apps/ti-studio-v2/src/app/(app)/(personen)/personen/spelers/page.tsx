import { db as prisma } from "@/lib/db";
import {
  berekenKorfbalLeeftijd,
  formatKorfbalLeeftijd,
  grofKorfbalLeeftijd,
  korfbalPeildatum,
} from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import { SpelersTabel } from "@/components/personen/spelers/SpelersTabel";
import { SpelersFilterbar } from "@/components/personen/spelers/SpelersFilterbar";
import type { SpelerRijData, LeeftijdCategorie, MemoBadge } from "@/components/personen/types";
import type { WerkitemStatus } from "@oranje-wit/database";
import { isNieuwLid } from "@/lib/format/speler";
import { getSpelersMetFoto } from "@/lib/queries/spelers-foto";

function bepaalLeeftijdCategorie(grofLeeftijd: number): LeeftijdCategorie {
  if (grofLeeftijd <= 5) return "kangoeroe";
  if (grofLeeftijd <= 7) return "blauw";
  if (grofLeeftijd <= 9) return "groen";
  if (grofLeeftijd <= 12) return "geel";
  if (grofLeeftijd <= 15) return "oranje";
  if (grofLeeftijd <= 18) return "rood";
  return "senior";
}

function bepaalMemoBadge(werkitems: Array<{ status: string; prioriteit: string }>): MemoBadge {
  if (werkitems.length === 0) return "geen";
  const item = werkitems[0];
  if (item.status === "OPGELOST") return "opgelost";
  if (item.status === "OPEN" && (item.prioriteit === "BLOCKER" || item.prioriteit === "HOOG")) {
    return "risico";
  }
  if (item.status === "IN_BESPREKING") return "bespreking";
  if (item.status === "OPEN") return "open";
  return "geen";
}

// Hoogste actieve WerkitemStatus (voor memoStatus in HoverKaart)
const STATUS_PRIORITEIT: Record<string, number> = {
  GEACCEPTEERD_RISICO: 1,
  IN_BESPREKING: 2,
  OPEN: 3,
};

function hoogsteStatus(werkitems: Array<{ status: string }>): WerkitemStatus | null {
  if (werkitems.length === 0) return null;
  let best: string | null = null;
  let bestPrio = 0;
  for (const w of werkitems) {
    const prio = STATUS_PRIORITEIT[w.status] ?? 0;
    if (prio > bestPrio) {
      bestPrio = prio;
      best = w.status;
    }
  }
  return best as WerkitemStatus | null;
}

export default async function SpelersPage() {
  // Stap 1: haal actief Kaders op
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });

  if (!kaders) {
    return (
      <div style={{ color: "var(--text-3)", padding: 24 }}>
        Geen actief werkseizoen gevonden. Stel een Kaders-record in als werkseizoen.
      </div>
    );
  }

  const peildatum = korfbalPeildatum(kaders.seizoen as `${number}-${number}`);
  // Seizoenstart = 1 juli van het startjaar van het seizoen (bv. 2025-2026 → 1 juli 2025)
  const seizoenStartJaar = parseInt(kaders.seizoen.split("-")[0] ?? "2025", 10);
  const seizoenStartDatum = new Date(seizoenStartJaar, 6, 1); // maand 6 = juli

  // Stap 2: spelers ophalen
  const spelers = await prisma.speler.findMany({
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    select: {
      id: true,
      roepnaam: true,
      tussenvoegsel: true,
      achternaam: true,
      geslacht: true,
      geboortedatum: true,
      geboortejaar: true,
      status: true,
      huidig: true,
      lidSinds: true,
      kadersStatussen: {
        where: { kadersId: kaders.id },
        select: { id: true, gezienStatus: true },
        take: 1,
      },
      werkitems: {
        where: {
          type: "MEMO",
          status: { notIn: ["OPGELOST", "GEARCHIVEERD"] },
        },
        select: { id: true, status: true, prioriteit: true },
        orderBy: { aangemaaktOp: "desc" },
        take: 5,
      },
    },
  });

  // Stap 3: actieve versie ophalen
  type VersieData = {
    id: string;
    teams: Array<{
      id: string;
      naam: string;
      kleur: string | null;
      spelersIds: string[];
    }>;
  };
  let actieveVersie: VersieData | null = null;

  try {
    const versieRaw = await prisma.versie.findFirst({
      where: {
        werkindeling: {
          kaders: { isWerkseizoen: true },
          status: "ACTIEF",
        },
      },
      orderBy: { nummer: "desc" },
      select: {
        id: true,
        teams: {
          select: {
            id: true,
            naam: true,
            kleur: true,
            spelers: { select: { spelerId: true } },
          },
        },
      },
    });
    if (versieRaw) {
      actieveVersie = {
        id: versieRaw.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teams: versieRaw.teams.map((t: any) => ({
          id: t.id as string,
          naam: t.naam as string,
          kleur: (t.kleur ?? null) as string | null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spelersIds: t.spelers.map((s: any) => s.spelerId as string),
        })),
      };
    }
  } catch (err) {
    logger.warn("SpelersPage: actieve versie ophalen mislukt:", err);
  }

  // Bouw indeling-map: spelerId → { teamId, teamNaam }
  const indelingMap = new Map<string, { teamId: string; teamNaam: string }>();
  if (actieveVersie) {
    for (const team of actieveVersie.teams) {
      for (const spelerId of team.spelersIds) {
        indelingMap.set(spelerId, { teamId: team.id, teamNaam: team.naam });
      }
    }
  }

  // Stap 4: foto-set ophalen (bulk)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alleRelCodes = spelers.map((s: any) => s.id as string);
  let spelersMetFoto = new Set<string>();
  try {
    spelersMetFoto = await getSpelersMetFoto(alleRelCodes);
  } catch (err) {
    logger.warn("SpelersPage: foto-set ophalen mislukt:", err);
  }

  // Map naar SpelerRijData
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spelersData: SpelerRijData[] = spelers.map((s: any) => {
    const leeftijdExact = berekenKorfbalLeeftijd(
      s.geboortedatum ?? null,
      s.geboortejaar as number,
      peildatum
    );
    const grofLeeftijd = grofKorfbalLeeftijd(s.geboortejaar, peildatum);
    const korfbalLeeftijd = formatKorfbalLeeftijd(leeftijdExact);
    const leeftijdCat = bepaalLeeftijdCategorie(grofLeeftijd);

    const kadersStatus = s.kadersStatussen[0];
    const indeling = indelingMap.get(s.id) ?? null;
    const huidigJson = s.huidig as Record<string, unknown> | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const werkitemsList = s.werkitems as Array<{ status: string; prioriteit: string }>;

    return {
      id: s.id,
      roepnaam: s.roepnaam as string,
      tussenvoegsel: (s.tussenvoegsel as string | null) ?? null,
      achternaam: s.achternaam as string,
      geslacht: s.geslacht as "M" | "V",
      geboortedatum: s.geboortedatum,
      geboortejaar: s.geboortejaar as number,
      status: s.status as string,
      gezienStatus: kadersStatus?.gezienStatus ?? "ONGEZIEN",
      huidigTeam: huidigJson?.team ? String(huidigJson.team) : null,
      indelingTeamNaam: indeling?.teamNaam ?? null,
      indelingTeamId: indeling?.teamId ?? null,
      heeftOpenMemo: werkitemsList.length > 0,
      memoBadge: bepaalMemoBadge(werkitemsList),
      memoStatus: hoogsteStatus(werkitemsList),
      leeftijdscategorie: leeftijdCat,
      leeftijd: leeftijdExact,
      korfbalLeeftijd,
      isNieuw: isNieuwLid(s.lidSinds as string | null, seizoenStartDatum),
      hasFoto: spelersMetFoto.has(s.id as string),
      kadersSpelerId: kadersStatus?.id ?? null,
      kadersId: kaders.id,
    };
  });

  return (
    <div>
      <SpelersFilterbar />
      <SpelersTabel
        data={spelersData}
        actieveVersieId={actieveVersie?.id ?? ""}
        kadersId={kaders.id}
        teams={
          actieveVersie?.teams.map((t) => ({ id: t.id, naam: t.naam, kleur: t.kleur ?? null })) ??
          []
        }
      />
    </div>
  );
}
