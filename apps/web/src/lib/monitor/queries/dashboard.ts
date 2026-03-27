// @ts-nocheck — Prisma 7 type-recursie workaround (TS2321)
import { prisma } from "@/lib/db/prisma";
import { isLopendSeizoen } from "@/lib/monitor/utils/seizoen";

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
  isLopend: boolean;
  instroom: number;
  uitstroom: number;
};

export async function getInstroomUitstroom(): Promise<InstroomUitstroomPunt[]> {
  const rows = await prisma.$queryRaw<{ seizoen: string; instroom: number; uitstroom: number }[]>`
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
        (SPLIT_PART(cur.seizoen, '-', 1)::int - 1)::text || '-' || SPLIT_PART(cur.seizoen, '-', 1)
      )
    )
    SELECT * FROM paren ORDER BY seizoen`;

  return rows.map((r) => ({
    seizoen: r.seizoen,
    isLopend: isLopendSeizoen(r.seizoen),
    instroom: Number(r.instroom),
    uitstroom: Number(r.uitstroom),
  }));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardKPIs = {
  seizoen: string;
  totaal_spelers: number;
  totaal_teams: number;
  teams_8tal: number;
  teams_4tal: number;
  signalering_kritiek: number;
  signalering_aandacht: number;
  geslacht: { M: number; V: number };
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getDashboardKPIs(seizoen: string): Promise<DashboardKPIs> {
  const [spelerCount, signaleringen, teamRows, geslachtRows] = await Promise.all([
    prisma.$queryRaw<{ totaal: number }[]>`
        SELECT COUNT(DISTINCT rel_code)::int AS totaal
        FROM competitie_spelers
        WHERE seizoen = ${seizoen}`,
    prisma.signalering.findMany({
      where: { seizoen },
      select: { ernst: true },
    }),
    prisma.$queryRaw<{ spelvorm: string | null; aantal: number }[]>`
        SELECT spelvorm, COUNT(*)::int AS aantal
        FROM teams
        WHERE seizoen = ${seizoen} AND is_selectie = false
        GROUP BY spelvorm`,
    prisma.$queryRaw<{ geslacht: string; aantal: number }[]>`
        SELECT geslacht, COUNT(DISTINCT rel_code)::int AS aantal
        FROM competitie_spelers
        WHERE seizoen = ${seizoen}
        GROUP BY geslacht`,
  ]);

  let totaalTeams = 0;
  let teams8tal = 0;
  let teams4tal = 0;
  for (const r of teamRows) {
    totaalTeams += Number(r.aantal);
    if (r.spelvorm === "8-tal") teams8tal = Number(r.aantal);
    if (r.spelvorm === "4-tal") teams4tal = Number(r.aantal);
  }

  const geslacht = { M: 0, V: 0 };
  for (const r of geslachtRows) {
    if (r.geslacht === "M") geslacht.M = Number(r.aantal);
    if (r.geslacht === "V") geslacht.V = Number(r.aantal);
  }

  return {
    seizoen,
    totaal_spelers: spelerCount[0]?.totaal ?? 0,
    totaal_teams: totaalTeams,
    teams_8tal: teams8tal,
    teams_4tal: teams4tal,
    signalering_kritiek: signaleringen.filter((s) => s.ernst === "kritiek").length,
    signalering_aandacht: signaleringen.filter((s) => s.ernst === "aandacht").length,
    geslacht,
  };
}
