/**
 * migrate-deploy.ts
 *
 * Wrapper rondom `prisma migrate deploy` die daarna de VIEW speler_seizoenen
 * herstelt als die verdwenen is. Dit is het veilige commando voor productie.
 *
 * Gebruik:
 *   npx tsx scripts/migrate-deploy.ts
 *   (of via pnpm db:migrate:deploy vanuit de root)
 */

import { config } from "dotenv";
import { resolve, join } from "path";

// Laad .env.local (als het bestaat), dan .env als fallback — zelfde volgorde als Next.js
config({ path: resolve(__dirname, "..", "..", "..", ".env.local") });
config({ path: resolve(__dirname, "..", "..", "..", ".env") });

import { execSync } from "child_process";
import { Pool } from "pg";
import { readFileSync } from "fs";

async function main() {
  console.log("=== Prisma Migrate Deploy ===\n");

  // Stap 1: Draai prisma migrate deploy
  console.log("1. Prisma migraties uitvoeren...");
  try {
    execSync("npx prisma migrate deploy", {
      cwd: join(__dirname, ".."),
      stdio: "inherit",
      env: { ...process.env },
    });
  } catch {
    console.error("\nMigratie mislukt! Controleer de foutmelding hierboven.");
    process.exit(1);
  }

  // Stap 2: Controleer en herstel VIEW
  console.log("\n2. VIEW speler_seizoenen controleren...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public'
          AND table_name = 'speler_seizoenen'
      ) AS exists
    `);

    if (rows[0].exists) {
      const check = await client.query("SELECT COUNT(*)::int AS n FROM speler_seizoenen");
      console.log(`   VIEW speler_seizoenen: OK (${check.rows[0].n} records)`);
    } else {
      console.log("   VIEW speler_seizoenen VERDWENEN na migratie — wordt hersteld...");
      const viewsSql = readFileSync(join(__dirname, "..", "prisma", "views.sql"), "utf-8");
      await client.query(viewsSql);
      const check = await client.query("SELECT COUNT(*)::int AS n FROM speler_seizoenen");
      console.log(`   VIEW speler_seizoenen: HERSTELD (${check.rows[0].n} records)`);
    }
  } catch (error) {
    console.error("Fout bij VIEW-controle:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  console.log("\nKlaar.");
}

main();
