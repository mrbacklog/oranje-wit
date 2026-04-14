/**
 * Eenmalige backfill: kopieer Lid.geboortedatum → Speler.geboortedatum.
 *
 * Context: de leden-sync schrijft geboortedatum alleen naar de Lid-tabel.
 * Speler-records (die per rel_code aan Lid gelinkt zijn) missen hun
 * geboortedatum, waardoor de werkbord-leeftijd altijd als heel getal toont
 * ("23.00" ipv "23.83"). Dit script vult het gat in één keer.
 *
 * Run:  npx tsx -r ./scripts/env-local.js scripts/herstel/05-speler-geboortedatum-backfill.ts
 *
 * Idempotent: update alleen rijen waar Speler.geboortedatum NULL is en
 * Lid.geboortedatum een waarde heeft.
 */

import "dotenv/config";
import { PrismaClient } from "../../packages/database/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Speler.geboortedatum backfill ===\n");

  const voor = (await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*)::int AS totaal,
      COUNT(geboortedatum)::int AS met_datum,
      (COUNT(*) - COUNT(geboortedatum))::int AS zonder_datum
    FROM "Speler"
  `)) as Array<{ totaal: number; met_datum: number; zonder_datum: number }>;
  console.log("Voor backfill:", voor[0]);

  const updates = (await prisma.$queryRawUnsafe(`
    UPDATE "Speler" AS s
    SET geboortedatum = l.geboortedatum
    FROM leden AS l
    WHERE s.id = l.rel_code
      AND s.geboortedatum IS NULL
      AND l.geboortedatum IS NOT NULL
    RETURNING s.id
  `)) as Array<{ id: string }>;
  console.log(`\n${updates.length} spelers geüpdatet met geboortedatum uit Lid-tabel.`);

  const na = (await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*)::int AS totaal,
      COUNT(geboortedatum)::int AS met_datum,
      (COUNT(*) - COUNT(geboortedatum))::int AS zonder_datum
    FROM "Speler"
  `)) as Array<{ totaal: number; met_datum: number; zonder_datum: number }>;
  console.log("Na backfill:", na[0]);

  const nogLeeg = na[0].zonder_datum;
  if (nogLeeg > 0) {
    console.log(`\nLet op: ${nogLeeg} spelers hebben nog steeds geen geboortedatum.`);
    console.log("Dit zijn waarschijnlijk Speler-records zonder bijbehorende Lid-record");
    console.log("(bv. HANDMATIG-* IDs of oude data). Deze houden integer leeftijden.");
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
