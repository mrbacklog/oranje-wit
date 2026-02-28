#!/usr/bin/env node
const pg = require("pg");

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const cs = await c.query("SELECT COUNT(*)::int as n FROM competitie_spelers");
  const leden = await c.query("SELECT COUNT(DISTINCT rel_code)::int as n FROM competitie_spelers");
  console.log("=== DATASET KWALITEIT ===");
  console.log("Competitie_spelers: " + cs.rows[0].n);
  console.log("Unieke spelers: " + leden.rows[0].n);

  const dekking = await c.query(`
    SELECT seizoen,
      COUNT(DISTINCT rel_code)::int as spelers,
      COUNT(*) FILTER (WHERE competitie='veld_najaar')::int as vn,
      COUNT(*) FILTER (WHERE competitie='zaal')::int as zl,
      COUNT(*) FILTER (WHERE competitie='veld_voorjaar')::int as vv
    FROM competitie_spelers
    GROUP BY seizoen ORDER BY seizoen
  `);
  console.log("\nSeizoen        | spelers | veld_nj | zaal | veld_vj");
  console.log("-------------- | ------- | ------- | ---- | -------");
  for (const r of dekking.rows) {
    console.log(
      r.seizoen.padEnd(14) +
        " | " +
        String(r.spelers).padStart(7) +
        " | " +
        String(r.vn).padStart(7) +
        " | " +
        String(r.zl).padStart(4) +
        " | " +
        String(r.vv).padStart(7)
    );
  }

  // VIEW check
  const sv = await c.query("SELECT COUNT(*)::int as n FROM speler_seizoenen");
  console.log("\nVIEW speler_seizoenen: " + sv.rows[0].n + " records");

  const fk = await c.query(
    "SELECT COUNT(*)::int as n FROM competitie_spelers cp WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = cp.rel_code)"
  );
  console.log("Competitie_spelers met onbekende rel_code: " + fk.rows[0].n);

  const bronnen = await c.query(
    "SELECT bron, COUNT(*)::int as n FROM competitie_spelers GROUP BY bron ORDER BY n DESC"
  );
  console.log("\nBronverdeling competitie_spelers:");
  for (const r of bronnen.rows) console.log("  " + r.bron + ": " + r.n);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
