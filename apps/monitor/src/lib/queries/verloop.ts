import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerloopLeeftijdRow = {
  leeftijd: number;
  M: number;
  V: number;
  totaal: number;
};

export type RetentieLeeftijdRow = {
  leeftijd: number;
  aanwezig_totaal: number;
  terug_totaal: number;
  retentie_totaal: number | null;
  aanwezig_M: number;
  terug_M: number;
  retentie_M: number | null;
  aanwezig_V: number;
  terug_V: number;
  retentie_V: number | null;
};

export type InstroomUitstroomResult = {
  instroom_per_leeftijd: VerloopLeeftijdRow[];
  uitstroom_per_leeftijd: VerloopLeeftijdRow[];
  retentie_alle_seizoenen: RetentieLeeftijdRow[];
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Instroom per leeftijd (all-time) */
export async function getInstroomPerLeeftijd(): Promise<VerloopLeeftijdRow[]> {
  const rows = await prisma.$queryRaw<{ leeftijd: number; m: number; v: number; totaal: number }[]>`
    SELECT leeftijd_nieuw AS leeftijd,
           COUNT(*) FILTER (WHERE geslacht = 'M')::int AS m,
           COUNT(*) FILTER (WHERE geslacht = 'V')::int AS v,
           COUNT(*)::int AS totaal
    FROM ledenverloop
    WHERE status IN ('nieuw', 'herinschrijver')
      AND leeftijd_nieuw IS NOT NULL
    GROUP BY leeftijd_nieuw
    ORDER BY leeftijd_nieuw`;

  return rows.map((r) => ({
    leeftijd: r.leeftijd,
    M: Number(r.m),
    V: Number(r.v),
    totaal: Number(r.totaal),
  }));
}

/** Uitstroom per leeftijd (all-time) */
export async function getUitstroomPerLeeftijd(): Promise<VerloopLeeftijdRow[]> {
  const rows = await prisma.$queryRaw<{ leeftijd: number; m: number; v: number; totaal: number }[]>`
    SELECT leeftijd_vorig AS leeftijd,
           COUNT(*) FILTER (WHERE geslacht = 'M')::int AS m,
           COUNT(*) FILTER (WHERE geslacht = 'V')::int AS v,
           COUNT(*)::int AS totaal
    FROM ledenverloop
    WHERE status IN ('uitgestroomd', 'niet_spelend_geworden')
      AND leeftijd_vorig IS NOT NULL
    GROUP BY leeftijd_vorig
    ORDER BY leeftijd_vorig`;

  return rows.map((r) => ({
    leeftijd: r.leeftijd,
    M: Number(r.m),
    V: Number(r.v),
    totaal: Number(r.totaal),
  }));
}

/** Retentie per leeftijd (all-time, alle seizoenen gecombineerd) */
export async function getRetentiePerLeeftijd(): Promise<RetentieLeeftijdRow[]> {
  const rows = await prisma.$queryRaw<
    {
      leeftijd: number;
      aanwezig_totaal: number;
      terug_totaal: number;
      retentie_totaal: number | null;
      aanwezig_m: number;
      terug_m: number;
      retentie_m: number | null;
      aanwezig_v: number;
      terug_v: number;
      retentie_v: number | null;
    }[]
  >`
    WITH aanwezig AS (
      SELECT seizoen, geslacht, leeftijd_vorig AS leeftijd, COUNT(*)::int AS n
      FROM ledenverloop
      WHERE leeftijd_vorig IS NOT NULL
        AND status NOT IN ('nieuw', 'herinschrijver')
      GROUP BY seizoen, geslacht, leeftijd_vorig
    ),
    terug AS (
      SELECT seizoen, geslacht, leeftijd_vorig AS leeftijd, COUNT(*)::int AS n
      FROM ledenverloop
      WHERE status = 'behouden'
        AND leeftijd_vorig IS NOT NULL
      GROUP BY seizoen, geslacht, leeftijd_vorig
    )
    SELECT
      a.leeftijd,
      SUM(a.n)::int AS aanwezig_totaal,
      COALESCE(SUM(t.n), 0)::int AS terug_totaal,
      ROUND(COALESCE(SUM(t.n), 0)::numeric / NULLIF(SUM(a.n), 0), 3) AS retentie_totaal,
      SUM(a.n) FILTER (WHERE a.geslacht = 'M')::int AS aanwezig_m,
      COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'M'), 0)::int AS terug_m,
      ROUND(COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'M'), 0)::numeric
        / NULLIF(SUM(a.n) FILTER (WHERE a.geslacht = 'M'), 0), 3) AS retentie_m,
      SUM(a.n) FILTER (WHERE a.geslacht = 'V')::int AS aanwezig_v,
      COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'V'), 0)::int AS terug_v,
      ROUND(COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'V'), 0)::numeric
        / NULLIF(SUM(a.n) FILTER (WHERE a.geslacht = 'V'), 0), 3) AS retentie_v
    FROM aanwezig a
    LEFT JOIN terug t ON a.seizoen = t.seizoen AND a.geslacht = t.geslacht AND a.leeftijd = t.leeftijd
    GROUP BY a.leeftijd
    ORDER BY a.leeftijd`;

  return rows.map((r) => ({
    leeftijd: r.leeftijd,
    aanwezig_totaal: Number(r.aanwezig_totaal),
    terug_totaal: Number(r.terug_totaal),
    retentie_totaal: r.retentie_totaal ? Number(r.retentie_totaal) : null,
    aanwezig_M: Number(r.aanwezig_m),
    terug_M: Number(r.terug_m),
    retentie_M: r.retentie_m ? Number(r.retentie_m) : null,
    aanwezig_V: Number(r.aanwezig_v),
    terug_V: Number(r.terug_v),
    retentie_V: r.retentie_v ? Number(r.retentie_v) : null,
  }));
}

// ---------------------------------------------------------------------------
// Seizoen-detail: instroom + uitstroom per seizoen
// ---------------------------------------------------------------------------

export type SeizoenVerloopLid = {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: string;
  geboortejaar: number | null;
  status: string;
  teamVorig: string | null;
  teamNieuw: string | null;
};

export type SeizoenVerloopResult = {
  seizoen: string;
  instroom: SeizoenVerloopLid[];
  uitstroom: SeizoenVerloopLid[];
  behouden: number;
  totaalVorig: number;
  totaalNieuw: number;
};

export async function getSeizoenVerloop(seizoen: string): Promise<SeizoenVerloopResult> {
  const rows = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string;
      achternaam: string;
      tussenvoegsel: string | null;
      geslacht: string;
      geboortejaar: number | null;
      status: string;
      team_vorig: string | null;
      team_nieuw: string | null;
    }[]
  >`
    SELECT lv.rel_code, l.roepnaam, l.achternaam, l.tussenvoegsel,
           lv.geslacht, lv.geboortejaar, lv.status,
           lv.team_vorig, lv.team_nieuw
    FROM ledenverloop lv
    JOIN leden l ON lv.rel_code = l.rel_code
    WHERE lv.seizoen = ${seizoen}
    ORDER BY lv.geboortejaar ASC NULLS LAST, l.achternaam, l.roepnaam`;

  const mapped = rows.map((r) => ({
    relCode: r.rel_code,
    roepnaam: r.roepnaam,
    achternaam: r.achternaam,
    tussenvoegsel: r.tussenvoegsel,
    geslacht: r.geslacht,
    geboortejaar: r.geboortejaar ? Number(r.geboortejaar) : null,
    status: r.status,
    teamVorig: r.team_vorig,
    teamNieuw: r.team_nieuw,
  }));

  const instroom = mapped.filter((r) => r.status === "nieuw" || r.status === "herinschrijver");
  const uitstroom = mapped.filter((r) => r.status === "uitgestroomd");
  const behouden = mapped.filter((r) => r.status === "behouden").length;

  // Totalen: vorig seizoen = behouden + uitstroom, nieuw seizoen = behouden + instroom
  return {
    seizoen,
    instroom,
    uitstroom,
    behouden,
    totaalVorig: behouden + uitstroom.length,
    totaalNieuw: behouden + instroom.length,
  };
}

/** Gecombineerd: instroom + uitstroom + retentie */
export async function getInstroomUitstroom(): Promise<InstroomUitstroomResult> {
  const [instroom, uitstroom, retentie] = await Promise.all([
    getInstroomPerLeeftijd(),
    getUitstroomPerLeeftijd(),
    getRetentiePerLeeftijd(),
  ]);

  return {
    instroom_per_leeftijd: instroom,
    uitstroom_per_leeftijd: uitstroom,
    retentie_alle_seizoenen: retentie,
  };
}
