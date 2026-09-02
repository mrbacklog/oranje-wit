/**
 * Hoeveel stafleden zijn gekoppeld aan een rel_code? Zonder die koppeling kan de
 * staf uit Sportlink niet betrouwbaar tegen de indeling worden gelegd.
 *
 * Gebruik: node scripts/check-staf-koppeling.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows: telling } = await client.query(
  `SELECT COUNT(*)::int AS totaal,
          COUNT(rel_code)::int AS met_relcode,
          COUNT(*) FILTER (WHERE rel_code IS NULL)::int AS zonder_relcode,
          COUNT(*) FILTER (WHERE actief)::int AS actief
     FROM "Staf"`
);
out(
  `Staf: ${telling[0].totaal} totaal, ${telling[0].actief} actief, ` +
    `${telling[0].met_relcode} met rel_code, ${telling[0].zonder_relcode} zonder`
);

const { rows: zonder } = await client.query(
  `SELECT id, naam FROM "Staf" WHERE rel_code IS NULL AND actief ORDER BY naam`
);
out(`\n### Actieve staf zonder rel_code (${zonder.length})`);
for (const r of zonder) out(`  ${r.id.padEnd(12)} ${r.naam}`);

await client.end();
