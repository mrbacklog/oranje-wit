/**
 * Migratie: voeg ronde, type, team_naam en updatedAt toe aan Evaluatie tabel.
 *
 * Dit script voert de migratie handmatig uit via raw SQL zodat de VIEW
 * `speler_seizoenen` niet gedropt wordt (wat `pnpm db:push` wél zou doen).
 *
 * Gebruik: npx tsx scripts/migrate-evaluatie-ronde.ts
 */

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();

  try {
    // 1. Bewaar VIEW-definitie als vangnet
    const viewResult = await client.query(`SELECT pg_get_viewdef('speler_seizoenen', true) AS def`);
    const viewDef = viewResult.rows[0]?.def;
    console.log("VIEW speler_seizoenen bewaard:", viewDef ? "OK" : "NIET GEVONDEN");

    await client.query("BEGIN");

    // 2. Kolommen toevoegen (IF NOT EXISTS voor herhaalbaarheid)
    console.log("\nKolommen toevoegen...");

    await client.query(`
      ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS "ronde" INTEGER NOT NULL DEFAULT 1
    `);
    console.log("  + ronde (default 1)");

    await client.query(`
      ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'trainer'
    `);
    console.log("  + type (default 'trainer')");

    await client.query(`
      ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS "team_naam" TEXT
    `);
    console.log("  + team_naam");

    await client.query(`
      ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log("  + updatedAt");

    // 3. Vul team_naam uit bestaande scores JSON
    const updateResult = await client.query(`
      UPDATE "Evaluatie"
      SET "team_naam" = scores->>'team_naam'
      WHERE scores->>'team_naam' IS NOT NULL
        AND "team_naam" IS NULL
    `);
    console.log(`\nteam_naam ingevuld uit scores JSON: ${updateResult.rowCount} records`);

    // 4. Oude unique constraint droppen, nieuwe aanmaken
    console.log("\nConstraints bijwerken...");

    // Check of oude constraint bestaat
    const oldConstraint = await client.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = '"Evaluatie"'::regclass
        AND conname = 'Evaluatie_spelerId_seizoen_key'
    `);

    if (oldConstraint.rowCount && oldConstraint.rowCount > 0) {
      await client.query(`
        ALTER TABLE "Evaluatie" DROP CONSTRAINT "Evaluatie_spelerId_seizoen_key"
      `);
      console.log("  - Oude constraint (spelerId, seizoen) verwijderd");
    }

    // Nieuwe unique constraint
    const newConstraint = await client.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = '"Evaluatie"'::regclass
        AND conname = 'Evaluatie_spelerId_seizoen_ronde_type_key'
    `);

    if (!newConstraint.rowCount || newConstraint.rowCount === 0) {
      await client.query(`
        CREATE UNIQUE INDEX "Evaluatie_spelerId_seizoen_ronde_type_key"
        ON "Evaluatie"("spelerId", "seizoen", "ronde", "type")
      `);
      console.log("  + Nieuwe constraint (spelerId, seizoen, ronde, type) aangemaakt");
    } else {
      console.log("  = Nieuwe constraint bestaat al");
    }

    // 5. Extra indexes
    const indexes = [
      {
        name: "Evaluatie_seizoen_ronde_idx",
        sql: `CREATE INDEX IF NOT EXISTS "Evaluatie_seizoen_ronde_idx" ON "Evaluatie"("seizoen", "ronde")`,
      },
      {
        name: "Evaluatie_type_idx",
        sql: `CREATE INDEX IF NOT EXISTS "Evaluatie_type_idx" ON "Evaluatie"("type")`,
      },
    ];

    for (const idx of indexes) {
      await client.query(idx.sql);
      console.log(`  + Index ${idx.name}`);
    }

    await client.query("COMMIT");
    console.log("\nMigratie succesvol!");

    // 6. Verifieer VIEW
    const viewCheck = await client.query(`SELECT COUNT(*) AS cnt FROM speler_seizoenen LIMIT 1`);
    console.log(`VIEW speler_seizoenen intact: ${viewCheck.rows[0].cnt} records`);

    // 7. Toon huidige staat
    const countResult = await client.query(`SELECT COUNT(*) AS cnt FROM "Evaluatie"`);
    console.log(`Evaluatie records: ${countResult.rows[0].cnt}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migratie mislukt, rollback uitgevoerd:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
