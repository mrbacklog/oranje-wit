const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // Welke competities (periodes) hebben we voor 2025-2026?
  const periodes = await c.query(`
    SELECT competitie, COUNT(DISTINCT rel_code) as spelers, COUNT(*) as records
    FROM competitie_spelers
    WHERE seizoen = '2025-2026'
    GROUP BY competitie
    ORDER BY competitie
  `);
  console.log("Periodes 2025-2026:");
  periodes.rows.forEach((r) =>
    console.log(`  ${r.competitie}: ${r.spelers} spelers (${r.records} records)`)
  );

  // Per J-team: verschilt de samenstelling tussen periodes?
  const teams = await c.query(`
    SELECT competitie, team, COUNT(DISTINCT rel_code) as spelers
    FROM competitie_spelers
    WHERE seizoen = '2025-2026' AND team LIKE 'J%'
    GROUP BY competitie, team
    ORDER BY team, competitie
  `);

  console.log("\nJ-teams per periode:");
  let prevTeam = "";
  for (const r of teams.rows) {
    if (r.team !== prevTeam) console.log(`\n  ${r.team}:`);
    console.log(`    ${r.competitie}: ${r.spelers} spelers`);
    prevTeam = r.team;
  }

  // Check specifiek Rood-1 (J1): wie zit er per periode?
  console.log("\n\n=== J1 per periode (detail) ===");
  const j1Detail = await c.query(`
    SELECT cp.competitie, l.roepnaam, l.tussenvoegsel, l.achternaam, l.rel_code
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026' AND cp.team = 'J1'
    ORDER BY cp.competitie, l.achternaam
  `);
  let prevComp = "";
  for (const r of j1Detail.rows) {
    if (r.competitie !== prevComp) {
      console.log(`\n  ${r.competitie}:`);
      prevComp = r.competitie;
    }
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    console.log(`    ${r.roepnaam} ${naam} (${r.rel_code})`);
  }

  // Verschil: wie zit in veld_najaar maar niet in zaal (of omgekeerd)?
  console.log("\n\n=== Spelers die ALLEEN in zaal zitten (niet in veld_najaar) ===");
  const zaalOnly = await c.query(`
    SELECT DISTINCT cp.team, l.roepnaam, l.tussenvoegsel, l.achternaam, l.rel_code
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026'
      AND cp.competitie LIKE 'zaal%'
      AND cp.team LIKE 'J%'
      AND NOT EXISTS (
        SELECT 1 FROM competitie_spelers cp2
        WHERE cp2.rel_code = cp.rel_code AND cp2.seizoen = '2025-2026' AND cp2.competitie = 'veld_najaar' AND cp2.team = cp.team
      )
    ORDER BY cp.team, l.achternaam
  `);
  zaalOnly.rows.forEach((r) => {
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    console.log(`  ${r.team}: ${r.roepnaam} ${naam} (${r.rel_code})`);
  });

  await c.end();
}
main().catch(console.error);
