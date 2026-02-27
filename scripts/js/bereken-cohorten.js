/**
 * bereken-cohorten.js
 *
 * Aggregeert individueel ledenverloop per geboortejaar-cohort.
 * Bron: speler_seizoenen + leden + ledenverloop tabellen (PostgreSQL).
 *
 * Output: cohort_seizoenen tabel in PostgreSQL
 */

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getBand(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 7) return 'Blauw';
  if (leeftijd >= 8 && leeftijd <= 9) return 'Groen';
  if (leeftijd >= 10 && leeftijd <= 12) return 'Geel';
  if (leeftijd >= 13 && leeftijd <= 15) return 'Oranje';
  if (leeftijd >= 16 && leeftijd <= 18) return 'Rood';
  if (leeftijd >= 19) return 'Senioren';
  return 'pre-Blauw';
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

async function main() {
  console.log('Cohorten berekenen uit database...\n');

  // Haal alle seizoenen op
  const { rows: seizoenen } = await pool.query(
    `SELECT seizoen, eind_jaar FROM seizoenen ORDER BY seizoen`
  );

  // Stap 1: Actief-tellingen per seizoen per (geboortejaar, geslacht)
  const { rows: actiefRaw } = await pool.query(
    `SELECT ss.seizoen, l.geboortejaar, COALESCE(ss.geslacht, l.geslacht) as geslacht, COUNT(DISTINCT ss.rel_code)::int as actief
     FROM speler_seizoenen ss
     JOIN leden l ON ss.rel_code = l.rel_code
     WHERE l.geboortejaar IS NOT NULL
     GROUP BY ss.seizoen, l.geboortejaar, COALESCE(ss.geslacht, l.geslacht)`
  );

  // Bouw lookup: seizoen -> Map("geboortejaar|geslacht" -> actief)
  const actiefPerSeason = {};
  for (const r of actiefRaw) {
    if (!r.geslacht) continue;
    if (!actiefPerSeason[r.seizoen]) actiefPerSeason[r.seizoen] = new Map();
    const key = `${r.geboortejaar}|${r.geslacht}`;
    actiefPerSeason[r.seizoen].set(key, r.actief);
  }

  // Stap 2: Verloop-tellingen per seizoen per (geboortejaar, geslacht)
  const { rows: verloopRaw } = await pool.query(
    `SELECT seizoen, geboortejaar, geslacht, status, COUNT(*)::int as n
     FROM ledenverloop
     WHERE geboortejaar IS NOT NULL AND geslacht IS NOT NULL
     GROUP BY seizoen, geboortejaar, geslacht, status`
  );

  const verloopPerSeason = {};
  for (const r of verloopRaw) {
    if (!verloopPerSeason[r.seizoen]) verloopPerSeason[r.seizoen] = new Map();
    const key = `${r.geboortejaar}|${r.geslacht}`;
    if (!verloopPerSeason[r.seizoen].has(key)) {
      verloopPerSeason[r.seizoen].set(key, { behouden: 0, nieuw: 0, herinschrijver: 0, uitgestroomd: 0 });
    }
    verloopPerSeason[r.seizoen].get(key)[r.status] = (verloopPerSeason[r.seizoen].get(key)[r.status] || 0) + r.n;
  }

  // Stap 3: Verzamel alle cohort-keys
  const allCohortKeys = new Set();
  for (const map of Object.values(actiefPerSeason)) {
    for (const key of map.keys()) allCohortKeys.add(key);
  }
  for (const map of Object.values(verloopPerSeason)) {
    for (const key of map.keys()) allCohortKeys.add(key);
  }

  // Seizoen -> eind_jaar lookup
  const eindJaarMap = {};
  for (const s of seizoenen) eindJaarMap[s.seizoen] = s.eind_jaar;

  // Stap 4: Verwijder bestaande cohort-records en bereken opnieuw
  await pool.query(`DELETE FROM cohort_seizoenen`);
  console.log('Bestaande cohort_seizoenen records verwijderd\n');

  let totalInserted = 0;

  for (const key of allCohortKeys) {
    const [geboortejaarStr, geslacht] = key.split('|');
    const geboortejaar = parseInt(geboortejaarStr);

    for (const s of seizoenen) {
      const eindJaar = s.eind_jaar;
      const leeftijd = eindJaar - geboortejaar;
      const band = getBand(leeftijd);
      const actief = actiefPerSeason[s.seizoen]?.get(key) || 0;
      const vCounts = verloopPerSeason[s.seizoen]?.get(key);

      const behouden = vCounts?.behouden || 0;
      const nieuw = vCounts?.nieuw || 0;
      const herinschrijver = vCounts?.herinschrijver || 0;
      const uitgestroomd = vCounts?.uitgestroomd || 0;

      // Skip als er helemaal geen data is
      if (actief === 0 && behouden === 0 && uitgestroomd === 0 && nieuw === 0 && herinschrijver === 0) continue;

      const prevTotal = behouden + uitgestroomd;
      const retentiePct = prevTotal > 0 ? round1((behouden / prevTotal) * 100) : null;

      await pool.query(
        `INSERT INTO cohort_seizoenen (geboortejaar, geslacht, seizoen, leeftijd, band,
          actief, behouden, nieuw, herinschrijver, uitgestroomd, retentie_pct)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (geboortejaar, geslacht, seizoen) DO UPDATE SET
           leeftijd = EXCLUDED.leeftijd, band = EXCLUDED.band, actief = EXCLUDED.actief,
           behouden = EXCLUDED.behouden, nieuw = EXCLUDED.nieuw, herinschrijver = EXCLUDED.herinschrijver,
           uitgestroomd = EXCLUDED.uitgestroomd, retentie_pct = EXCLUDED.retentie_pct`,
        [geboortejaar, geslacht, s.seizoen, leeftijd, band,
         actief, behouden, nieuw, herinschrijver, uitgestroomd, retentiePct]
      );
      totalInserted++;
    }
  }

  console.log(`${totalInserted} cohort-records geschreven naar database\n`);

  // Rapportage
  const { rows: report } = await pool.query(
    `SELECT seizoen, SUM(actief)::int as totaal_actief, COUNT(*)::int as cohorten
     FROM cohort_seizoenen
     WHERE actief > 0
     GROUP BY seizoen ORDER BY seizoen`
  );
  for (const r of report) {
    console.log(`  ${r.seizoen}: ${r.totaal_actief} actief (${r.cohorten} cohorten)`);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
