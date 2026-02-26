import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CohortSeizoenData = {
  leeftijd: number | null;
  band: string | null;
  actief: number;
  behouden: number;
  nieuw: number;
  herinschrijver: number;
  uitgestroomd: number;
  retentie_pct: number | null;
};

export type Cohort = {
  geboortejaar: number;
  geslacht: string;
  seizoenen: Record<string, CohortSeizoenData>;
};

export type SeizoenTotaal = {
  seizoen: string;
  totaal_vorig: number | null;
  totaal_nieuw: number;
  behouden: number;
  nieuw: number;
  herinschrijver: number;
  uitgestroomd: number;
  retentie_pct: number | null;
  netto_groei: number | null;
  netto_groei_pct: number | null;
};

export type LeeftijdsgroepSeizoen = {
  retentie_pct: number | null;
  instroom: number;
  uitstroom: number;
};

export type Leeftijdsgroep = {
  groep: string;
  per_seizoen: Record<string, LeeftijdsgroepSeizoen>;
};

export type InstroomLeeftijd = {
  seizoen: string;
  totaal_instroom: number;
  verdeling: Record<string, number>;
};

export type CohortResult = {
  seizoenen: string[];
  per_cohort: Cohort[];
  totalen: {
    per_seizoen: SeizoenTotaal[];
    per_leeftijdsgroep: Leeftijdsgroep[];
    instroom_leeftijd: InstroomLeeftijd[];
  };
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export type CohortRow = {
  geboortejaar: number;
  geslacht: string;
  seizoen: string;
  leeftijd: number | null;
  band: string | null;
  actief: number;
  behouden: number;
  nieuw: number;
  herinschrijver: number;
  uitgestroomd: number;
  retentie_pct: string | null;
};

/** Groepeer platte cohort-rows per (geboortejaar, geslacht) */
export function groepeerCohortRows(rows: CohortRow[]): Cohort[] {
  const cohortMap = new Map<string, Cohort>();
  for (const r of rows) {
    const key = `${r.geboortejaar}_${r.geslacht}`;
    if (!cohortMap.has(key)) {
      cohortMap.set(key, {
        geboortejaar: r.geboortejaar,
        geslacht: r.geslacht,
        seizoenen: {},
      });
    }
    cohortMap.get(key)!.seizoenen[r.seizoen] = {
      leeftijd: r.leeftijd,
      band: r.band,
      actief: Number(r.actief),
      behouden: Number(r.behouden),
      nieuw: Number(r.nieuw),
      herinschrijver: Number(r.herinschrijver),
      uitgestroomd: Number(r.uitgestroomd),
      retentie_pct: r.retentie_pct ? parseFloat(r.retentie_pct) : null,
    };
  }
  return [...cohortMap.values()];
}

export type SeizoenTotaalRow = {
  seizoen: string;
  totaal: number;
  behouden: number;
  nieuw: number;
  herinschrijver: number;
  uitgestroomd: number;
};

/** Bereken seizoen-totalen met retentie en groei t.o.v. vorig seizoen */
export function berekenSeizoenTotalen(rows: SeizoenTotaalRow[]): SeizoenTotaal[] {
  const perSeizoen: SeizoenTotaal[] = [];
  let vorig: number | null = null;
  for (const r of rows) {
    const totaal = Number(r.totaal);
    const behouden = Number(r.behouden);
    const nieuw = Number(r.nieuw);
    const herinschrijver = Number(r.herinschrijver);
    const uitgestroomd = Number(r.uitgestroomd);
    perSeizoen.push({
      seizoen: r.seizoen,
      totaal_vorig: vorig,
      totaal_nieuw: totaal,
      behouden,
      nieuw,
      herinschrijver,
      uitgestroomd,
      retentie_pct:
        vorig !== null && vorig > 0
          ? parseFloat(((behouden / vorig) * 100).toFixed(1))
          : null,
      netto_groei: vorig !== null ? totaal - vorig : null,
      netto_groei_pct:
        vorig !== null && vorig > 0
          ? parseFloat((((totaal - vorig) / vorig) * 100).toFixed(1))
          : null,
    });
    vorig = totaal;
  }
  return perSeizoen;
}

export type LeeftijdRow = {
  seizoen: string;
  leeftijd: number;
  behouden: number;
  actief: number;
  instroom: number;
  uitstroom: number;
};

export const GROEP_RANGES = [
  { groep: "6-12", min: 6, max: 12 },
  { groep: "13-18", min: 13, max: 18 },
  { groep: "19+", min: 19, max: 99 },
] as const;

/** Aggregeer leeftijd-rows naar leeftijdsgroepen met retentie */
export function aggregeerLeeftijdsgroepen(rows: LeeftijdRow[]): Leeftijdsgroep[] {
  return GROEP_RANGES.map((gr) => {
    const perSz: Record<
      string,
      { behouden: number; actief: number; instroom: number; uitstroom: number }
    > = {};

    for (const r of rows) {
      if (r.leeftijd >= gr.min && r.leeftijd <= gr.max) {
        if (!perSz[r.seizoen])
          perSz[r.seizoen] = {
            behouden: 0,
            actief: 0,
            instroom: 0,
            uitstroom: 0,
          };
        perSz[r.seizoen].behouden += Number(r.behouden);
        perSz[r.seizoen].actief += Number(r.actief);
        perSz[r.seizoen].instroom += Number(r.instroom);
        perSz[r.seizoen].uitstroom += Number(r.uitstroom);
      }
    }

    const perSeizoenObj: Record<string, LeeftijdsgroepSeizoen> = {};
    for (const [sz, d] of Object.entries(perSz)) {
      const vorigSeizoen = d.behouden + d.uitstroom;
      perSeizoenObj[sz] = {
        retentie_pct:
          vorigSeizoen > 0
            ? parseFloat(((d.behouden / vorigSeizoen) * 100).toFixed(1))
            : null,
        instroom: d.instroom,
        uitstroom: d.uitstroom,
      };
    }

    return { groep: gr.groep, per_seizoen: perSeizoenObj };
  });
}

export type InstroomRow = {
  seizoen: string;
  geboortejaar: number;
  instroom: number;
};

/** Bereken leeftijdsbucket voor instroom: "<5", "5".."14", "15+" */
export function instroomBucket(seizoen: string, geboortejaar: number): string {
  const startJaar = parseInt(seizoen.split("-")[0]);
  const leeftijd = startJaar - geboortejaar;
  return leeftijd < 5 ? "<5" : leeftijd >= 15 ? "15+" : String(leeftijd);
}

/** Groepeer instroom-rows per seizoen met leeftijdsbuckets */
export function groepeerInstroom(rows: InstroomRow[]): InstroomLeeftijd[] {
  const instroomPerSeizoen: Record<
    string,
    { verdeling: Record<string, number>; totaal: number }
  > = {};
  for (const r of rows) {
    if (!instroomPerSeizoen[r.seizoen])
      instroomPerSeizoen[r.seizoen] = { verdeling: {}, totaal: 0 };
    const bucket = instroomBucket(r.seizoen, r.geboortejaar);
    const n = Number(r.instroom);
    instroomPerSeizoen[r.seizoen].verdeling[bucket] =
      (instroomPerSeizoen[r.seizoen].verdeling[bucket] || 0) + n;
    instroomPerSeizoen[r.seizoen].totaal += n;
  }

  return Object.entries(instroomPerSeizoen)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([seizoen, d]) => ({
      seizoen,
      totaal_instroom: d.totaal,
      verdeling: d.verdeling,
    }));
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getCohorten(): Promise<CohortResult> {
  // 1. Alle seizoenen
  const seizoenenRows = await prisma.seizoen.findMany({
    select: { seizoen: true },
    orderBy: { seizoen: "asc" },
  });
  const seizoenen = seizoenenRows.map((r) => r.seizoen);

  // 2. Per cohort data
  const cohortRows = await prisma.$queryRaw<CohortRow[]>`
    SELECT geboortejaar, geslacht, seizoen, leeftijd, band,
           actief, behouden, nieuw, herinschrijver, uitgestroomd, retentie_pct
    FROM cohort_seizoenen
    ORDER BY geboortejaar DESC, geslacht, seizoen`;

  const per_cohort = groepeerCohortRows(cohortRows);

  // 3. Totalen per seizoen
  const totSeizoenRows = await prisma.$queryRaw<SeizoenTotaalRow[]>`
    SELECT seizoen,
           SUM(actief)::int AS totaal,
           SUM(behouden)::int AS behouden,
           SUM(nieuw)::int AS nieuw,
           SUM(herinschrijver)::int AS herinschrijver,
           SUM(uitgestroomd)::int AS uitgestroomd
    FROM cohort_seizoenen
    GROUP BY seizoen
    ORDER BY seizoen`;

  const perSeizoen = berekenSeizoenTotalen(totSeizoenRows);

  // 4. Per leeftijdsgroep
  const leeftGroepRows = await prisma.$queryRaw<LeeftijdRow[]>`
    SELECT seizoen, leeftijd,
           SUM(behouden)::int AS behouden,
           SUM(actief)::int AS actief,
           SUM(nieuw + herinschrijver)::int AS instroom,
           SUM(uitgestroomd)::int AS uitstroom
    FROM cohort_seizoenen
    WHERE leeftijd IS NOT NULL
    GROUP BY seizoen, leeftijd
    ORDER BY seizoen, leeftijd`;

  const perLeeftijdsgroep = aggregeerLeeftijdsgroepen(leeftGroepRows);

  // 5. Instroom per leeftijd per seizoen
  const instroomRows = await prisma.$queryRaw<InstroomRow[]>`
    SELECT seizoen, geboortejaar,
           SUM(nieuw + herinschrijver)::int AS instroom
    FROM cohort_seizoenen
    WHERE (nieuw + herinschrijver) > 0
    GROUP BY seizoen, geboortejaar
    ORDER BY seizoen, geboortejaar`;

  const instroomLeeftijd = groepeerInstroom(instroomRows);

  return {
    seizoenen,
    per_cohort,
    totalen: {
      per_seizoen: perSeizoen,
      per_leeftijdsgroep: perLeeftijdsgroep,
      instroom_leeftijd: instroomLeeftijd,
    },
  };
}
