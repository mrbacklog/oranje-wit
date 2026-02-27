#!/usr/bin/env node
const pg = require("pg");

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const ss = await c.query("SELECT COUNT(*)::int as n FROM speler_seizoenen");
  const cs = await c.query("SELECT COUNT(*)::int as n FROM competitie_spelers");
  const leden = await c.query("SELECT COUNT(DISTINCT rel_code)::int as n FROM speler_seizoenen");
  console.log("=== DATASET KWALITEIT ===");
  console.log("Speler_seizoenen: " + ss.rows[0].n);
  console.log("Competitie_spelers: " + cs.rows[0].n);
  console.log("Unieke spelers: " + leden.rows[0].n);

  const dekking = await c.query(`
    SELECT ss.seizoen,
      COUNT(DISTINCT ss.id)::int as spelers,
      COUNT(DISTINCT CASE WHEN cs.competitie='veld_najaar' THEN ss.id END)::int as vn,
      COUNT(DISTINCT CASE WHEN cs.competitie='zaal' THEN ss.id END)::int as zl,
      COUNT(DISTINCT CASE WHEN cs.competitie='veld_voorjaar' THEN ss.id END)::int as vv
    FROM speler_seizoenen ss
    LEFT JOIN competitie_spelers cs ON cs.speler_seizoen_id = ss.id
    GROUP BY ss.seizoen ORDER BY ss.seizoen
  `);
  console.log("\nSeizoen        | spelers | veld_nj | zaal | veld_vj");
  console.log("-------------- | ------- | ------- | ---- | -------");
  for (const r of dekking.rows) {
    console.log(
      r.seizoen.padEnd(14) + " | " +
      String(r.spelers).padStart(7) + " | " +
      String(r.vn).padStart(7) + " | " +
      String(r.zl).padStart(4) + " | " +
      String(r.vv).padStart(7)
    );
  }

  const orphans = await c.query(
    "SELECT COUNT(*)::int as n FROM speler_seizoenen ss WHERE NOT EXISTS (SELECT 1 FROM competitie_spelers cs WHERE cs.speler_seizoen_id = ss.id)"
  );
  console.log("\nSpeler_seizoenen zonder competitie_spelers: " + orphans.rows[0].n);

  const fk = await c.query(
    "SELECT COUNT(*)::int as n FROM speler_seizoenen ss WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = ss.rel_code)"
  );
  console.log("Speler_seizoenen met onbekende rel_code: " + fk.rows[0].n);

  const bronnen = await c.query(
    "SELECT bron, COUNT(*)::int as n FROM competitie_spelers GROUP BY bron ORDER BY n DESC"
  );
  console.log("\nBronverdeling competitie_spelers:");
  for (const r of bronnen.rows) console.log("  " + r.bron + ": " + r.n);

  const bron_ss = await c.query(
    "SELECT bron, COUNT(*)::int as n FROM speler_seizoenen GROUP BY bron ORDER BY n DESC"
  );
  console.log("\nBronverdeling speler_seizoenen:");
  for (const r of bron_ss.rows) console.log("  " + r.bron + ": " + r.n);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
