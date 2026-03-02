/**
 * genereer-signalering.js
 *
 * Genereert alerts op basis van cohortdata en ledenverloop.
 * Bron: cohort_seizoenen + ledenverloop tabellen (PostgreSQL).
 *
 * Alert types:
 * - retentie: retentie per leeftijdsgroep onder drempel
 * - instroom: kern-instroom (6-9 jaar) dalend vs vorige seizoenen
 * - genderdisbalans: M/V ratio in geboortejaar wijkt >60/40 af
 * - trendbreuk: plotselinge verandering vs geleidelijke trend
 * - pijplijn_vulgraad: vulgraad U15/U17/U19 per geslacht vs doel
 * - forward_projectie: vroege waarschuwing als toekomstige U17 onder drempel komt
 *
 * Output: signalering tabel in PostgreSQL
 */

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SEIZOEN = process.argv[2] || "2025-2026";
const START_JAAR = parseInt(SEIZOEN.split("-")[0]);

// Categorie-doelen (per 2 jaargangen)
const DOEL_M = 24; // 2 × 12
const DOEL_V = 26; // 2 × 13

// U-categorie leeftijdsgrenzen (startJaar - geboortejaar)
const CATEGORIEEN = {
  U15: { l1: 13, l2: 14 },
  U17: { l1: 15, l2: 16 },
  U19: { l1: 17, l2: 18 },
};

const THRESHOLDS = {
  "6-12": { streef: 95, aandacht: 85, kritiek: 70 },
  "13-14": { streef: 90, aandacht: 80, kritiek: 65 },
  "15-16": { streef: 88, aandacht: 78, kritiek: 63 },
  "17-18": { streef: 90, aandacht: 80, kritiek: 65 },
  "19-23": { streef: 75, aandacht: 65, kritiek: 50 },
  "24+": { streef: 80, aandacht: 70, kritiek: 55 },
};

// Advies-templates per type × ernst × leeftijdsgroep
const ADVIES = {
  retentie: {
    kritiek: {
      "6-12":
        "Evalueer plezier-aanbod in Blauw/Groen teams. Retentie bij instap-leeftijd is de basis van de pijplijn.",
      "13-14": "Transitiejaar B→A is kritiek. Zorg voor begeleiding en een herkenbaar U13-team.",
      "15-16":
        "U17-leeftijd met hoge uitval. Check of POP-balans klopt: 25% plezier, 35% ontwikkeling, 40% prestatie.",
      "17-18":
        "U19-spelers vallen uit door school/werk. Flexibel trainingsaanbod en sociale binding zijn key.",
      "19-23":
        "Senioren-transitie is moeilijk. Sociale binding en flexibel aanbod zijn de beste retentie-instrumenten.",
      "24+":
        "Volwassen leden stoppen vaak door veranderende levensfase. Breedtesport-aanbod kan helpen.",
    },
    aandacht: {
      default:
        "Retentie iets onder streefwaarde. Monitor de komende maanden en evalueer bij teamindeling.",
    },
  },
  instroom: {
    kritiek:
      "Kern-instroom (8-9 jaar) ligt >20% onder gemiddelde. Overweeg gerichte werving via scholen in Stadspolders.",
    aandacht:
      "Instroom iets lager dan normaal. Monitor komende maanden — seizoens-instroom loopt vaak bij.",
  },
  genderdisbalans: {
    kritiek:
      "Ernstige scheefgroei: ≥75% één geslacht. Dit raakt plezier én teamvorming. Gericht werven van het ondervertegenwoordigde geslacht.",
    aandacht:
      "Lichte scheefgroei. Monitor bij teamindeling — zorg dat niemand 'alleen' staat in een team.",
  },
  trendbreuk: {
    kritiek:
      "Plotselinge omslag in retentie (>10pp). Onderzoek of er een specifieke oorzaak is (trainer, team, extern).",
    aandacht: "Retentie wijkt af van de trend. Houd in de gaten of dit structureel wordt.",
  },
  pijplijn_vulgraad: {
    kritiek:
      "Vulgraad onder 60%. Actief werven bij externe talenten of buurtclubs is noodzakelijk.",
    aandacht: "Vulgraad tussen 60-80%. Verhoog monitoring en overweeg gericht te werven.",
  },
  forward_projectie: {
    kritiek:
      "Zonder ingrijpen komt U17 onder 60%. Nu investeren in retentie bij de jongere leeftijden.",
    aandacht: "U17 dreigt onder 80% te komen. Retentie in de jongere leeftijden bewaken.",
  },
};

