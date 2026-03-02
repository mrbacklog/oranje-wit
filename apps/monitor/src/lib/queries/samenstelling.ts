/* eslint-disable max-lines */
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
        WHEN (${startJaar} - l.geboortejaar) = 12 THEN 'C-jeugd'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 13 AND 14 THEN 'U15'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 15 AND 16 THEN 'U17'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 17 AND 18 THEN 'U19'
        WHEN (${startJaar} - l.geboortejaar) >= 19 THEN 'Senioren'
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
export async function getGroeiFactoren(): Promise<GroeiFactoren> {
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
        AND c1.seizoen >= '2019-2020'
    )
    SELECT leeftijd, geslacht,
           ROUND(AVG(actief_nu::numeric / actief_vorig), 3) AS groei_factor
    FROM opeenvolgend
    WHERE leeftijd BETWEEN 6 AND 22
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
// Pijplijn: per-geboortejaar doel, leeftijd 6-22
// ---------------------------------------------------------------------------

// Streef per geboortejaar: 12 jongens + 13 meiden = 25 spelers.
// Vast vanaf leeftijd 12. Voor 6-11 teruggerekend met groei-factoren.
const DOEL_M_PER_JAAR = 12;
const DOEL_V_PER_JAAR = 13;

// Categorie-doel: 2 jaargangen × per-jaar = 50 per categorie
const CATEGORIE_DOEL_M = DOEL_M_PER_JAAR * 2;
const CATEGORIE_DOEL_V = DOEL_V_PER_JAAR * 2;
const CATEGORIE_DOEL_TOTAAL = CATEGORIE_DOEL_M + CATEGORIE_DOEL_V;

const BAND_PER_LEEFTIJD: Record<number, string> = {
  6: "Blauw",
  7: "Blauw",
  8: "Groen",
  9: "Groen",
  10: "Geel",
  11: "Geel",
  12: "Geel",
  13: "Oranje",
  14: "Oranje",
  15: "Rood",
  16: "Rood",
  17: "Paars",
  18: "Paars",
  19: "Grijs",
  20: "Grijs",
  21: "Grijs",
  22: "Grijs",
};

export type PijplijnRij = {
  leeftijd: number;
  band: string;
  benodigd_m: number;
  benodigd_v: number;
  huidig_m: number;
  huidig_v: number;
  vulgraad_m: number;
  vulgraad_v: number;
  vulgraad: number;
  gap_m: number;
  gap_v: number;
};

type CategorieStatus = { m: number; v: number; totaal: number };

export type PijplijnResult = {
  doelPerCategorie: number;
  huidig: { U15: CategorieStatus; U17: CategorieStatus; U19: CategorieStatus };
  perLeeftijd: PijplijnRij[];
  groeiFactoren: GroeiFactoren;
};

/**
 * Bereken de jeugdpijplijn met per-geboortejaar doelen.
 *
 * - Leeftijd 12-22: vast doel van 12M + 13V per geboortejaar
 * - Leeftijd 6-11: teruggerekend vanaf het doel bij leeftijd 12
 *   met historische groei-factoren (retentie + instroom)
 */
