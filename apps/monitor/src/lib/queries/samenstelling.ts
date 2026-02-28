import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Per geboortejaar
// ---------------------------------------------------------------------------

export type GeboortejaarRow = {
  geboortejaar: number | null;
  geslacht: string;
  aantal: number;
  a_categorie: string | null;
  a_jaars: string | null;
};

export type GeboortejaarResult = {
  meta: { datum: Date | null; seizoen: string };
  data: GeboortejaarRow[];
};

export async function getPerGeboortejaar(seizoen: string): Promise<GeboortejaarResult> {
  const startJaar = parseInt(seizoen.split("-")[0]);

  const rows = await prisma.$queryRaw<GeboortejaarRow[]>`
    SELECT
      l.geboortejaar,
      l.geslacht,
      COUNT(DISTINCT cp.rel_code)::int AS aantal,
      CASE
        WHEN (${startJaar} - l.geboortejaar) <= 5 THEN 'Kangoeroes'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 6 AND 7 THEN 'F-jeugd'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 8 AND 9 THEN 'E-jeugd'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 10 AND 11 THEN 'D-jeugd'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 12 AND 13 THEN 'C-jeugd'
        WHEN (${startJaar} - l.geboortejaar) = 14 THEN 'U15-1'
        WHEN (${startJaar} - l.geboortejaar) = 15 THEN 'U15'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 16 AND 17 THEN 'U17'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 18 AND 19 THEN 'U19'
        WHEN (${startJaar} - l.geboortejaar) >= 20 THEN 'Senioren'
        ELSE 'Overig'
      END AS a_categorie,
      CASE
        WHEN (${startJaar} - l.geboortejaar) IN (13, 15, 17) THEN '1e-jaars'
        WHEN (${startJaar} - l.geboortejaar) IN (14, 16, 18) THEN '2e-jaars'
        ELSE NULL
      END AS a_jaars
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = ${seizoen}
    GROUP BY l.geboortejaar, l.geslacht,
             (${startJaar} - l.geboortejaar)
    ORDER BY l.geboortejaar, l.geslacht`;

  return {
    meta: { datum: null, seizoen },
    data: rows.map((r) => ({
      geboortejaar: r.geboortejaar,
      geslacht: r.geslacht,
      aantal: Number(r.aantal),
      a_categorie: r.a_categorie || null,
      a_jaars: r.a_jaars || null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Groei-factoren: historische netto groei per leeftijd per geslacht
// ---------------------------------------------------------------------------

type GroeiFactoren = { M: Record<number, number>; V: Record<number, number> };

/**
 * Haal historische netto groei-factoren op uit cohort_seizoenen.
 * Factor = gemiddelde(actief bij leeftijd L / actief bij leeftijd L-1) per cohort.
 * Factor > 1 = cohort groeit (instroom > uitstroom), < 1 = cohort krimpt.
 * COVID-seizoenen (2020-2022) worden uitgesloten.
 */
async function getGroeiFactoren(): Promise<GroeiFactoren> {
  const rows = await prisma.$queryRaw<
    { leeftijd: number; geslacht: string; groei_factor: string }[]
  >`
    WITH opeenvolgend AS (
      SELECT c1.leeftijd, c1.geslacht,
             c1.actief AS actief_nu, c0.actief AS actief_vorig
      FROM cohort_seizoenen c1
      JOIN cohort_seizoenen c0
        ON c1.geboortejaar = c0.geboortejaar
        AND c1.geslacht = c0.geslacht
        AND c1.leeftijd = c0.leeftijd + 1
      WHERE c1.actief > 0 AND c0.actief > 0
        AND c1.seizoen NOT IN ('2020-2021', '2021-2022')
    )
    SELECT leeftijd, geslacht,
           ROUND(AVG(actief_nu::numeric / actief_vorig), 3) AS groei_factor
    FROM opeenvolgend
    WHERE leeftijd BETWEEN 6 AND 19
    GROUP BY leeftijd, geslacht
    ORDER BY leeftijd, geslacht`;

  const M: Record<number, number> = {};
  const V: Record<number, number> = {};
  for (const r of rows) {
    const factor = parseFloat(r.groei_factor);
    if (r.geslacht === "M") M[r.leeftijd] = factor;
    else V[r.leeftijd] = factor;
  }
  return { M, V };
}

// ---------------------------------------------------------------------------
// Projectie: U17 + Senioren doorstroom
// ---------------------------------------------------------------------------

const U17_DOEL_M = 25;
const U17_DOEL_V = 25;
const _U17_DOEL = 50;

export type ProjectieRij = {
  seizoen: string;
  geboortejaar1eJaars: number;
  geboortejaar2eJaars: number;
  projM1: number;
  projV1: number;
  projM2: number;
  projV2: number;
  totaalM: number;
  totaalV: number;
  totaal: number;
  doelM: number;
  doelV: number;
  gapM: number;
  gapV: number;
  teams: number;
};

export type SeniorenRij = {
  seizoen: string;
  geboortejaar1: number;
  geboortejaar2: number;
  projM: number;
  projV: number;
  totaal: number;
};

export type ProjectieResult = {
  u17: ProjectieRij[];
  senioren: SeniorenRij[];
};

/**
 * Projecteer cohort-groei met historische netto groei-factoren.
 * Factoren komen uit cohort_seizoenen data en bevatten zowel retentie als instroom.
 * Factor > 1 = cohort groeit, < 1 = cohort krimpt.
 */
export async function getProjectie(seizoen: string): Promise<ProjectieResult> {
  const startJaar = parseInt(seizoen.split("-")[0]);

  // Haal groei-factoren en huidige aantallen parallel op
  const [groei, rows] = await Promise.all([
    getGroeiFactoren(),
    prisma.$queryRaw<{ geboortejaar: number; geslacht: string; aantal: number }[]>`
      SELECT l.geboortejaar, l.geslacht, COUNT(DISTINCT cp.rel_code)::int AS aantal
      FROM competitie_spelers cp
      JOIN leden l ON cp.rel_code = l.rel_code
      WHERE cp.seizoen = ${seizoen}
        AND l.geboortejaar IS NOT NULL
      GROUP BY l.geboortejaar, l.geslacht`,
  ]);

  // Bouw lookup: geboortejaar → { M, V }
  const cohorten = new Map<number, { M: number; V: number }>();
  for (const r of rows) {
    const existing = cohorten.get(r.geboortejaar) || { M: 0, V: 0 };
    if (r.geslacht === "M") existing.M = Number(r.aantal);
    else existing.V = Number(r.aantal);
    cohorten.set(r.geboortejaar, existing);
  }

  // Projecteer een cohort vooruit met groei-factoren per leeftijdsjaar
  function projecteer(
    huidigAantal: number,
    huidigeLeeftijd: number,
    doelLeeftijd: number,
    factoren: Record<number, number>
  ): number {
    let n = huidigAantal;
    for (let l = huidigeLeeftijd + 1; l <= doelLeeftijd; l++) {
      n *= factoren[l] ?? 0.85;
    }
    return Math.round(n * 10) / 10;
  }

  // U17-projectie: 5 seizoenen vooruit
  // U17 = leeftijd 16-17 (1e-jaars = 16, 2e-jaars = 17)
  const u17: ProjectieRij[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const projSeizoenStart = startJaar + offset;
    const projSeizoen = `${projSeizoenStart}-${projSeizoenStart + 1}`;
    const gj1 = projSeizoenStart - 16; // 1e-jaars U17
    const gj2 = projSeizoenStart - 17; // 2e-jaars U17

    let projM1 = 0,
      projV1 = 0,
      projM2 = 0,
      projV2 = 0;

    // 1e-jaars (leeftijd 16 in projectie-seizoen)
    const cohort1 = cohorten.get(gj1);
    if (cohort1) {
      const huidigeLeeftijd = startJaar - gj1;
      if (offset === 0) {
        projM1 = cohort1.M;
        projV1 = cohort1.V;
      } else {
        projM1 = projecteer(cohort1.M, huidigeLeeftijd, 16, groei.M);
        projV1 = projecteer(cohort1.V, huidigeLeeftijd, 16, groei.V);
      }
    }

    // 2e-jaars (leeftijd 17 in projectie-seizoen)
    const cohort2 = cohorten.get(gj2);
    if (cohort2) {
      const huidigeLeeftijd = startJaar - gj2;
      if (offset === 0) {
        projM2 = cohort2.M;
        projV2 = cohort2.V;
      } else {
        projM2 = projecteer(cohort2.M, huidigeLeeftijd, 17, groei.M);
        projV2 = projecteer(cohort2.V, huidigeLeeftijd, 17, groei.V);
      }
    }

    const totaalM = Math.round(projM1 + projM2);
    const totaalV = Math.round(projV1 + projV2);
    const totaal = totaalM + totaalV;

    u17.push({
      seizoen: projSeizoen,
      geboortejaar1eJaars: gj1,
      geboortejaar2eJaars: gj2,
      projM1: Math.round(projM1),
      projV1: Math.round(projV1),
      projM2: Math.round(projM2),
      projV2: Math.round(projV2),
      totaalM,
      totaalV,
      totaal,
      doelM: U17_DOEL_M,
      doelV: U17_DOEL_V,
      gapM: totaalM - U17_DOEL_M,
      gapV: totaalV - U17_DOEL_V,
      teams: Math.floor(totaal / 10),
    });
  }

  // Senioren-doorstroom: leeftijd 20 (= vanuit U19 2e-jaars → senioren)
  const senioren: SeniorenRij[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const projSeizoenStart = startJaar + offset;
    const projSeizoen = `${projSeizoenStart}-${projSeizoenStart + 1}`;
    const gj1 = projSeizoenStart - 19; // wordt 19 → laatste jeugdjaar
    const gj2 = projSeizoenStart - 20; // wordt 20 → eerste seniorenjaar

    let projM = 0,
      projV = 0;

    const cohortSen = cohorten.get(gj2);
    if (cohortSen) {
      const huidigeLeeftijd = startJaar - gj2;
      if (huidigeLeeftijd < 20) {
        projM = projecteer(cohortSen.M, huidigeLeeftijd, 19, groei.M);
        projV = projecteer(cohortSen.V, huidigeLeeftijd, 19, groei.V);
      } else {
        projM = cohortSen.M;
        projV = cohortSen.V;
      }
    }

    const cohort19 = cohorten.get(gj1);
    if (cohort19) {
      const huidigeLeeftijd = startJaar - gj1;
      if (huidigeLeeftijd < 19) {
        projM += projecteer(cohort19.M, huidigeLeeftijd, 19, groei.M);
        projV += projecteer(cohort19.V, huidigeLeeftijd, 19, groei.V);
      } else {
        projM += cohort19.M;
        projV += cohort19.V;
      }
    }

    senioren.push({
      seizoen: projSeizoen,
      geboortejaar1: gj1,
      geboortejaar2: gj2,
      projM: Math.round(projM),
      projV: Math.round(projV),
      totaal: Math.round(projM) + Math.round(projV),
    });
  }

  return { u17, senioren };
}

// ---------------------------------------------------------------------------
// Cohort overzicht (actief vs gestopt per geboortejaar)
// ---------------------------------------------------------------------------

export type CohortOverzichtLid = {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: string;
  heeftFoto: boolean;
  laatsteTeam: string;
  laatsteSeizoen: string;
};

export type CohortOverzichtResult = {
  geboortejaar: number;
  seizoen: string;
  actief: CohortOverzichtLid[];
  gestopt: CohortOverzichtLid[];
  stats: {
    totaalOoit: number;
    actiefM: number;
    actiefV: number;
    gestoptM: number;
    gestoptV: number;
    pctActiefM: number;
    pctActiefV: number;
    pctActief: number;
  };
};

export async function getCohortOverzicht(
  geboortejaar: number,
  seizoen: string
): Promise<CohortOverzichtResult> {
  // Alle ooit-actieve leden met dit geboortejaar + hun laatst bekende team
  const alleLedenRows = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string;
      achternaam: string;
      tussenvoegsel: string | null;
      geslacht: string;
      heeft_foto: boolean;
      laatste_team: string;
      laatste_seizoen: string;
    }[]
  >`
    SELECT DISTINCT ON (cp.rel_code)
      cp.rel_code,
      l.roepnaam,
      l.achternaam,
      l.tussenvoegsel,
      l.geslacht,
      EXISTS(SELECT 1 FROM lid_fotos lf WHERE lf.rel_code = l.rel_code) AS heeft_foto,
      cp.team AS laatste_team,
      cp.seizoen AS laatste_seizoen
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE l.geboortejaar = ${geboortejaar}
    ORDER BY cp.rel_code, cp.seizoen DESC`;

  // Actieve rel_codes dit seizoen
  const actiefRows = await prisma.$queryRaw<{ rel_code: string; team: string }[]>`
    SELECT DISTINCT cp.rel_code, cp.team
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE l.geboortejaar = ${geboortejaar}
      AND cp.seizoen = ${seizoen}`;

  const actiefSet = new Map(actiefRows.map((r) => [r.rel_code, r.team]));

  const actief: CohortOverzichtLid[] = [];
  const gestopt: CohortOverzichtLid[] = [];

  for (const r of alleLedenRows) {
    const lid: CohortOverzichtLid = {
      relCode: r.rel_code,
      roepnaam: r.roepnaam,
      achternaam: r.achternaam,
      tussenvoegsel: r.tussenvoegsel,
      geslacht: r.geslacht,
      heeftFoto: r.heeft_foto,
      laatsteTeam: actiefSet.get(r.rel_code) || r.laatste_team,
      laatsteSeizoen: actiefSet.has(r.rel_code) ? seizoen : r.laatste_seizoen,
    };
    if (actiefSet.has(r.rel_code)) {
      actief.push(lid);
    } else {
      gestopt.push(lid);
    }
  }

  // Sorteer: actief op achternaam, gestopt op laatsteSeizoen DESC
  actief.sort((a, b) => a.achternaam.localeCompare(b.achternaam));
  gestopt.sort((a, b) => b.laatsteSeizoen.localeCompare(a.laatsteSeizoen));

  const actiefM = actief.filter((l) => l.geslacht === "M").length;
  const actiefV = actief.filter((l) => l.geslacht === "V").length;
  const gestoptM = gestopt.filter((l) => l.geslacht === "M").length;
  const gestoptV = gestopt.filter((l) => l.geslacht === "V").length;
  const totaalM = actiefM + gestoptM;
  const totaalV = actiefV + gestoptV;
  const totaalOoit = actief.length + gestopt.length;

  return {
    geboortejaar,
    seizoen,
    actief,
    gestopt,
    stats: {
      totaalOoit,
      actiefM,
      actiefV,
      gestoptM,
      gestoptV,
      pctActiefM: totaalM > 0 ? Math.round((actiefM / totaalM) * 100) : 0,
      pctActiefV: totaalV > 0 ? Math.round((actiefV / totaalV) * 100) : 0,
      pctActief: totaalOoit > 0 ? Math.round((actief.length / totaalOoit) * 100) : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Per kleur
// ---------------------------------------------------------------------------

export type KleurRow = {
  kleur: string;
  categorie: string | null;
  teams: number;
  spelers_m: number;
  spelers_v: number;
  totaal: number;
};

export type KleurResult = {
  meta: { datum: Date | null; seizoen: string };
  data: KleurRow[];
};

export async function getPerKleur(seizoen: string): Promise<KleurResult> {
  const rows = await prisma.$queryRaw<KleurRow[]>`
    WITH jeugd_kleur AS (
      -- J-teams → kleur via teams tabel (j_nummer mapping)
      SELECT DISTINCT ON (SUBSTRING(tp.j_nummer FROM 2)::int)
        SUBSTRING(tp.j_nummer FROM 2)::int AS j_nr,
        t.kleur
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL
      ORDER BY SUBSTRING(tp.j_nummer FROM 2)::int, tp.id
    ),
    spelers AS (
      SELECT DISTINCT ON (cp.rel_code)
        cp.rel_code,
        cp.team,
        cp.geslacht,
        CASE
          -- Jeugd: J{n} of OW J{n} → kleur uit teams tabel
          WHEN cp.team ~ '^(OW )?J\\d+$' THEN
            COALESCE(
              (SELECT jk.kleur FROM jeugd_kleur jk
               WHERE jk.j_nr = SUBSTRING(cp.team FROM '\\d+$')::int),
              'Jeugd'
            )
          -- Kangoeroes
          WHEN cp.team = 'Kangoeroes' THEN 'Blauw'
          -- A-categorie selectie en teams
          WHEN cp.team ~ '^U1[5-9]' THEN 'A-categorie'
          -- Senioren
          WHEN cp.team ~ '^(S\\d|\\d+$|MW)' THEN 'Senioren'
          ELSE 'Overig'
        END AS kleur
      FROM competitie_spelers cp
      WHERE cp.seizoen = ${seizoen}
      ORDER BY cp.rel_code, cp.team
    )
    SELECT
      kleur,
      NULL::text AS categorie,
      COUNT(DISTINCT team)::int AS teams,
      COUNT(*) FILTER (WHERE geslacht = 'M')::int AS spelers_m,
      COUNT(*) FILTER (WHERE geslacht = 'V')::int AS spelers_v,
      COUNT(*)::int AS totaal
    FROM spelers
    GROUP BY kleur
    ORDER BY CASE kleur
      WHEN 'Rood' THEN 1 WHEN 'Oranje' THEN 2 WHEN 'Geel' THEN 3
      WHEN 'Groen' THEN 4 WHEN 'Blauw' THEN 5
      WHEN 'A-categorie' THEN 6 WHEN 'Senioren' THEN 7
      ELSE 8
    END`;

  return {
    meta: { datum: null, seizoen },
    data: rows.map((r) => ({
      kleur: r.kleur,
      categorie: r.categorie || null,
      teams: Number(r.teams),
      spelers_m: Number(r.spelers_m),
      spelers_v: Number(r.spelers_v),
      totaal: Number(r.totaal),
    })),
  };
}
