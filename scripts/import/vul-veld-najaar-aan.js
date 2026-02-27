#!/usr/bin/env node
/**
 * Vul veld_najaar aan voor spelers die WEL in zaal of veld_voorjaar zitten
 * maar NIET in veld_najaar. Gebruikt het team uit de dichtstbijzijnde competitie
 * (zaal > veld_voorjaar) als best guess.
 *
 * Bron: 'afgeleid' — duidelijk herkenbaar als niet-origineel.
 */
const pg = require("pg");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Alle seizoenen
  const seizoenen = await pool.query(
    "SELECT DISTINCT seizoen FROM speler_seizoenen ORDER BY seizoen"
  );

  let totaal = 0;

  for (const { seizoen } of seizoenen.rows) {
    // Spelers met zaal of veld_voorjaar maar ZONDER veld_najaar
    const missing = await pool.query(`
      SELECT ss.id as ss_id, ss.rel_code,
        MAX(CASE WHEN cs.competitie = 'zaal' THEN cs.team END) as zaal_team,
        MAX(CASE WHEN cs.competitie = 'veld_voorjaar' THEN cs.team END) as vv_team
      FROM speler_seizoenen ss
      JOIN competitie_spelers cs ON cs.speler_seizoen_id = ss.id
      WHERE ss.seizoen = $1
      AND NOT EXISTS (
        SELECT 1 FROM competitie_spelers cs2
        WHERE cs2.speler_seizoen_id = ss.id AND cs2.competitie = 'veld_najaar'
      )
      GROUP BY ss.id, ss.rel_code
    `, [seizoen]);

    if (missing.rows.length === 0) continue;

    let aangevuld = 0;
    for (const row of missing.rows) {
      // Beste guess: zaal-team (dichtst bij najaar), anders veld_voorjaar
      const team = row.zaal_team || row.vv_team;
      if (!team) continue;

      await pool.query(
        `INSERT INTO competitie_spelers (speler_seizoen_id, competitie, team, bron)
         VALUES ($1, 'veld_najaar', $2, 'afgeleid')
         ON CONFLICT (speler_seizoen_id, competitie) DO NOTHING`,
        [row.ss_id, team]
      );
      aangevuld++;
    }

    if (aangevuld > 0) {
      console.log(`${seizoen}: ${aangevuld} veld_najaar aangevuld uit zaal/veld_voorjaar`);
      totaal += aangevuld;
    }
  }

  console.log(`\nTotaal aangevuld: ${totaal}`);

  // Eindoverzicht
  const res = await pool.query(`
    SELECT ss.seizoen, cs.competitie, COUNT(*)::int as n
    FROM competitie_spelers cs
    JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id
    GROUP BY ss.seizoen, cs.competitie
    ORDER BY ss.seizoen, cs.competitie
  `);

  console.log("\n=== EINDSTAND ===");
  let cur = "";
  for (const r of res.rows) {
    if (r.seizoen !== cur) {
      if (cur) process.stdout.write("\n");
      cur = r.seizoen;
      process.stdout.write(cur + ": ");
    }
    process.stdout.write(r.competitie + "=" + r.n + "  ");
  }
  console.log();

  // Bronverdeling
  const bronnen = await pool.query(
    "SELECT bron, COUNT(*)::int as n FROM competitie_spelers GROUP BY bron ORDER BY n DESC"
  );
  console.log("\nBronverdeling:");
  for (const r of bronnen.rows) console.log("  " + r.bron + ": " + r.n);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
