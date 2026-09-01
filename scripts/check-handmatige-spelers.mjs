/**
 * Inspecteert de handmatig aangemaakte spelers die inmiddels een echte rel_code hebben.
 *
 * Gebruik: node scripts/check-handmatige-spelers.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const PAREN = [
  {
    handmatig: "HANDMATIG-cb5a6e89bd374005bb90434521b470b5",
    echt: "NJZ05M8",
    naam: "Tycho de Koning",
  },
  {
    handmatig: "HANDMATIG-990923e8070f438faf4b144dd6bb5f76",
    echt: "NJY07J2",
    naam: "Sander de Geus",
  },
  {
    handmatig: "HANDMATIG-b27b78340f964cdd909fc4bae5c790a2",
    echt: "NKL26W4",
    naam: "Louise Stoop",
  },
  {
    handmatig: "HANDMATIG-96fda18ddeaf4213aa45e02af62c8225",
    echt: "NKR88F7",
    naam: "Bridget ter Horst",
  },
];

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows: fks } = await client.query(`
  SELECT tc.table_name, kcu.column_name, rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'Speler'
`);
out(`Foreign keys naar "Speler": ${fks.length}`);
out(`  ON UPDATE regels: ${[...new Set(fks.map((f) => f.update_rule))].join(", ")}`);

for (const p of PAREN) {
  out(`\n### ${p.naam}`);
  for (const [label, id] of [
    ["handmatig", p.handmatig],
    ["echt     ", p.echt],
  ]) {
    const { rows: sp } = await client.query(
      `SELECT id, roepnaam, achternaam, geboortejaar, status::text FROM "Speler" WHERE id = $1`,
      [id]
    );
    const { rows: ld } = await client.query(`SELECT rel_code FROM leden WHERE rel_code = $1`, [id]);
    out(
      `  ${label}: Speler=${sp.length ? `${sp[0].roepnaam} ${sp[0].achternaam} (${sp[0].geboortejaar}, ${sp[0].status})` : "GEEN"}  leden=${ld.length ? "ja" : "nee"}`
    );
    let totaal = 0;
    for (const fk of fks) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS n FROM "${fk.table_name}" WHERE "${fk.column_name}" = $1`,
        [id]
      );
      if (rows[0].n > 0) {
        out(`      ${fk.table_name}.${fk.column_name}: ${rows[0].n}`);
        totaal += rows[0].n;
      }
    }
    if (totaal === 0) out("      geen verwijzingen");
  }
}

await client.end();
