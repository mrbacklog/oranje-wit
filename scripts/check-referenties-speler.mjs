/**
 * Zoekt alle verwijzingen naar een rel_code / Speler-id door de hele database.
 * Gebruikt de foreign keys uit information_schema, dus ook tabellen die we niet kennen.
 *
 * Gebruik: node scripts/check-referenties-speler.mjs <rel_code> [<rel_code> ...]
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const CODES = process.argv.slice(2);
if (CODES.length === 0) {
  process.stderr.write("Geef minstens één rel_code mee.\n");
  process.exit(1);
}

const out = (s) => process.stdout.write(s + "\n");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

// Alle kolommen die naar leden.rel_code of "Speler".id wijzen
const { rows: fks } = await client.query(`
  SELECT tc.table_name, kcu.column_name, ccu.table_name AS doel_tabel
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND ccu.table_name IN ('leden', 'Speler')
   ORDER BY tc.table_name
`);

out(`Foreign keys naar leden/Speler: ${fks.length}`);

for (const code of CODES) {
  out(`\n### ${code}`);
  let totaal = 0;
  for (const fk of fks) {
    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS n FROM "${fk.table_name}" WHERE "${fk.column_name}" = $1`,
      [code]
    );
    if (rows[0].n > 0) {
      out(`  ${fk.table_name}.${fk.column_name} → ${fk.doel_tabel}: ${rows[0].n}`);
      totaal += rows[0].n;
    }
  }
  if (totaal === 0) out("  geen verwijzingen");

  const { rows: ts } = await client.query(
    `SELECT t.naam, t.categorie::text AS categorie, v.naam AS versie
       FROM "TeamSpeler" ts
       JOIN "Team" t ON t.id = ts."teamId"
       JOIN "Versie" v ON v.id = t."versieId"
      WHERE ts."spelerId" = $1`,
    [code]
  );
  for (const r of ts) out(`  → team: ${r.naam} (${r.categorie}) in versie "${r.versie}"`);
}

await client.end();
