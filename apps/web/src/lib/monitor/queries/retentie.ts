import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { isLopendSeizoen } from "@/lib/monitor/utils/seizoen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CohortRetentieRij = {
  instroomSeizoen: string;
  cohortGrootte: number;
  retentie: { jarenNaInstroom: number; actief: number; percentage: number }[];
};

export type EersteSeizoenRetentieRij = {
  instroomSeizoen: string;
  totaalNieuw: number;
  terugSeizoen2: number;
  retentiePct: number;
  retentiePctM: number | null;
  retentiePctV: number | null;
};

export type SeizoenMVLeeftijdRow = {
  seizoen: string;
  isLopend: boolean;
  M: number;
  V: number;
  totaal: number;
  jeugdM: number;
  jeugdV: number;
  jeugdTotaal: number;
  seniorenM: number;
  seniorenV: number;
  seniorenTotaal: number;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Cohort retentie matrix: per instroom-seizoen, % actief na 1, 2, ... N jaar */
export async function getCohortRetentieMatrix(): Promise<CohortRetentieRij[]> {
  const rows = await prisma.$queryRaw<
    {
      instroom_seizoen: string;
      cohort_grootte: number;
      jaren_na_instroom: number;
      actief: number;
    }[]
  >`
    WITH instroom_cohort AS (
      SELECT rel_code, MIN(seizoen) AS instroom_seizoen
      FROM ledenverloop WHERE status = 'nieuw'
      GROUP BY rel_code
    ),
    actief_per_seizoen AS (
      SELECT ic.rel_code, ic.instroom_seizoen, cs.seizoen,
        SPLIT_PART(cs.seizoen, '-', 1)::int - SPLIT_PART(ic.instroom_seizoen, '-', 1)::int AS jaren
      FROM instroom_cohort ic
      JOIN competitie_spelers cs ON cs.rel_code = ic.rel_code
    )
    SELECT instroom_seizoen,
      (SELECT COUNT(*)::int FROM instroom_cohort ic2
       WHERE ic2.instroom_seizoen = a.instroom_seizoen) AS cohort_grootte,
      jaren AS jaren_na_instroom,
      COUNT(DISTINCT rel_code)::int AS actief
    FROM actief_per_seizoen a
    WHERE jaren >= 0
    GROUP BY instroom_seizoen, jaren
    ORDER BY instroom_seizoen, jaren`;

  const grouped = new Map<string, { grootte: number; retentie: Map<number, number> }>();
  for (const r of rows) {
    if (!grouped.has(r.instroom_seizoen)) {
      grouped.set(r.instroom_seizoen, {
        grootte: Number(r.cohort_grootte),
        retentie: new Map(),
      });
    }
    grouped.get(r.instroom_seizoen)!.retentie.set(Number(r.jaren_na_instroom), Number(r.actief));
  }

  return [...grouped.entries()].map(([seizoen, { grootte, retentie }]) => ({
    instroomSeizoen: seizoen,
    cohortGrootte: grootte,
    retentie: [...retentie.entries()]
      .sort(([a], [b]) => a - b)
      .map(([jaren, actief]) => ({
        jarenNaInstroom: jaren,
        actief,
        percentage: grootte > 0 ? Math.round((actief / grootte) * 1000) / 10 : 0,
      })),
  }));
}

/** Eerste-seizoen retentie: % nieuwe leden dat terugkeert voor seizoen 2, M/V split */
export async function getEersteSeizoenRetentie(): Promise<EersteSeizoenRetentieRij[]> {
  const rows = await prisma.$queryRaw<
    {
      seizoen: string;
      totaal_nieuw: number;
      terug: number;
      nieuw_m: number;
      terug_m: number;
      nieuw_v: number;
      terug_v: number;
    }[]
  >`
    WITH nieuw AS (
      SELECT rel_code, seizoen, geslacht
      FROM ledenverloop WHERE status = 'nieuw'
    ),
    volgend AS (
      SELECT n.rel_code, n.seizoen, n.geslacht
      FROM nieuw n
      JOIN ledenverloop lv ON lv.rel_code = n.rel_code
        AND lv.seizoen = (SPLIT_PART(n.seizoen,'-',1)::int+1)::text||'-'||(SPLIT_PART(n.seizoen,'-',2)::int+1)::text
        AND lv.status = 'behouden'
    )
    SELECT n.seizoen,
      COUNT(DISTINCT n.rel_code)::int AS totaal_nieuw,
      COUNT(DISTINCT v.rel_code)::int AS terug,
      COUNT(DISTINCT n.rel_code) FILTER (WHERE n.geslacht='M')::int AS nieuw_m,
      COUNT(DISTINCT v.rel_code) FILTER (WHERE n.geslacht='M')::int AS terug_m,
      COUNT(DISTINCT n.rel_code) FILTER (WHERE n.geslacht='V')::int AS nieuw_v,
      COUNT(DISTINCT v.rel_code) FILTER (WHERE n.geslacht='V')::int AS terug_v
    FROM nieuw n LEFT JOIN volgend v ON n.rel_code = v.rel_code AND n.seizoen = v.seizoen
    GROUP BY n.seizoen ORDER BY n.seizoen`;

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

  return rows.map((r) => {
    const totaal = Number(r.totaal_nieuw);
    const terug = Number(r.terug);
    const nM = Number(r.nieuw_m);
    const tM = Number(r.terug_m);
    const nV = Number(r.nieuw_v);
    const tV = Number(r.terug_v);
    return {
      instroomSeizoen: r.seizoen,
      totaalNieuw: totaal,
      terugSeizoen2: terug,
      retentiePct: pct(terug, totaal),
      retentiePctM: nM > 0 ? pct(tM, nM) : null,
      retentiePctV: nV > 0 ? pct(tV, nV) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Instroom/uitstroom per seizoen met jeugd/senioren split
// ---------------------------------------------------------------------------

type RawMVLeeftijd = {
  seizoen: string;
  m: number;
  v: number;
  totaal: number;
  jeugd_m: number;
  jeugd_v: number;
  jeugd_totaal: number;
  senioren_m: number;
  senioren_v: number;
  senioren_totaal: number;
};

function mapMVLeeftijd(rows: RawMVLeeftijd[]): SeizoenMVLeeftijdRow[] {
  return rows.map((r) => ({
    seizoen: r.seizoen,
    isLopend: isLopendSeizoen(r.seizoen),
    M: Number(r.m),
    V: Number(r.v),
    totaal: Number(r.totaal),
    jeugdM: Number(r.jeugd_m),
    jeugdV: Number(r.jeugd_v),
    jeugdTotaal: Number(r.jeugd_totaal),
    seniorenM: Number(r.senioren_m),
    seniorenV: Number(r.senioren_v),
    seniorenTotaal: Number(r.senioren_totaal),
  }));
}

/** Instroom per seizoen, gesplitst naar geslacht + jeugd/senioren */
export async function getInstroomPerSeizoenMVLeeftijd(): Promise<SeizoenMVLeeftijdRow[]> {
  const rows = await prisma.$queryRaw<RawMVLeeftijd[]>`
    SELECT seizoen,
      COUNT(*) FILTER (WHERE geslacht = 'M')::int AS m,
      COUNT(*) FILTER (WHERE geslacht = 'V')::int AS v,
      COUNT(*)::int AS totaal,
      COUNT(*) FILTER (WHERE geslacht = 'M' AND leeftijd_nieuw <= 18)::int AS jeugd_m,
      COUNT(*) FILTER (WHERE geslacht = 'V' AND leeftijd_nieuw <= 18)::int AS jeugd_v,
      COUNT(*) FILTER (WHERE leeftijd_nieuw <= 18)::int AS jeugd_totaal,
      COUNT(*) FILTER (WHERE geslacht = 'M' AND leeftijd_nieuw > 18)::int AS senioren_m,
      COUNT(*) FILTER (WHERE geslacht = 'V' AND leeftijd_nieuw > 18)::int AS senioren_v,
      COUNT(*) FILTER (WHERE leeftijd_nieuw > 18)::int AS senioren_totaal
    FROM ledenverloop
    WHERE status IN ('nieuw', 'herinschrijver') AND leeftijd_nieuw IS NOT NULL
    GROUP BY seizoen ORDER BY seizoen`;
  return mapMVLeeftijd(rows);
}

/** Uitstroom per seizoen, gesplitst naar geslacht + jeugd/senioren */
export async function getUitstroomPerSeizoenMVLeeftijd(): Promise<SeizoenMVLeeftijdRow[]> {
  const rows = await prisma.$queryRaw<RawMVLeeftijd[]>`
    SELECT seizoen,
      COUNT(*) FILTER (WHERE geslacht = 'M')::int AS m,
      COUNT(*) FILTER (WHERE geslacht = 'V')::int AS v,
      COUNT(*)::int AS totaal,
      COUNT(*) FILTER (WHERE geslacht = 'M' AND leeftijd_vorig <= 18)::int AS jeugd_m,
      COUNT(*) FILTER (WHERE geslacht = 'V' AND leeftijd_vorig <= 18)::int AS jeugd_v,
      COUNT(*) FILTER (WHERE leeftijd_vorig <= 18)::int AS jeugd_totaal,
      COUNT(*) FILTER (WHERE geslacht = 'M' AND leeftijd_vorig > 18)::int AS senioren_m,
      COUNT(*) FILTER (WHERE geslacht = 'V' AND leeftijd_vorig > 18)::int AS senioren_v,
      COUNT(*) FILTER (WHERE leeftijd_vorig > 18)::int AS senioren_totaal
    FROM ledenverloop
    WHERE status IN ('uitgestroomd', 'niet_spelend_geworden') AND leeftijd_vorig IS NOT NULL
    GROUP BY seizoen ORDER BY seizoen`;
  return mapMVLeeftijd(rows);
}

// ---------------------------------------------------------------------------
// Waterfall data (voor Retentie-tab)
// ---------------------------------------------------------------------------

export type WaterfallData = {
  seizoen: string;
  behouden: number;
  instroomNieuw: number;
  instroomTerug: number;
  uitstroom: number;
};

/** Waterfall-getallen voor het meest recente AFGERONDE seizoen (excl. lopend) */
export async function getWaterfallData(): Promise<WaterfallData | null> {
  const seizoenRow = await prisma.$queryRaw<{ seizoen: string }[]>`
    SELECT DISTINCT seizoen FROM ledenverloop
    WHERE seizoen != ${HUIDIG_SEIZOEN}
    ORDER BY seizoen DESC LIMIT 1`;
  const seizoen = seizoenRow[0]?.seizoen;
  if (!seizoen) return null;

  const rows = await prisma.$queryRaw<{ status: string; aantal: number }[]>`
    SELECT status, COUNT(*)::int AS aantal
    FROM ledenverloop WHERE seizoen = ${seizoen}
    GROUP BY status`;

  let behouden = 0,
    nieuw = 0,
    terug = 0,
    uit = 0;
  for (const r of rows) {
    const n = Number(r.aantal);
    if (r.status === "behouden") behouden = n;
    else if (r.status === "nieuw") nieuw = n;
    else if (r.status === "herinschrijver") terug = n;
    else if (r.status === "uitgestroomd" || r.status === "niet_spelend_geworden") uit += n;
  }

  return { seizoen, behouden, instroomNieuw: nieuw, instroomTerug: terug, uitstroom: uit };
}

/** Waterfall-getallen voor het LOPENDE seizoen (voorlopig) */
export async function getWaterfallDataLopend(): Promise<WaterfallData | null> {
  const rows = await prisma.$queryRaw<{ status: string; aantal: number }[]>`
    SELECT status, COUNT(*)::int AS aantal
    FROM ledenverloop WHERE seizoen = ${HUIDIG_SEIZOEN}
    GROUP BY status`;

  if (rows.length === 0) return null;

  let behouden = 0,
    nieuw = 0,
    terug = 0,
    uit = 0;
  for (const r of rows) {
    const n = Number(r.aantal);
    if (r.status === "behouden") behouden = n;
    else if (r.status === "nieuw") nieuw = n;
    else if (r.status === "herinschrijver") terug = n;
    else if (r.status === "uitgestroomd" || r.status === "niet_spelend_geworden") uit += n;
  }

  return {
    seizoen: HUIDIG_SEIZOEN,
    behouden,
    instroomNieuw: nieuw,
    instroomTerug: terug,
    uitstroom: uit,
  };
}

// ---------------------------------------------------------------------------
// Netto groei (voor dashboard KPI)
// ---------------------------------------------------------------------------

export type NettoGroei = {
  seizoen: string;
  isLopend: boolean;
  instroom: number;
  uitstroom: number;
  netto: number;
};

/** Netto groei voor een seizoen (instroom - uitstroom) */
export async function getNettoGroei(seizoen: string): Promise<NettoGroei> {
  const rows = await prisma.$queryRaw<{ instroom: number; uitstroom: number }[]>`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('nieuw', 'herinschrijver'))::int AS instroom,
      COUNT(*) FILTER (WHERE status IN ('uitgestroomd', 'niet_spelend_geworden'))::int AS uitstroom
    FROM ledenverloop WHERE seizoen = ${seizoen}`;

  const r = rows[0] ?? { instroom: 0, uitstroom: 0 };
  const instroom = Number(r.instroom);
  const uitstroom = Number(r.uitstroom);
  return {
    seizoen,
    isLopend: isLopendSeizoen(seizoen),
    instroom,
    uitstroom,
    netto: instroom - uitstroom,
  };
}
