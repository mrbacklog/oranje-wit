/**
 * Historische alias-backfill: team_aliases vullen voor 2010-2011 t/m 2024-2025.
 *
 * In die seizoenen waren de OW-teamnamen gelijk aan de KNKV-namen (A1 = A1 etc.),
 * dus elke ow_code wordt als alias van zichzelf geregistreerd.
 *
 * Gebruik:
 *   npx tsx scripts/migrate-teams-historisch.ts
 */

// eslint-disable-next-line no-console — migration script, intentional console output
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("=== Historische alias-backfill ===\n");

  // Haal alle historische OW-teams op (niet 2025-2026)
  const teams = await client.query(
    `SELECT id, seizoen, ow_code, naam FROM teams WHERE seizoen != '2025-2026' ORDER BY seizoen, ow_code`
  );

  let aliasInserted = 0;
  for (const team of teams.rows) {
    // De historische KNKV-naam is de ow_code zonder "OW-" prefix
    // bv. "OW-A1" → KNKV-naam "A1"
    const knkvNaam = team.ow_code.replace(/^OW-/, "");

    await client.query(
      `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (seizoen, alias) DO NOTHING`,
      [team.seizoen, knkvNaam, team.id, team.ow_code]
    );
    aliasInserted++;
  }
  console.log(`✓ ${aliasInserted} historische aliases aangemaakt`);

  // Backfill ow_team_id voor alle historische seizoenen
  const backfill = await client.query(`
    UPDATE competitie_spelers cs
    SET ow_team_id = a.ow_team_id
    FROM team_aliases a
    WHERE a.seizoen = cs.seizoen
      AND a.alias = cs.team
      AND cs.seizoen != '2025-2026'
      AND cs.ow_team_id IS NULL
  `);
  console.log(`✓ ${backfill.rowCount} historische competitie_spelers rijen gekoppeld`);

  const nullCheck = await client.query(
    `SELECT seizoen, COUNT(*)::int as null_count FROM competitie_spelers WHERE seizoen != '2025-2026' AND ow_team_id IS NULL GROUP BY seizoen ORDER BY seizoen DESC`
  );
  if (nullCheck.rows.length > 0) {
    console.log("⚠ Nog ontkoppelde rijen per seizoen:");
    nullCheck.rows.forEach((r: any) => console.log(`  ${r.seizoen}: ${r.null_count} rijen`));
  } else {
    console.log("✓ Alle historische rijen gekoppeld");
  }

  await client.end();
  console.log("\n=== Klaar ===");
}

main().catch((err) => {
  console.error("Mislukt:", err);
  process.exit(1);
});
