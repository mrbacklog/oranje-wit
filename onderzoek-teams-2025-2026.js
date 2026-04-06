#!/usr/bin/env node
const { Client } = require("pg");

const connectionString =
  "postgresql://postgres:owdb2026secret@shinkansen.proxy.rlwy.net:18957/oranjewit";

async function runQueries() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✓ Verbonden met database\n");

    // Query 1: Teams per seizoen
    console.log("=== QUERY 1: Aantal teams per seizoen ===");
    const q1 = await client.query(`
      SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
      FROM competitie_spelers
      GROUP BY seizoen ORDER BY seizoen;
    `);
    console.table(q1.rows);
    console.log();

    // Query 2: Teams in 2025-2026
    console.log("=== QUERY 2: Teams in 2025-2026 ===");
    const q2 = await client.query(`
      SELECT DISTINCT team, competitie, COUNT(*) as spelers
      FROM competitie_spelers
      WHERE seizoen = '2025-2026'
      GROUP BY team, competitie ORDER BY team, competitie;
    `);
    console.table(q2.rows);
    console.log();

    // Query 3: Teams tabel voor 2025-2026
    console.log("=== QUERY 3: Teams tabel voor 2025-2026 ===");
    const q3 = await client.query(`
      SELECT * FROM teams WHERE seizoen = '2025-2026' ORDER BY ow_code;
    `);
    console.table(q3.rows);
    console.log();

    // Query 4: Team periodes voor 2025-2026
    console.log("=== QUERY 4: Team periodes voor 2025-2026 ===");
    const q4 = await client.query(`
      SELECT t.ow_code, t.naam, tp.j_nummer, tp.pool, tp.sterkte, tp.fase
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id
      WHERE t.seizoen = '2025-2026'
      ORDER BY t.ow_code;
    `);
    console.table(q4.rows);
    console.log();

    // Query 5: Teams in vorig seizoen
    console.log("=== QUERY 5: Teams in 2024-2025 ===");
    const q5 = await client.query(`
      SELECT DISTINCT team FROM competitie_spelers
      WHERE seizoen = '2024-2025' ORDER BY team;
    `);
    console.table(q5.rows);
    console.log();

    // Vergeleken stats
    console.log("=== ANALYSE ===");
    console.log(`Teams in 2025-2026: ${q2.rows.length} (unieke team+competitie combos)`);
    console.log(`Teams in 2024-2025: ${q5.rows.length} (unieke teams)`);
    console.log(
      `Teams in teams-tabel 2025-2026: ${q3.rows.length} (bestuursteam records)`
    );

    // Check voor duplicaten
    const teamNamen2026 = q2.rows.map((r) => r.team);
    const unieke = new Set(teamNamen2026);
    console.log(`\nUnieke teamnamen in competitie_spelers 2025-2026: ${unieke.size}`);
    if (teamNamen2026.length !== unieke.size) {
      console.warn("⚠ WAARSCHUWING: Dubbele teams in competitie_spelers!");
    }
  } catch (error) {
    console.error("Database error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runQueries();
