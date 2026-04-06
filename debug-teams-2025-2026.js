#!/usr/bin/env node
// Debug script: onderzoek waarom team-aantallen vreemd zijn
// Run: node -r dotenv/config debug-teams-2025-2026.js

const { Client } = require("pg");

async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await c.connect();
    console.log("✓ Verbonden met database\n");

    // Q1: Teams per seizoen (overview)
    console.log("=" .repeat(80));
    console.log("Q1: TEAMS PER SEIZOEN (overzicht trend)");
    console.log("=".repeat(80));
    let { rows: q1 } = await c.query(
      `SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
       FROM competitie_spelers
       GROUP BY seizoen ORDER BY seizoen`
    );
    console.log("Seizoen        | Teams");
    console.log("-".repeat(40));
    for (const r of q1) {
      console.log(`${r.seizoen.padEnd(14)}| ${r.aantal_teams}`);
    }

    // Q2: Team+competitie combos in 2025-2026
    console.log("\n" + "=".repeat(80));
    console.log("Q2: TEAMS IN 2025-2026 (competitie_spelers gebroken uit naar team+competitie)");
    console.log("=".repeat(80));
    let { rows: q2 } = await c.query(`
      SELECT team, competitie, COUNT(*) as spelers
      FROM competitie_spelers
      WHERE seizoen = '2025-2026'
      GROUP BY team, competitie ORDER BY team, competitie
    `);
    console.log("Team".padEnd(35) + "| Competitie       | Spelers");
    console.log("-".repeat(80));
    for (const r of q2) {
      console.log(
        r.team.padEnd(35) + "| " +
        r.competitie.padEnd(16) + "| " +
        r.spelers
      );
    }

    const teamCount2026 = q2.length;
    const uniqueTeamNames = new Set(q2.map(r => r.team)).size;
    console.log("\n📊 TELLING Q2: ");
    console.log(`  Team+competitie combos: ${teamCount2026}`);
    console.log(`  Unieke team-namen: ${uniqueTeamNames}`);

    // Q3: Teams in teams-tabel
    console.log("\n" + "=".repeat(80));
    console.log("Q3: TEAMS TABEL 2025-2026 (masters record: OW teams)");
    console.log("=".repeat(80));
    let { rows: q3 } = await c.query(`
      SELECT id, seizoen, ow_code, naam, categorie, leeftijdsgroep, is_selectie
      FROM teams WHERE seizoen = '2025-2026' ORDER BY ow_code
    `);
    console.log("ID  | OW_Code    | Naam                     | Cat | Leeft. | Sel");
    console.log("-".repeat(85));
    for (const r of q3) {
      console.log(
        `${r.id.toString().padEnd(3)} | ${r.ow_code.padEnd(10)} | ` +
        `${(r.naam || "-").padEnd(24)} | ${(r.categorie || "-").padEnd(3)} | ` +
        `${(r.leeftijdsgroep || "-").padEnd(6)} | ${r.is_selectie}`
      );
    }
    console.log(`\n📊 TELLING Q3: ${q3.length} teams in teams-tabel`);

    // Q4: Team periodes
    console.log("\n" + "=".repeat(80));
    console.log("Q4: TEAM PERIODES 2025-2026");
    console.log("=".repeat(80));
    let { rows: q4 } = await c.query(`
      SELECT t.id, t.ow_code, t.naam, tp.periode, tp.j_nummer, tp.pool, tp.sterkte
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id
      WHERE t.seizoen = '2025-2026'
      ORDER BY t.ow_code, tp.periode
    `);
    if (q4.length > 0) {
      console.log("Team ID | OW_Code | Naam                 | Periode         | J-Nr | Pool");
      console.log("-".repeat(85));
      for (const r of q4) {
        console.log(
          `${r.id.toString().padEnd(7)} | ` +
          `${r.ow_code.padEnd(7)} | ${(r.naam || "-").padEnd(20)} | ` +
          `${r.periode.padEnd(15)} | ${(r.j_nummer || "-").padEnd(4)} | ${r.pool || "-"}`
        );
      }
      console.log(`\n📊 TELLING Q4: ${q4.length} periodes voor ${new Set(q4.map(r => r.id)).size} teams`);
    } else {
      console.log("⚠ GEEN team_periodes gevonden!");
    }

    // Q5: Teams 2024-2025
    console.log("\n" + "=".repeat(80));
    console.log("Q5: TEAMS 2024-2025 (vorig seizoen ter vergelijking)");
    console.log("=".repeat(80));
    let { rows: q5 } = await c.query(`
      SELECT DISTINCT team FROM competitie_spelers
      WHERE seizoen = '2024-2025' ORDER BY team
    `);
    console.log(`Totaal: ${q5.length} unieke teams\n`);
    for (let i = 0; i < q5.length; i++) {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${q5[i].team}`);
    }

    // ROOT CAUSE ANALYSE
    console.log("\n" + "=".repeat(80));
    console.log("ROOT CAUSE ANALYSE");
    console.log("=".repeat(80));

    // Vergelijk teams tussen seizoenen
    const teams2024 = new Set(q5.map(r => r.team));
    const teams2026 = new Set(q2.map(r => r.team));

    console.log(`\n✓ Seizoen vergelijking:`);
    console.log(`  2024-2025: ${q1.find(r => r.seizoen === '2024-2025')?.aantal_teams || "?"} (team-count)`);
    console.log(`  2025-2026: ${q1.find(r => r.seizoen === '2025-2026')?.aantal_teams || "?"} (team-count)`);

    console.log(`\n✓ Teams analyse 2025-2026:`);
    console.log(`  competitie_spelers: ${teamCount2026} team+competitie combos`);
    console.log(`  teams-tabel: ${q3.length} master teams`);
    console.log(`  team_periodes: ${q4.length} periodes`);

    // Check alignment
    const avgCompetitiesPerTeam = (teamCount2026 / uniqueTeamNames).toFixed(2);
    console.log(`\n✓ Alignment check:`);
    console.log(`  ${uniqueTeamNames} unieke teamnamen × ~${avgCompetitiesPerTeam} competities = ${teamCount2026} combos`);

    // Check for weird team names
    console.log(`\n✓ Team-naming analyse:`);
    const weird = [];
    for (const teamName of teams2026) {
      if (teamName.toLowerCase().includes("select") || teamName.includes("_")) {
        weird.push(teamName);
      }
    }
    if (weird.length > 0) {
      console.log(`  ⚠ Potentieel rare naamgeving: ${weird.join(", ")}`);
    } else {
      console.log(`  ✓ Team-naming lijkt consistent`);
    }

    // Final verdict
    console.log(`\n` + "=".repeat(80));
    console.log("BEVINDINGEN");
    console.log("=".repeat(80));

    if (q3.length === uniqueTeamNames && q3.length > 0) {
      console.log("\n✓ STATUS: Waarschijnlijk NORMAAL");
      console.log("  - teams-tabel (${q3.length}) matches unieke teamnamen in competitie_spelers");
      console.log(`  - Er zijn ${teamCount2026} team+competitie combos (multi-competitie teams)`);
    } else if (q3.length > uniqueTeamNames) {
      console.log("\n⚠ STATUS: DUBBELE TEAMS IN TABEL");
      console.log(`  - teams-tabel heeft ${q3.length} rijen`);
      console.log(`  - Maar slechts ${uniqueTeamNames} unieke teamnamen in competitie_spelers`);
      console.log("  - Root cause: Dubbele entries in teams-tabel!");
    } else if (uniqueTeamNames > q3.length) {
      console.log("\n⚠ STATUS: TEAMS MISSEN UIT TABEL");
      console.log(`  - competitie_spelers heeft ${uniqueTeamNames} unieke teams`);
      console.log(`  - teams-tabel heeft slechts ${q3.length} records`);
      console.log("  - Root cause: Not all teams are in the master teams table!");
    } else if (teamCount2026 > q1.find(r => r.seizoen === '2025-2026')?.aantal_teams * 2) {
      console.log("\n⚠ STATUS: ABNORMAAL HOOG");
      console.log(`  - Meer combos (${teamCount2026}) dan normaal per seizoen (~${q1.slice(-5)[0]?.aantal_teams})`);
      console.log("  - Root cause: Mogelijke invoerfout of data-corrupt");
    }

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await c.end();
  }
}

run();
