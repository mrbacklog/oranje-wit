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
 *
 * Output: signalering tabel in PostgreSQL
 */

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SEIZOEN = process.argv[2] || "2025-2026";

const THRESHOLDS = {
  "6-12": { streef: 95, aandacht: 85, kritiek: 70 },
  "13-14": { streef: 90, aandacht: 80, kritiek: 65 },
  "15-16": { streef: 88, aandacht: 78, kritiek: 63 },
  "17-18": { streef: 90, aandacht: 80, kritiek: 65 },
  "19-23": { streef: 75, aandacht: 65, kritiek: 50 },
  "24+": { streef: 80, aandacht: 70, kritiek: 55 },
};

function getAgeGroup(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 12) return "6-12";
  if (leeftijd >= 13 && leeftijd <= 14) return "13-14";
  if (leeftijd >= 15 && leeftijd <= 16) return "15-16";
  if (leeftijd >= 17 && leeftijd <= 18) return "17-18";
  if (leeftijd >= 19 && leeftijd <= 23) return "19-23";
  if (leeftijd >= 24) return "24+";
  return null;
}

function getBandForAge(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 7) return "Blauw";
  if (leeftijd >= 8 && leeftijd <= 9) return "Groen";
  if (leeftijd >= 10 && leeftijd <= 12) return "Geel";
  if (leeftijd >= 13 && leeftijd <= 15) return "Oranje";
  if (leeftijd >= 16 && leeftijd <= 18) return "Rood";
  return "Senioren";
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

async function main() {
  console.log(`Signalering genereren voor ${SEIZOEN}...\n`);

  const alerts = [];

  // ===== 1. RETENTIE ALERTS =====
  // Retentie per leeftijdsgroep uit ledenverloop
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
      });
    }
  }

  // ===== 2. INSTROOM ALERTS =====
  // Kern-instroom (leeftijd 5-9) per seizoen
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
      });
    }
  }

  // ===== 3. GENDERDISBALANS ALERTS =====
  // M/V ratio per geboortejaar in huidig seizoen (jeugd 6-18)
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

      alerts.push({
        type: "genderdisbalans",
        ernst: ratio >= 75 ? "kritiek" : "aandacht",
        leeftijdsgroep: `geboortejaar ${year} (${band}, leeftijd ${counts.leeftijd})`,
        geslacht: dominant,
        waarde: ratio,
        drempel: 60,
        streef: 50,
        beschrijving: `Geboortejaar ${year} (${band}): ${ratio}% ${dominant} (${counts.M}M/${counts.V}V) — streef ~50/50`,
      });
    }
  }

  // ===== 4. TRENDBREUK ALERTS =====
  // Vergelijk retentie over laatste 3 seizoenen
  const { rows: trendData } = await pool.query(
    `SELECT seizoen,
       SUM(behouden)::int as behouden,
       SUM(uitgestroomd)::int as uitgestroomd,
       SUM(nieuw)::int as nieuw,
       SUM(herinschrijver)::int as herinschrijver,
       SUM(actief)::int as actief
     FROM cohort_seizoenen
     GROUP BY seizoen
     ORDER BY seizoen`
  );

  // Bereken totalen per seizoen uit verloop
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
        alerts.push({
          type: "trendbreuk",
          ernst: Math.abs(retentionChange) > 10 ? "kritiek" : "aandacht",
          leeftijdsgroep: "alle",
          geslacht: null,
          waarde: retLatest,
          drempel: null,
          streef: null,
          beschrijving: `Trendbreuk retentie: ${retPrev}% → ${retLatest}% (${retentionChange > 0 ? "+" : ""}${retentionChange.toFixed(1)}pp) na trend ${retPrevPrev}% → ${retPrev}%`,
        });
      }
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
      `INSERT INTO signalering (seizoen, type, ernst, leeftijdsgroep, geslacht, waarde, drempel, streef, beschrijving)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        SEIZOEN,
        a.type,
        a.ernst,
        a.leeftijdsgroep || null,
        a.geslacht || null,
        a.waarde || null,
        a.drempel || null,
        a.streef || null,
        a.beschrijving || null,
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
