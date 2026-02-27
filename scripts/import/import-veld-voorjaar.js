#!/usr/bin/env node
/**
 * Importeer Sportlink juni-snapshots als veld_voorjaar in competitie_spelers.
 * Snapshot van 1 juni = tijdens veld_voorjaar, dus volledige teamindeling op dat moment.
 */
const pg = require("pg");
const fs = require("fs");

const MAPPING = {
  "2018-06-01": "2017-2018",
  "2019-06-01": "2018-2019",
  "2020-06-01": "2019-2020",
  "2021-06-01": "2020-2021",
  "2022-06-01": "2021-2022",
  "2023-06-01": "2022-2023",
  "2024-06-01": "2023-2024",
  "2025-06-01": "2024-2025",
};

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let totaalIngevoegd = 0, totaalNieuwSS = 0, totaalNietGevonden = 0;

  for (const [datum, seizoen] of Object.entries(MAPPING).sort()) {
    const fp = `data/leden/snapshots/${datum}.json`;
    if (!fs.existsSync(fp)) { console.log(`${seizoen}: GEEN SNAPSHOT`); continue; }

    const snap = JSON.parse(fs.readFileSync(fp, "utf8"));
    const leden = (snap.leden || []).filter(l => l.team && l.team.trim() && l.rel_code);

    let ingevoegd = 0, nieuwSS = 0, nietGevonden = 0;

    for (const lid of leden) {
      const relCode = lid.rel_code;
      const team = lid.team.trim();

      // Zoek speler_seizoen
      let ssRes = await pool.query(
        "SELECT id FROM speler_seizoenen WHERE rel_code = $1 AND seizoen = $2",
        [relCode, seizoen]
      );

      let ssId;
      if (ssRes.rows.length > 0) {
        ssId = ssRes.rows[0].id;
      } else {
        // Check of lid bestaat
        const lidRes = await pool.query(
          "SELECT rel_code, geslacht FROM leden WHERE rel_code = $1",
          [relCode]
        );
        if (lidRes.rows.length === 0) {
          nietGevonden++;
          continue;
        }
        const ins = await pool.query(
          `INSERT INTO speler_seizoenen (rel_code, seizoen, team, geslacht, bron, betrouwbaar)
           VALUES ($1, $2, $3, $4, 'snapshot', true) RETURNING id`,
          [relCode, seizoen, team, lidRes.rows[0].geslacht]
        );
        ssId = ins.rows[0].id;
        nieuwSS++;
      }

      // Upsert veld_voorjaar
      await pool.query(
        `INSERT INTO competitie_spelers (speler_seizoen_id, competitie, team, bron)
         VALUES ($1, 'veld_voorjaar', $2, 'snapshot')
         ON CONFLICT (speler_seizoen_id, competitie) DO UPDATE SET
           team = EXCLUDED.team, bron = EXCLUDED.bron`,
        [ssId, team]
      );
      ingevoegd++;
    }

    totaalIngevoegd += ingevoegd;
    totaalNieuwSS += nieuwSS;
    totaalNietGevonden += nietGevonden;

    console.log(
      `${seizoen}: ${ingevoegd} veld_voorjaar` +
      (nieuwSS > 0 ? `, ${nieuwSS} nieuwe speler_seizoenen` : "") +
      (nietGevonden > 0 ? `, ${nietGevonden} niet in leden-tabel` : "") +
      ` ← ${datum}`
    );
  }

  console.log(`\nTotaal: ${totaalIngevoegd} veld_voorjaar, ${totaalNieuwSS} nieuwe SS, ${totaalNietGevonden} niet gevonden`);

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

  const tot = await pool.query("SELECT COUNT(*)::int as n FROM competitie_spelers");
  console.log("\nTotaal competitie_spelers: " + tot.rows[0].n);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
