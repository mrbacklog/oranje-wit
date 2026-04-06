const { Client } = require("pg");

async function run() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await c.connect();
    console.log("✓ Verbonden met database\n");

    // Q1
    console.log("===== Q1: Teams per seizoen =====");
    let { rows: q1 } = await c.query(
      `SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
       FROM competitie_spelers
       GROUP BY seizoen ORDER BY seizoen`
    );
    console.log("Seizoen        | Teams");
    console.log("---------------|-------");
    for (const r of q1) {
      console.log(`${r.seizoen.padEnd(14)}| ${r.aantal_teams}`);
    }

    // Q2
    console.log("\n===== Q2: Teams in 2025-2026 (competitie_spelers) =====");
    let { rows: q2 } = await c.query(`
      SELECT team, competitie, COUNT(*) as spelers
      FROM competitie_spelers
      WHERE seizoen = '2025-2026'
      GROUP BY team, competitie ORDER BY team, competitie
    `);
    console.log("Team".padEnd(30) + "| Competitie        | Spelers");
    console.log("-".repeat(70));
    for (const r of q2) {
      console.log(
        r.team.padEnd(30) + "| " +
        r.competitie.padEnd(17) + "| " +
        r.spelers
      );
    }

    // Q3
    console.log("\n===== Q3: Teams tabel 2025-2026 =====");
    let { rows: q3 } = await c.query(`
      SELECT id, ow_code, naam, categorie, leeftijdsgroep, is_selectie
      FROM teams WHERE seizoen = '2025-2026' ORDER BY ow_code
    `);
    console.log("ID  | OW_Code    | Naam                 | Cat | Leeft. | Sel");
    console.log("-".repeat(70));
    for (const r of q3) {
      console.log(
        `${r.id.toString().padEnd(3)} | ${r.ow_code.padEnd(10)} | ` +
        `${(r.naam || "-").padEnd(20)} | ${(r.categorie || "-").padEnd(3)} | ` +
        `${(r.leeftijdsgroep || "-").padEnd(6)} | ${r.is_selectie}`
      );
    }

    // Q4
    console.log("\n===== Q4: Team periodes 2025-2026 =====");
    let { rows: q4 } = await c.query(`
      SELECT t.ow_code, t.naam, tp.periode, tp.j_nummer, tp.pool, tp.sterkte
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id
      WHERE t.seizoen = '2025-2026'
      ORDER BY t.ow_code, tp.periode
    `);
    if (q4.length > 0) {
      console.log("OW_Code | Naam                 | Periode         | J-Nr | Pool");
      console.log("-".repeat(70));
      for (const r of q4) {
        console.log(
          `${r.ow_code.padEnd(7)} | ${(r.naam || "-").padEnd(20)} | ` +
          `${r.periode.padEnd(15)} | ${(r.j_nummer || "-").padEnd(4)} | ${r.pool || "-"}`
        );
      }
    } else {
      console.log("⚠ GEEN team_periodes gevonden!");
    }

    // Q5
    console.log("\n===== Q5: Teams 2024-2025 =====");
    let { rows: q5 } = await c.query(`
      SELECT DISTINCT team FROM competitie_spelers
      WHERE seizoen = '2024-2025' ORDER BY team
    `);
    console.log(`Totaal: ${q5.length} teams`);
    for (let i = 0; i < q5.length; i++) {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${q5[i].team}`);
    }

    // ANALYSE
    console.log("\n===== ANALYSE =====");
    console.log(`Teams in 2025-2026 (competitie_spelers): ${q2.length} (team+competitie combos)`);
    console.log(`Teams in 2025-2026 (teams tabel): ${q3.length}`);
    console.log(`Teams in 2024-2025 (competitie_spelers): ${q5.length}`);

    // Unique team names in Q2
    const uniqueTeams = new Set(q2.map(r => r.team));
    console.log(`Unieke team-namen in 2025-2026: ${uniqueTeams.size}`);

    if (q1.length > 0) {
      console.log("\nGebruikelijke team-aantallen per seizoen:");
      const avgTeams = q1.slice(-5).reduce((s, r) => s + r.aantal_teams, 0) / 5;
      console.log(`  Gemiddelde vorig 5 seizoenen: ~${Math.round(avgTeams)}`);
      console.log(`  2025-2026: ${q1[q1.length - 1]?.aantal_teams || "?"}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await c.end();
  }
}

run();
