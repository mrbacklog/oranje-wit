/**
 * ensure-views.ts
 *
 * Controleert of de VIEW speler_seizoenen bestaat en maakt hem aan
 * als dat niet het geval is. Draait automatisch na elke migratie.
 *
 * Gebruik:
 *   npx tsx scripts/ensure-views.ts
 *   (of via pnpm db:ensure-views vanuit de root)
 *
 * Veilig om herhaald te draaien — gebruikt CREATE OR REPLACE.
 */

import { config } from "dotenv";
import { resolve, join } from "path";

// Laad .env uit de monorepo root
config({ path: resolve(__dirname, "..", "..", "..", ".env") });

import { Pool } from "pg";
import { readFileSync } from "fs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    // 1. Check of de VIEW bestaat
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public'
          AND table_name = 'speler_seizoenen'
      ) AS exists
    `);

    const viewExists = rows[0].exists;

    if (viewExists) {
      // Verifieer dat de VIEW werkt
      const check = await client.query("SELECT COUNT(*)::int AS n FROM speler_seizoenen LIMIT 1");
      console.log(`VIEW speler_seizoenen: OK (${check.rows[0].n} records)`);
    } else {
      console.log("VIEW speler_seizoenen NIET gevonden — wordt aangemaakt...");

      // Lees de VIEW-definitie uit views.sql
      const viewsSql = readFileSync(join(__dirname, "..", "prisma", "views.sql"), "utf-8");

      await client.query(viewsSql);

      // Verifieer
      const check = await client.query("SELECT COUNT(*)::int AS n FROM speler_seizoenen LIMIT 1");
      console.log(`VIEW speler_seizoenen: AANGEMAAKT (${check.rows[0].n} records)`);
    }
  } catch (error) {
    console.error("Fout bij controleren/aanmaken VIEW:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
