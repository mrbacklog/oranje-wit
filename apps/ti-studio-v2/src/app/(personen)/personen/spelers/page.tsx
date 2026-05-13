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

function bepaalLeeftijdCategorie(grofLeeftijd: number): LeeftijdCategorie {
  if (grofLeeftijd <= 9) return "blauw";
  if (grofLeeftijd <= 12) return "geel";
  if (grofLeeftijd <= 15) return "oranje";
  if (grofLeeftijd <= 18) return "rood";
  if (grofLeeftijd <= 7) return "blauw";
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

  // Stap 2: spelers ophalen
  const spelers = await prisma.speler.findMany({
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geslacht: true,
      geboortedatum: true,
      geboortejaar: true,
      status: true,
      huidig: true,
      kadersStatussen: {
        where: { kadersId: kaders.id },
        select: { id: true, gezienStatus: true },
        take: 1,
      },
      werkitems: {
        where: {
          type: "MEMO",
          status: { not: "OPGELOST" },
        },
        select: { id: true, status: true, prioriteit: true },
        take: 1,
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

  const peildatum = korfbalPeildatum(kaders.seizoen as `${number}-${number}`);

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

    let leeftijdCat: LeeftijdCategorie;
    if (grofLeeftijd <= 9) leeftijdCat = "blauw";
    else if (grofLeeftijd <= 12) leeftijdCat = "geel";
    else if (grofLeeftijd <= 15) leeftijdCat = "oranje";
    else if (grofLeeftijd <= 18) leeftijdCat = "rood";
    else leeftijdCat = "senior";

    const kadersStatus = s.kadersStatussen[0];
    const indeling = indelingMap.get(s.id) ?? null;
    const huidigJson = s.huidig as Record<string, unknown> | null;

    return {
      id: s.id,
      roepnaam: s.roepnaam,
      achternaam: s.achternaam,
      geslacht: s.geslacht as "M" | "V",
      geboortedatum: s.geboortedatum,
      geboortejaar: s.geboortejaar,
      status: s.status,
      gezienStatus: kadersStatus?.gezienStatus ?? "ONGEZIEN",
      huidigTeam: huidigJson?.team ? String(huidigJson.team) : null,
      indelingTeamNaam: indeling?.teamNaam ?? null,
      indelingTeamId: indeling?.teamId ?? null,
      heeftOpenMemo: s.werkitems.length > 0,
      memoBadge: bepaalMemoBadge(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s.werkitems.map((w: any) => ({
          status: w.status as string,
          prioriteit: w.prioriteit as string,
        }))
      ),
      leeftijdscategorie: leeftijdCat,
      korfbalLeeftijd,
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