export async function getPijplijn(seizoen: string): Promise<PijplijnResult> {
  const startJaar = parseInt(seizoen.split("-")[0]);

  const [groei, geboortejaarData] = await Promise.all([
    getGroeiFactoren(),
    getPerGeboortejaar(seizoen),
  ]);

  // Bouw huidig per leeftijd
  const huidigPerLeeftijd = new Map<number, { M: number; V: number }>();
  for (const row of geboortejaarData.data) {
    if (!row.geboortejaar) continue;
    const leeftijd = startJaar - row.geboortejaar;
    const existing = huidigPerLeeftijd.get(leeftijd) || { M: 0, V: 0 };
    if (row.geslacht === "M") existing.M += row.aantal;
    else existing.V += row.aantal;
    huidigPerLeeftijd.set(leeftijd, existing);
  }

  // Per-geboortejaar model:
  // - Leeftijd 12-22: vast doel (12M + 13V per geboortejaar)
  // - Leeftijd 6-11: terugrekenen vanaf het doel bij 12
  const perLeeftijd: PijplijnRij[] = [];
  const benodigdPerLeeftijd = new Map<number, { m: number; v: number }>();

  // Vast doel voor leeftijd 12 t/m 18 (jeugd + U19)
  for (let leeftijd = 12; leeftijd <= 18; leeftijd++) {
    benodigdPerLeeftijd.set(leeftijd, { m: DOEL_M_PER_JAAR, v: DOEL_V_PER_JAAR });
  }

  // Afbouw voor leeftijd 19-22: pas groei-factoren toe (retentie-gebaseerd)
  let seniorM = DOEL_M_PER_JAAR;
  let seniorV = DOEL_V_PER_JAAR;
  for (let leeftijd = 19; leeftijd <= 22; leeftijd++) {
    seniorM = seniorM * (groei.M[leeftijd] ?? 0.75);
    seniorV = seniorV * (groei.V[leeftijd] ?? 0.75);
    benodigdPerLeeftijd.set(leeftijd, { m: seniorM, v: seniorV });
  }

  // Terugrekenen van leeftijd 11 naar 6 (instroom-traject)
  let benodigdM = DOEL_M_PER_JAAR;
  let benodigdV = DOEL_V_PER_JAAR;
  for (let leeftijd = 11; leeftijd >= 6; leeftijd--) {
    const factorM = groei.M[leeftijd + 1] ?? 0.85;
    const factorV = groei.V[leeftijd + 1] ?? 0.85;
    benodigdM = benodigdM / factorM;
    benodigdV = benodigdV / factorV;
    benodigdPerLeeftijd.set(leeftijd, { m: benodigdM, v: benodigdV });
  }

  // Bouw resultaat op (leeftijd 6-22)
  for (let leeftijd = 6; leeftijd <= 22; leeftijd++) {
    const huidig = huidigPerLeeftijd.get(leeftijd) || { M: 0, V: 0 };
    const benodigd = benodigdPerLeeftijd.get(leeftijd)!;
    const benodigdTotaal = benodigd.m + benodigd.v;
    const huidigTotaal = huidig.M + huidig.V;

    perLeeftijd.push({
      leeftijd,
      band: BAND_PER_LEEFTIJD[leeftijd] || "",
      benodigd_m: Math.round(benodigd.m * 10) / 10,
      benodigd_v: Math.round(benodigd.v * 10) / 10,
      huidig_m: huidig.M,
      huidig_v: huidig.V,
      vulgraad_m: benodigd.m > 0 ? Math.round((huidig.M / benodigd.m) * 100) : 0,
      vulgraad_v: benodigd.v > 0 ? Math.round((huidig.V / benodigd.v) * 100) : 0,
      vulgraad: benodigdTotaal > 0 ? Math.round((huidigTotaal / benodigdTotaal) * 100) : 0,
      gap_m: Math.round((huidig.M - benodigd.m) * 10) / 10,
      gap_v: Math.round((huidig.V - benodigd.v) * 10) / 10,
    });
  }

  // Huidig per selectiecategorie (2 jaargangen elk)
  function categorieStatus(l1: number, l2: number): CategorieStatus {
    const h1 = huidigPerLeeftijd.get(l1) || { M: 0, V: 0 };
    const h2 = huidigPerLeeftijd.get(l2) || { M: 0, V: 0 };
    const m = h1.M + h2.M;
    const v = h1.V + h2.V;
    return { m, v, totaal: m + v };
  }

  return {
    doelPerCategorie: CATEGORIE_DOEL_TOTAAL,
    huidig: {
      U15: categorieStatus(13, 14),
      U17: categorieStatus(15, 16),
      U19: categorieStatus(17, 18),
    },
    perLeeftijd,
    groeiFactoren: groei,
  };
}

// ---------------------------------------------------------------------------
// Verwachte tussentijdse instroom
// ---------------------------------------------------------------------------

export type VerwachteInstroom = Record<number, number>; // leeftijd → verwacht extra

/**
 * Bereken verwachte tussentijdse instroom per leeftijd.
 *
 * Kijkt naar de afgelopen 5 seizoenen: welk percentage van de nieuwe leden
 * was ingeschreven vóór de huidige maand? Projecteert de rest van het seizoen.
 */
