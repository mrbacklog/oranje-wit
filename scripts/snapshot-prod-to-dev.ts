/**
 * Productie → dev snapshot voor blocker-A historisch dry-run.
 *
 * Kopieert 7 teamindeling-tabellen via twee gelijktijdige pg.Client connecties.
 * Geen pg_dump nodig; geen bestanden op disk.
 *
 * Productie: ALLEEN SELECT (read-only).
 * Dev: TRUNCATE in omgekeerde FK-volgorde, daarna INSERT in FK-volgorde.
 *
 * Gebruik:
 *   PROD_DATABASE_URL="postgresql://..." DEV_DATABASE_URL="postgresql://..." \
 *     npx tsx scripts/snapshot-prod-to-dev.ts
 */

import "dotenv/config";
import { Client } from "pg";
import { logger } from "@oranje-wit/types";

// Speler-tabel niet nodig: historisch script raakt alleen `teams`, `team_aliases`,
// `team_periodes`, `competitie_spelers`, `team_scouting_sessies`, `seizoenen` aan.
// FK-volgorde: leden vóór competitie_spelers (rel_code FK), seizoenen vóór alles.
const TABELLEN_INSERT_VOLGORDE = [
  "seizoenen",
  "leden",
  "teams",
  "team_periodes",
  "team_aliases",
  "competitie_spelers",
  "team_scouting_sessies",
] as const;

const TABELLEN_TRUNCATE_VOLGORDE = [...TABELLEN_INSERT_VOLGORDE].reverse();

const PROD_URL = process.env.PROD_DATABASE_URL;
const DEV_URL = process.env.DEV_DATABASE_URL;

if (!PROD_URL || !DEV_URL) {
  logger.error("PROD_DATABASE_URL en DEV_DATABASE_URL beide vereist");
  process.exit(1);
}

async function kolommenVoor(client: Client, tabel: string): Promise<string[]> {
  const res = await client.query(
    `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
    [tabel]
  );
  return res.rows.map((r: { column_name: string }) => r.column_name);
}

async function rijenAantal(client: Client, tabel: string): Promise<number> {
  const res = await client.query(`SELECT COUNT(*)::int AS n FROM "${tabel}"`);
  return res.rows[0].n;
}

async function sequenceFix(dev: Client, tabel: string): Promise<void> {
  // Reset id-sequence naar MAX(id) zodat toekomstige inserts geen FK-conflict geven.
  const idCheck = await dev.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'`,
    [tabel]
  );
  if (idCheck.rows.length === 0) return;
  await dev.query(
    `SELECT setval(pg_get_serial_sequence('"${tabel}"', 'id'),
      COALESCE((SELECT MAX(id) FROM "${tabel}"), 1), true)`
  );
}

async function kopieerTabel(prod: Client, dev: Client, tabel: string): Promise<number> {
  const prodCols = await kolommenVoor(prod, tabel);
  const devCols = await kolommenVoor(dev, tabel);
  const gedeeld = prodCols.filter((c) => devCols.includes(c));
  const ontbrekendInDev = prodCols.filter((c) => !devCols.includes(c));
  const ontbrekendInProd = devCols.filter((c) => !prodCols.includes(c));

  if (ontbrekendInDev.length > 0) {
    logger.warn(`[${tabel}] kolommen in prod maar niet in dev (genegeerd):`, ontbrekendInDev);
  }
  if (ontbrekendInProd.length > 0) {
    logger.warn(`[${tabel}] kolommen in dev maar niet in prod (NULL):`, ontbrekendInProd);
  }

  const colList = gedeeld.map((c) => `"${c}"`).join(", ");
  const select = await prod.query(`SELECT ${colList} FROM "${tabel}"`);
  const rijen = select.rows;
  if (rijen.length === 0) return 0;

  // Bulk insert in batches van 500 om parameter-limiet te ontwijken.
  const BATCH = 500;
  let totaal = 0;
  for (let i = 0; i < rijen.length; i += BATCH) {
    const slice = rijen.slice(i, i + BATCH);
    const placeholders: string[] = [];
    const values: unknown[] = [];
    let p = 1;
    for (const r of slice) {
      const rowPlaceholders = gedeeld.map(() => `$${p++}`);
      placeholders.push(`(${rowPlaceholders.join(", ")})`);
      for (const c of gedeeld) values.push(r[c]);
    }
    await dev.query(
      `INSERT INTO "${tabel}" (${colList}) VALUES ${placeholders.join(", ")}`,
      values
    );
    totaal += slice.length;
  }
  await sequenceFix(dev, tabel);
  return totaal;
}

async function main() {
  const prod = new Client({ connectionString: PROD_URL });
  const dev = new Client({ connectionString: DEV_URL });
  await prod.connect();
  await dev.connect();

  logger.info("=== Snapshot prod → dev ===");

  // Productie counts (voor verificatie)
  const prodCounts: Record<string, number> = {};
  for (const t of TABELLEN_INSERT_VOLGORDE) {
    prodCounts[t] = await rijenAantal(prod, t);
  }
  logger.info("Productie-rijen:", prodCounts);

  // TRUNCATE dev in omgekeerde FK-volgorde
  logger.info("Truncate dev-tabellen...");
  // Eén TRUNCATE met CASCADE op alle 7 tabellen tegelijk — atomair en veilig.
  await dev.query(
    `TRUNCATE TABLE ${TABELLEN_TRUNCATE_VOLGORDE.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`
  );

  // INSERT in FK-volgorde
  const devCounts: Record<string, number> = {};
  for (const tabel of TABELLEN_INSERT_VOLGORDE) {
    const n = await kopieerTabel(prod, dev, tabel);
    devCounts[tabel] = n;
    logger.info(`[${tabel}] ${n} rijen gekopieerd (prod had ${prodCounts[tabel]})`);
    if (n !== prodCounts[tabel]) {
      logger.warn(`[${tabel}] MISMATCH: dev=${n} vs prod=${prodCounts[tabel]}`);
    }
  }

  await prod.end();
  await dev.end();

  logger.info("=== Snapshot voltooid ===", devCounts);
}

main().catch((err) => {
  logger.error("Snapshot mislukt:", err);
  process.exit(1);
});
