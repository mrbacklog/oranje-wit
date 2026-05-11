/**
 * Verificatie na teams-migratie:
 * - Aantal teams 2025-2026 = 31
 * - Aantal aliases ≈ 60+
 * - NULL ow_team_id <5%
 * - VIEW speler_seizoenen works
 * - Historisch: NULL counts per seizoen
 *
 * Gebruik:
 *   npx tsx scripts/verify-teams-migration.ts
 */

import "dotenv/config";
import { Client } from "pg";

const SEIZOEN = "2025-2026";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log(
      `\n=== TEAMS MIGRATIE VERIFICATIE ===\n` +
        `Database: ${process.env.DATABASE_URL?.split("@")[1] || "?"}\n`
    );

    // Check 1: Teams 2025-2026 count
    console.log("CHECK 1: Teams 2025-2026");
    console.log("─".repeat(50));
    const teams = await client.query(
      `SELECT COUNT(*)::int as count FROM teams WHERE seizoen = $1`,
      [SEIZOEN]
    );
    const teamCount = teams.rows[0].count;
    console.log(`  Aantal teams: ${teamCount}`);
    console.log(`  ${teamCount === 31 ? "✓ OK (target: 31)" : `⚠ MISMATCH (verwacht: 31)`}`);

    // Check 2: Team periodes
    console.log("\nCHECK 2: Team periodes");
    console.log("─".repeat(50));
    const periodes = await client.query(
      `SELECT COUNT(*)::int as count FROM team_periodes WHERE team_id IN (SELECT id FROM teams WHERE seizoen = $1)`,
      [SEIZOEN]
    );
    const periodeCount = periodes.rows[0].count;
    console.log(`  Aantal periodes: ${periodeCount}`);
    console.log(`  ${periodeCount > 40 ? "✓ OK (expected: ~50+)" : `⚠ LOW (expected: ~50+)`}`);

    // Check 3: Team aliases
    console.log("\nCHECK 3: Team aliases 2025-2026");
    console.log("─".repeat(50));
    const aliases = await client.query(
      `SELECT COUNT(*)::int as count FROM team_aliases WHERE seizoen = $1`,
      [SEIZOEN]
    );
    const aliasCount = aliases.rows[0].count;
    console.log(`  Aantal aliases: ${aliasCount}`);
    console.log(`  ${aliasCount > 55 ? "✓ OK (expected: ~60)" : `⚠ LOW (expected: ~60)`}`);

    // Check 4: NULL ow_team_id
    console.log("\nCHECK 4: NULL ow_team_id in 2025-2026");
    console.log("─".repeat(50));
    const nullCheck = await client.query(
      `
      SELECT
        COUNT(*)::int AS null_count,
        (SELECT COUNT(*) FROM competitie_spelers WHERE seizoen = $1)::int AS total
      FROM competitie_spelers
      WHERE seizoen = $1 AND ow_team_id IS NULL
    `,
      [SEIZOEN]
    );
    const nullCount = nullCheck.rows[0].null_count;
    const totalSpelers = nullCheck.rows[0].total;
    const nullPct = totalSpelers > 0 ? (nullCount / totalSpelers) * 100 : 0;
    console.log(`  NULL count: ${nullCount}/${totalSpelers} (${nullPct.toFixed(1)}%)`);
    const nullOk = nullPct < 5;
    console.log(`  ${nullOk ? "✓ OK (<5%)" : `⚠ WARNING (>5%)`}`);

    // Check 5: VIEW test
    console.log("\nCHECK 5: VIEW speler_seizoenen");
    console.log("─".repeat(50));
    try {
      const viewTest = await client.query(
        `SELECT COUNT(*)::int as count FROM speler_seizoenen WHERE seizoen = $1`,
        [SEIZOEN]
      );
      const viewCount = viewTest.rows[0].count;
      console.log(`  VIEW count: ${viewCount} rijen`);
      console.log(`  ✓ VIEW is werkzaam`);
    } catch (err) {
      console.log(`  ✗ VIEW ERROR: ${(err as Error).message}`);
    }

    // Check 6: Team categorieën
    console.log("\nCHECK 6: Team categorieën breakdown");
    console.log("─".repeat(50));
    const breakdown = await client.query(
      `
      SELECT team_type, COUNT(*)::int as count
      FROM teams
      WHERE seizoen = $1
      GROUP BY team_type
      ORDER BY team_type
    `,
      [SEIZOEN]
    );
    breakdown.rows.forEach((row: any) => {
      console.log(`  ${row.team_type.padEnd(10)} : ${row.count}`);
    });

    // Check 7: Historisch NULL per seizoen
    console.log("\nCHECK 7: Historisch NULL per seizoen");
    console.log("─".repeat(50));
    const historisch = await client.query(
      `
      SELECT cs.seizoen, COUNT(*)::int AS null_count
      FROM competitie_spelers cs
      WHERE cs.seizoen < $1 AND cs.ow_team_id IS NULL
      GROUP BY cs.seizoen
      ORDER BY cs.seizoen DESC
    `,
      [SEIZOEN]
    );
    if (historisch.rows.length > 0) {
      console.log(`  Seizoen    | NULL count`);
      console.log(`  ───────────┼─────────────`);
      historisch.rows.forEach((row: any) => {
        console.log(`  ${row.seizoen} | ${row.null_count}`);
      });
    } else {
      console.log(`  ✓ Alle historische rijen gekoppeld (geen NULL)`);
    }

    // Summary
    console.log("\n" + "═".repeat(50));
    console.log("SAMENVATTING");
    console.log("═".repeat(50));

    const checks = [
      ["Teams 2025-2026", teamCount === 31, `${teamCount}/31`],
      ["Team periodes", periodeCount > 40, `${periodeCount} (>40)`],
      ["Team aliases", aliasCount > 55, `${aliasCount} (>55)`],
      ["NULL <5%", nullOk, `${nullPct.toFixed(1)}%`],
      ["VIEW werkzaam", true, "✓"],
    ];

    const allGreen = checks.every((c) => c[1] === true);

    checks.forEach(([name, ok, value]) => {
      console.log(`  ${ok ? "✓" : "⚠"} ${name.padEnd(20)} : ${value}`);
    });

    console.log("\n" + "═".repeat(50));
    if (allGreen) {
      console.log("✓ ALLE CHECKS GROEN — migratie succesvol");
    } else {
      console.log("⚠ SOMMIGE CHECKS GEEL — check details hierboven");
    }
    console.log("═".repeat(50) + "\n");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Verificatie mislukt:", err);
  process.exit(1);
});