export async function getVerwachteInstroom(seizoen: string): Promise<VerwachteInstroom> {
  const startJaar = parseInt(seizoen.split("-")[0]);
  const nu = new Date();
  const huidigeMaand = nu.getMonth() + 1; // 1-12

  // Historisch patroon: per leeftijd, hoeveel % van instroom was vóór huidige maand
  const rows = await prisma.$queryRaw<{ leeftijd: number; voor_maand: number; totaal: number }[]>`
    WITH seizoen_instroom AS (
      SELECT
        (CAST(LEFT(cp.seizoen, 4) AS int) - EXTRACT(YEAR FROM l.geboortedatum)::int) AS leeftijd,
        EXTRACT(MONTH FROM l.lid_sinds)::int AS maand
      FROM leden l
      JOIN competitie_spelers cp ON l.rel_code = cp.rel_code
      JOIN ledenverloop lv ON lv.rel_code = l.rel_code AND lv.seizoen = cp.seizoen
      WHERE lv.status = 'nieuw'
        AND l.lid_sinds IS NOT NULL
        AND cp.seizoen NOT IN ('2020-2021', '2021-2022')
        AND cp.seizoen >= '2019-2020'
        AND cp.seizoen != ${seizoen}
    )
    SELECT
      leeftijd,
      COUNT(*) FILTER (WHERE maand < ${huidigeMaand} OR (maand >= 8 AND ${huidigeMaand} >= 8)) AS voor_maand,
      COUNT(*) AS totaal
    FROM seizoen_instroom
    WHERE leeftijd BETWEEN 6 AND 22
    GROUP BY leeftijd
    HAVING COUNT(*) >= 3`;

  // Huidige seizoens-instroom per leeftijd
  const huidigRows = await prisma.$queryRaw<{ leeftijd: number; aantal: number }[]>`
    SELECT
      (${startJaar} - EXTRACT(YEAR FROM l.geboortedatum)::int) AS leeftijd,
      COUNT(*)::int AS aantal
    FROM leden l
    JOIN competitie_spelers cp ON l.rel_code = cp.rel_code
    JOIN ledenverloop lv ON lv.rel_code = l.rel_code AND lv.seizoen = cp.seizoen
    WHERE lv.status = 'nieuw'
      AND cp.seizoen = ${seizoen}
      AND l.lid_sinds IS NOT NULL
    GROUP BY leeftijd`;

  const huidigPerLeeftijd = new Map(huidigRows.map((r) => [r.leeftijd, Number(r.aantal)]));

  const result: VerwachteInstroom = {};
  for (const r of rows) {
    const pctVoor = Number(r.totaal) > 0 ? Number(r.voor_maand) / Number(r.totaal) : 1;
    if (pctVoor >= 0.95) continue; // Bijna alles al binnen, geen projectie nodig
    const huidig = huidigPerLeeftijd.get(r.leeftijd) || 0;
    if (huidig === 0) continue;
    const verwacht = Math.round(huidig / pctVoor) - huidig;
    if (verwacht > 0) result[r.leeftijd] = verwacht;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Forward-projectie: U17 + Senioren doorstroom
// ---------------------------------------------------------------------------

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
  // U17 = leeftijd 15-16 (1e-jaars = 15, 2e-jaars = 16)
  const u17: ProjectieRij[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const projSeizoenStart = startJaar + offset;
    const projSeizoen = `${projSeizoenStart}-${projSeizoenStart + 1}`;
    const gj1 = projSeizoenStart - 15; // 1e-jaars U17
    const gj2 = projSeizoenStart - 16; // 2e-jaars U17

    let projM1 = 0,
      projV1 = 0,
      projM2 = 0,
      projV2 = 0;

    // 1e-jaars (leeftijd 15 in projectie-seizoen)
    const cohort1 = cohorten.get(gj1);
    if (cohort1) {
      const huidigeLeeftijd = startJaar - gj1;
      if (offset === 0) {
        projM1 = cohort1.M;
        projV1 = cohort1.V;
      } else {
        projM1 = projecteer(cohort1.M, huidigeLeeftijd, 15, groei.M);
        projV1 = projecteer(cohort1.V, huidigeLeeftijd, 15, groei.V);
      }
    }

    // 2e-jaars (leeftijd 16 in projectie-seizoen)
    const cohort2 = cohorten.get(gj2);
    if (cohort2) {
      const huidigeLeeftijd = startJaar - gj2;
      if (offset === 0) {
        projM2 = cohort2.M;
        projV2 = cohort2.V;
      } else {
        projM2 = projecteer(cohort2.M, huidigeLeeftijd, 16, groei.M);
        projV2 = projecteer(cohort2.V, huidigeLeeftijd, 16, groei.V);
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
      doelM: CATEGORIE_DOEL_M,
      doelV: CATEGORIE_DOEL_V,
      gapM: totaalM - CATEGORIE_DOEL_M,
      gapV: totaalV - CATEGORIE_DOEL_V,
      teams: Math.floor(totaal / 10),
    });
  }

  // Senioren-doorstroom: leeftijd 19 (= vanuit U19 2e-jaars → senioren)
  const senioren: SeniorenRij[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const projSeizoenStart = startJaar + offset;
    const projSeizoen = `${projSeizoenStart}-${projSeizoenStart + 1}`;
    const gj1 = projSeizoenStart - 18; // wordt 18 → laatste jeugdjaar (U19 2e-jaars)
    const gj2 = projSeizoenStart - 19; // wordt 19 → eerste seniorenjaar

    let projM = 0,
      projV = 0;

    const cohortSen = cohorten.get(gj2);
    if (cohortSen) {
      const huidigeLeeftijd = startJaar - gj2;
      if (huidigeLeeftijd < 19) {
        projM = projecteer(cohortSen.M, huidigeLeeftijd, 18, groei.M);
        projV = projecteer(cohortSen.V, huidigeLeeftijd, 18, groei.V);
      } else {
        projM = cohortSen.M;
        projV = cohortSen.V;
      }
    }

    const cohort18 = cohorten.get(gj1);
    if (cohort18) {
      const huidigeLeeftijd = startJaar - gj1;
      if (huidigeLeeftijd < 18) {
        projM += projecteer(cohort18.M, huidigeLeeftijd, 18, groei.M);
        projV += projecteer(cohort18.V, huidigeLeeftijd, 18, groei.V);
      } else {
        projM += cohort18.M;
        projV += cohort18.V;
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
