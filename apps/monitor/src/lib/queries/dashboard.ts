import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Leden trend (unieke rel_codes per seizoen uit competitie_spelers)
// ---------------------------------------------------------------------------

export type LedenTrendPunt = { seizoen: string; totaal: number };

export async function getLedenTrend(): Promise<LedenTrendPunt[]> {
  return prisma.$queryRaw<LedenTrendPunt[]>`
    SELECT seizoen, COUNT(DISTINCT rel_code)::int AS totaal
    FROM competitie_spelers
    GROUP BY seizoen
    ORDER BY seizoen`;
}

// ---------------------------------------------------------------------------
// Instroom/uitstroom (unieke rel_codes vergelijken tussen opeenvolgende seizoenen)
// ---------------------------------------------------------------------------

export type InstroomUitstroomPunt = {
  seizoen: string;
  instroom: number;
  uitstroom: number;
};

export async function getInstroomUitstroom(): Promise<InstroomUitstroomPunt[]> {
  return prisma.$queryRaw<InstroomUitstroomPunt[]>`
    WITH per_seizoen AS (
      SELECT seizoen, array_agg(DISTINCT rel_code) AS codes
      FROM competitie_spelers
      GROUP BY seizoen
    ),
    paren AS (
      SELECT
        cur.seizoen,
        (SELECT COUNT(*) FROM unnest(cur.codes) c WHERE NOT c = ANY(prev.codes))::int AS instroom,
        (SELECT COUNT(*) FROM unnest(prev.codes) p WHERE NOT p = ANY(cur.codes))::int AS uitstroom
      FROM per_seizoen cur
      JOIN per_seizoen prev ON prev.seizoen = (
        (SPLIT_PART(cur.seizoen, '-', 1)::int - 1) || '-' || SPLIT_PART(cur.seizoen, '-', 1)
      )
    )
    SELECT * FROM paren ORDER BY seizoen`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardKPIs = {
  seizoen: string;
  totaal_spelers: number;
  totaal_teams: number;
  signalering_kritiek: number;
  signalering_aandacht: number;
  geslacht: { M: number; V: number };
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getDashboardKPIs(seizoen: string): Promise<DashboardKPIs> {
  const [spelerCount, signaleringen, teamCount, geslachtRows] = await Promise.all([
    prisma.$queryRaw<{ totaal: number }[]>`
        SELECT COUNT(DISTINCT rel_code)::int AS totaal
        FROM competitie_spelers
        WHERE seizoen = ${seizoen}`,
    prisma.signalering.findMany({
      where: { seizoen },
      select: { ernst: true },
    }),
    prisma.oWTeam.count({ where: { seizoen } }),
    prisma.$queryRaw<{ geslacht: string; aantal: number }[]>`
        SELECT geslacht, COUNT(DISTINCT rel_code)::int AS aantal
        FROM competitie_spelers
        WHERE seizoen = ${seizoen}
        GROUP BY geslacht`,
  ]);

  const geslacht = { M: 0, V: 0 };
  for (const r of geslachtRows) {
    if (r.geslacht === "M") geslacht.M = Number(r.aantal);
    if (r.geslacht === "V") geslacht.V = Number(r.aantal);
  }

  return {
    seizoen,
    totaal_spelers: spelerCount[0]?.totaal ?? 0,
    totaal_teams: teamCount,
    signalering_kritiek: signaleringen.filter((s) => s.ernst === "kritiek").length,
    signalering_aandacht: signaleringen.filter((s) => s.ernst === "aandacht").length,
    geslacht,
  };
}