function getAdvies(type, ernst, leeftijdsgroep) {
  const typeAdvies = ADVIES[type];
  if (!typeAdvies) return null;
  if (typeof typeAdvies === "string") return typeAdvies;
  if (typeof typeAdvies[ernst] === "string") return typeAdvies[ernst];
  if (typeof typeAdvies[ernst] === "object") {
    return typeAdvies[ernst][leeftijdsgroep] || typeAdvies[ernst].default || null;
  }
  return null;
}

function getBandForAge(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 7) return "Blauw";
  if (leeftijd >= 8 && leeftijd <= 9) return "Groen";
  if (leeftijd >= 10 && leeftijd <= 12) return "Geel";
  if (leeftijd >= 13 && leeftijd <= 14) return "Oranje";
  if (leeftijd >= 15 && leeftijd <= 18) return "Rood";
  return "Senioren";
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

async function main() {
  console.log(`Signalering genereren voor ${SEIZOEN}...\n`);

  const alerts = [];

  // ===== 1. RETENTIE ALERTS =====
  const { rows: retentieData } = await pool.query(
    `SELECT
       CASE
         WHEN leeftijd_vorig BETWEEN 6 AND 12 THEN '6-12'
         WHEN leeftijd_vorig BETWEEN 13 AND 14 THEN '13-14'
         WHEN leeftijd_vorig BETWEEN 15 AND 16 THEN '15-16'
         WHEN leeftijd_vorig BETWEEN 17 AND 18 THEN '17-18'
         WHEN leeftijd_vorig BETWEEN 19 AND 23 THEN '19-23'
         WHEN leeftijd_vorig >= 24 THEN '24+'
       END as groep,
       SUM(CASE WHEN status = 'behouden' THEN 1 ELSE 0 END)::int as behouden,
       SUM(CASE WHEN status = 'uitgestroomd' THEN 1 ELSE 0 END)::int as uitgestroomd
     FROM ledenverloop
     WHERE seizoen = $1 AND leeftijd_vorig IS NOT NULL
     GROUP BY 1
     HAVING CASE
         WHEN leeftijd_vorig BETWEEN 6 AND 12 THEN '6-12'
         WHEN leeftijd_vorig BETWEEN 13 AND 14 THEN '13-14'
         WHEN leeftijd_vorig BETWEEN 15 AND 16 THEN '15-16'
         WHEN leeftijd_vorig BETWEEN 17 AND 18 THEN '17-18'
         WHEN leeftijd_vorig BETWEEN 19 AND 23 THEN '19-23'
         WHEN leeftijd_vorig >= 24 THEN '24+'
       END IS NOT NULL`,
    [SEIZOEN]
  );

  for (const r of retentieData) {
    const prevTotal = r.behouden + r.uitgestroomd;
    if (prevTotal === 0) continue;
    const retentie = round1((r.behouden / prevTotal) * 100);
    const threshold = THRESHOLDS[r.groep];
    if (!threshold) continue;

    if (retentie < threshold.kritiek) {
      alerts.push({
        type: "retentie",
        ernst: "kritiek",
        leeftijdsgroep: r.groep,
        geslacht: null,
        waarde: retentie,
        drempel: threshold.kritiek,
        streef: threshold.streef,
        beschrijving: `Retentie ${r.groep} jaar (${retentie}%) is kritiek laag (streef: ${threshold.streef}%)`,
        advies: getAdvies("retentie", "kritiek", r.groep),
      });
    } else if (retentie < threshold.aandacht) {
      alerts.push({
        type: "retentie",
        ernst: "aandacht",
        leeftijdsgroep: r.groep,
        geslacht: null,
        waarde: retentie,
        drempel: threshold.aandacht,
        streef: threshold.streef,
        beschrijving: `Retentie ${r.groep} jaar (${retentie}%) verdient aandacht (streef: ${threshold.streef}%)`,
        advies: getAdvies("retentie", "aandacht", r.groep),
      });
    }
  }

  // ===== 2. INSTROOM ALERTS =====
  const { rows: instroomData } = await pool.query(
    `SELECT seizoen, COUNT(*)::int as core_instroom
     FROM ledenverloop
     WHERE status IN ('nieuw', 'herinschrijver')
       AND leeftijd_nieuw BETWEEN 5 AND 9
     GROUP BY seizoen
     ORDER BY seizoen`
  );

  if (instroomData.length >= 2) {
    const latest = instroomData[instroomData.length - 1];
    const previous = instroomData.slice(0, -1);
    const avgPrevious = previous.reduce((sum, s) => sum + s.core_instroom, 0) / previous.length;

    if (latest.core_instroom < avgPrevious * 0.8) {
      alerts.push({
        type: "instroom",
        ernst: "kritiek",
        leeftijdsgroep: "5-9",
        geslacht: null,
        waarde: latest.core_instroom,
        drempel: Math.round(avgPrevious * 0.8),
        streef: Math.round(avgPrevious),
        beschrijving: `Kern-instroom 5-9 jaar (${latest.core_instroom}) is >20% lager dan gemiddelde voorgaande seizoenen (${Math.round(avgPrevious)})`,
        advies: getAdvies("instroom", "kritiek"),
      });
    } else if (latest.core_instroom < avgPrevious * 0.9) {
      alerts.push({
        type: "instroom",
        ernst: "aandacht",
        leeftijdsgroep: "5-9",
        geslacht: null,
        waarde: latest.core_instroom,
        drempel: Math.round(avgPrevious * 0.9),
        streef: Math.round(avgPrevious),
        beschrijving: `Kern-instroom 5-9 jaar (${latest.core_instroom}) is 10-20% lager dan gemiddelde voorgaande seizoenen (${Math.round(avgPrevious)})`,
        advies: getAdvies("instroom", "aandacht"),
      });
    }
  }

  // ===== 3. GENDERDISBALANS ALERTS =====
  const { rows: genderData } = await pool.query(
    `SELECT geboortejaar, geslacht, actief, leeftijd
     FROM cohort_seizoenen
     WHERE seizoen = $1 AND leeftijd BETWEEN 6 AND 18 AND actief > 0`,
    [SEIZOEN]
  );

  const genderPerYear = {};
  for (const r of genderData) {
    if (!genderPerYear[r.geboortejaar])
      genderPerYear[r.geboortejaar] = { M: 0, V: 0, leeftijd: r.leeftijd };
    genderPerYear[r.geboortejaar][r.geslacht] += r.actief;
  }

  for (const [year, counts] of Object.entries(genderPerYear)) {
    const total = counts.M + counts.V;
    if (total < 5) continue;
    const mRatio = counts.M / total;
    const vRatio = counts.V / total;

    if (mRatio > 0.6 || vRatio > 0.6) {
      const dominant = mRatio > vRatio ? "M" : "V";
      const ratio = Math.round(Math.max(mRatio, vRatio) * 100);
      const band = getBandForAge(counts.leeftijd);
      const ernst = ratio >= 75 ? "kritiek" : "aandacht";

      alerts.push({
        type: "genderdisbalans",
        ernst,
        leeftijdsgroep: `geboortejaar ${year} (${band}, leeftijd ${counts.leeftijd})`,
        geslacht: dominant,
        waarde: ratio,
        drempel: 60,
        streef: 50,
        beschrijving: `Geboortejaar ${year} (${band}): ${ratio}% ${dominant} (${counts.M}M/${counts.V}V) — streef ~50/50`,
        advies: getAdvies("genderdisbalans", ernst),
      });
    }
  }

  // ===== 4. TRENDBREUK ALERTS =====
  const { rows: seizoenTotalen } = await pool.query(
    `SELECT seizoen,
       COUNT(CASE WHEN status = 'behouden' THEN 1 END)::int as behouden,
       COUNT(CASE WHEN status = 'uitgestroomd' THEN 1 END)::int as uitgestroomd,
       COUNT(CASE WHEN status = 'nieuw' THEN 1 END)::int as nieuw_instroom,
       COUNT(CASE WHEN status = 'herinschrijver' THEN 1 END)::int as herinschrijver
     FROM ledenverloop
     GROUP BY seizoen
     ORDER BY seizoen`
  );

  if (seizoenTotalen.length >= 3) {
    const latest = seizoenTotalen[seizoenTotalen.length - 1];
    const prev = seizoenTotalen[seizoenTotalen.length - 2];
    const prevPrev = seizoenTotalen[seizoenTotalen.length - 3];

    const retPrev =
      prev.behouden + prev.uitgestroomd > 0
        ? round1((prev.behouden / (prev.behouden + prev.uitgestroomd)) * 100)
        : null;
    const retPrevPrev =
      prevPrev.behouden + prevPrev.uitgestroomd > 0
        ? round1((prevPrev.behouden / (prevPrev.behouden + prevPrev.uitgestroomd)) * 100)
        : null;
    const retLatest =
      latest.behouden + latest.uitgestroomd > 0
        ? round1((latest.behouden / (latest.behouden + latest.uitgestroomd)) * 100)
        : null;

    if (retLatest != null && retPrev != null && retPrevPrev != null) {
      const retentionTrend = retPrev - retPrevPrev;
      const retentionChange = retLatest - retPrev;

      if (
        Math.abs(retentionChange) > 5 &&
        Math.sign(retentionChange) !== Math.sign(retentionTrend)
      ) {
        const ernst = Math.abs(retentionChange) > 10 ? "kritiek" : "aandacht";
        alerts.push({
          type: "trendbreuk",
          ernst,
          leeftijdsgroep: "alle",
          geslacht: null,
          waarde: retLatest,
          drempel: null,
          streef: null,
          beschrijving: `Trendbreuk retentie: ${retPrev}% → ${retLatest}% (${retentionChange > 0 ? "+" : ""}${retentionChange.toFixed(1)}pp) na trend ${retPrevPrev}% → ${retPrev}%`,
          advies: getAdvies("trendbreuk", ernst),
        });
      }
    }
  }

  // ===== 5. PIJPLIJN VULGRAAD ALERTS =====
  // Per U-categorie en per geslacht: vergelijk huidig met doel
  const { rows: pijplijnData } = await pool.query(
    `SELECT geboortejaar, geslacht, actief, leeftijd
     FROM cohort_seizoenen
     WHERE seizoen = $1 AND leeftijd BETWEEN 13 AND 18 AND actief > 0`,
    [SEIZOEN]
  );

  for (const [catNaam, { l1, l2 }] of Object.entries(CATEGORIEEN)) {
    const catData = pijplijnData.filter((r) => r.leeftijd === l1 || r.leeftijd === l2);

    for (const geslacht of ["M", "V"]) {
      const huidig = catData
        .filter((r) => r.geslacht === geslacht)
        .reduce((sum, r) => sum + r.actief, 0);
      const doel = geslacht === "M" ? DOEL_M : DOEL_V;
      const vulgraad = doel > 0 ? Math.round((huidig / doel) * 100) : 100;
      const geslachtLabel = geslacht === "M" ? "♂" : "♀";

      if (vulgraad < 60) {
        alerts.push({
          type: "pijplijn_vulgraad",
          ernst: "kritiek",
          leeftijdsgroep: catNaam,
          geslacht,
          waarde: vulgraad,
          drempel: 60,
          streef: 100,
          beschrijving: `${catNaam} ${geslachtLabel}: vulgraad ${vulgraad}% (${huidig}/${doel}) — kritiek laag`,
          advies: getAdvies("pijplijn_vulgraad", "kritiek"),
        });
      } else if (vulgraad < 80) {
        alerts.push({
          type: "pijplijn_vulgraad",
          ernst: "aandacht",
          leeftijdsgroep: catNaam,
          geslacht,
          waarde: vulgraad,
          drempel: 80,
          streef: 100,
          beschrijving: `${catNaam} ${geslachtLabel}: vulgraad ${vulgraad}% (${huidig}/${doel}) — verdient aandacht`,
          advies: getAdvies("pijplijn_vulgraad", "aandacht"),
        });
      }
    }
  }

  // ===== 6. FORWARD PROJECTIE ALERTS =====
  // Projecteer huidige cohorten 1-3 seizoenen vooruit naar U17 (leeftijd 15-16)
  // Gebruik groei-factoren uit cohort_seizoenen
  const { rows: groeiRows } = await pool.query(
    `WITH opeenvolgend AS (
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
    WHERE leeftijd BETWEEN 6 AND 18
    GROUP BY leeftijd, geslacht`
  );

  const groei = { M: {}, V: {} };
  for (const r of groeiRows) {
    groei[r.geslacht][r.leeftijd] = parseFloat(r.groei_factor);
  }

  // Huidig per geboortejaar
  const { rows: cohortRows } = await pool.query(
    `SELECT l.geboortejaar, l.geslacht, COUNT(DISTINCT cp.rel_code)::int AS aantal
     FROM competitie_spelers cp
     JOIN leden l ON cp.rel_code = l.rel_code
     WHERE cp.seizoen = $1 AND l.geboortejaar IS NOT NULL
     GROUP BY l.geboortejaar, l.geslacht`,
    [SEIZOEN]
  );

  const cohorten = {};
  for (const r of cohortRows) {
    if (!cohorten[r.geboortejaar]) cohorten[r.geboortejaar] = { M: 0, V: 0 };
    cohorten[r.geboortejaar][r.geslacht] = r.aantal;
  }

  // Projecteer per offset (1-3 jaar vooruit)
  for (let offset = 1; offset <= 3; offset++) {
    const projStart = START_JAAR + offset;
    const projSeizoen = `${projStart}-${projStart + 1}`;
    const gj1 = projStart - 15; // 1e-jaars U17
    const gj2 = projStart - 16; // 2e-jaars U17

    let totaalM = 0;
    let totaalV = 0;

    for (const gj of [gj1, gj2]) {
      const cohort = cohorten[gj];
      if (!cohort) continue;
      const huidigeLeeftijd = START_JAAR - gj;
      const doelLeeftijd = gj === gj1 ? 15 : 16;

      for (const g of ["M", "V"]) {
        let n = cohort[g] || 0;
        for (let l = huidigeLeeftijd + 1; l <= doelLeeftijd; l++) {
          n *= groei[g][l] ?? 0.85;
        }
        if (g === "M") totaalM += n;
        else totaalV += n;
      }
    }

    const projTotaal = Math.round(totaalM) + Math.round(totaalV);
    const projDoel = DOEL_M + DOEL_V; // 50
    const vulgraad = projDoel > 0 ? Math.round((projTotaal / projDoel) * 100) : 100;

    if (vulgraad < 60) {
      alerts.push({
        type: "forward_projectie",
        ernst: "kritiek",
        leeftijdsgroep: `U17 ${projSeizoen}`,
        geslacht: null,
        waarde: vulgraad,
        drempel: 60,
        streef: 100,
        beschrijving: `Over ${offset} jaar dreigt U17 op ${vulgraad}% te komen (${projTotaal}/${projDoel} spelers in ${projSeizoen})`,
        advies: getAdvies("forward_projectie", "kritiek"),
      });
    } else if (vulgraad < 80) {
      alerts.push({
        type: "forward_projectie",
        ernst: "aandacht",
        leeftijdsgroep: `U17 ${projSeizoen}`,
        geslacht: null,
        waarde: vulgraad,
        drempel: 80,
        streef: 100,
        beschrijving: `Over ${offset} jaar dreigt U17 op ${vulgraad}% te komen (${projTotaal}/${projDoel} spelers in ${projSeizoen})`,
        advies: getAdvies("forward_projectie", "aandacht"),
      });
    }
  }

  // Sorteer: kritiek eerst
  alerts.sort((a, b) => {
    if (a.ernst !== b.ernst) return a.ernst === "kritiek" ? -1 : 1;
    return a.type.localeCompare(b.type);
  });

  // Schrijf naar database
  await pool.query(`DELETE FROM signalering WHERE seizoen = $1`, [SEIZOEN]);

  for (const a of alerts) {
    await pool.query(
      `INSERT INTO signalering (seizoen, type, ernst, leeftijdsgroep, geslacht, waarde, drempel, streef, beschrijving, advies)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        SEIZOEN,
        a.type,
        a.ernst,
        a.leeftijdsgroep || null,
        a.geslacht || null,
        a.waarde ?? null,
        a.drempel ?? null,
        a.streef ?? null,
        a.beschrijving || null,
        a.advies || null,
      ]
    );
  }

  const kritiekCount = alerts.filter((a) => a.ernst === "kritiek").length;
  const aandachtCount = alerts.filter((a) => a.ernst === "aandacht").length;

  console.log(
    `${alerts.length} alerts geschreven (${kritiekCount} kritiek, ${aandachtCount} aandacht)\n`
  );
  alerts.forEach((a) => console.log(`  [${a.ernst}] ${a.type}: ${a.beschrijving}`));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
