const { Client } = require("pg");

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  // 1. Hoeveel spelers hebben een selectie-alias als "beste" team?
  const { rows: bestTeam } = await c.query(`
    WITH best_team AS (
      SELECT DISTINCT ON (cp.rel_code)
        cp.rel_code, cp.team, cp.competitie
      FROM competitie_spelers cp
      WHERE cp.seizoen = '2025-2026' AND cp.team IS NOT NULL
      ORDER BY cp.rel_code, CASE cp.competitie
        WHEN 'zaal' THEN 1 WHEN 'veld_najaar' THEN 2 WHEN 'veld_voorjaar' THEN 3 ELSE 4
      END
    )
    SELECT team, competitie, COUNT(*) as cnt
    FROM best_team
    WHERE team IN ('S1/S2', 'S1S2', 'U17', 'U19', 'U15')
    GROUP BY team, competitie
    ORDER BY team
  `);

  console.log("=== Spelers waarvan selectie-alias het beste team is ===");
  if (bestTeam.length === 0) {
    console.log("  (geen — alle selectie-spelers zijn later opgelost naar specifiek team)");
  } else {
    for (const r of bestTeam) {
      console.log(`  ${r.team}: ${r.cnt} spelers (competitie: ${r.competitie})`);
    }
  }

  // 2. Selectie-spelers die later een specifiek team kregen
  const { rows: resolved } = await c.query(`
    SELECT cp_veld.team as selectie, cp_zaal.team as definitief_team, COUNT(*) as cnt
    FROM competitie_spelers cp_veld
    JOIN competitie_spelers cp_zaal
      ON cp_veld.rel_code = cp_zaal.rel_code
      AND cp_zaal.seizoen = '2025-2026'
      AND cp_zaal.competitie = 'zaal'
    WHERE cp_veld.seizoen = '2025-2026'
      AND cp_veld.competitie = 'veld_najaar'
      AND cp_veld.team IN ('S1/S2', 'S1S2', 'U17', 'U19', 'U15')
    GROUP BY cp_veld.team, cp_zaal.team
    ORDER BY cp_veld.team, cp_zaal.team
  `);

  console.log("\n=== Selectie-spelers → definitief team (veld→zaal) ===");
  for (const r of resolved) {
    console.log(`  ${r.selectie} → ${r.definitief_team}: ${r.cnt} spelers`);
  }

  // 3. Alle competitie-records voor een selectie-speler als voorbeeld
  const { rows: example } = await c.query(`
    SELECT cp.rel_code, l.roepnaam, l.achternaam, cp.competitie, cp.team
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026'
      AND cp.rel_code IN (
        SELECT rel_code FROM competitie_spelers
        WHERE seizoen = '2025-2026' AND competitie = 'veld_najaar' AND team = 'S1/S2'
        LIMIT 3
      )
    ORDER BY cp.rel_code, CASE cp.competitie
      WHEN 'veld_najaar' THEN 1 WHEN 'zaal' THEN 2 WHEN 'veld_voorjaar' THEN 3 ELSE 4
    END
  `);

  console.log("\n=== Voorbeeld: 3 S1/S2 spelers door het seizoen ===");
  let currentPlayer = "";
  for (const r of example) {
    if (r.rel_code !== currentPlayer) {
      currentPlayer = r.rel_code;
      console.log(`\n  ${r.roepnaam} ${r.achternaam} (${r.rel_code}):`);
    }
    console.log(`    ${r.competitie.padEnd(15)} → ${r.team}`);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
