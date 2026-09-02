/**
 * Zet de seizoensstatus door bij de overgang naar een nieuw seizoen:
 * het aflopende seizoen wordt AFGEROND, het nieuwe seizoen ACTIEF, en het
 * daaropvolgende seizoen VOORBEREIDING (daar wordt de volgende indeling gemaakt).
 *
 * Draait standaard als DRY-RUN. Toepassen:
 *   node scripts/seizoen-statusflip.mjs --apply
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const VORIG = "2025-2026";
const NIEUW = "2026-2027";
const VOLGEND = "2027-2028";

const APPLY = process.argv.includes("--apply");
const out = (s) => process.stdout.write(s + "\n");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const doelen = [
  { seizoen: VORIG, status: "AFGEROND" },
  { seizoen: NIEUW, status: "ACTIEF" },
  { seizoen: VOLGEND, status: "VOORBEREIDING" },
];

const { rows: huidig } = await client.query(
  `SELECT seizoen, status::text FROM seizoenen WHERE seizoen = ANY($1) ORDER BY seizoen`,
  [doelen.map((d) => d.seizoen)]
);
const statusVan = new Map(huidig.map((r) => [r.seizoen, r.status]));

out(APPLY ? "=== TOEPASSEN ===" : "=== DRY-RUN ===");
for (const d of doelen) {
  const nu = statusVan.get(d.seizoen);
  out(
    `  ${d.seizoen}: ${nu ?? "ONBEKEND"} → ${d.status}${nu === d.status ? "  (ongewijzigd)" : ""}`
  );
}

// Controle: het nieuwe seizoen moet spelers hebben voordat het ACTIEF wordt.
const { rows: spelers } = await client.query(
  `SELECT COUNT(*)::int AS n FROM competitie_spelers WHERE seizoen = $1`,
  [NIEUW]
);
out(`\n  competitie_spelers voor ${NIEUW}: ${spelers[0].n}`);
if (spelers[0].n === 0) {
  out("  GESTOPT: geen spelers — vul eerst competitie_spelers.");
  await client.end();
  process.exit(1);
}

if (!APPLY) {
  out("\nDry-run. Draai met --apply.");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
try {
  for (const d of doelen) {
    await client.query(`UPDATE seizoenen SET status = $2::"SeizoenStatus" WHERE seizoen = $1`, [
      d.seizoen,
      d.status,
    ]);
  }
  await client.query("COMMIT");
  out("\nCOMMIT — seizoensstatus bijgewerkt.");
} catch (e) {
  await client.query("ROLLBACK");
  out(`\nFOUT — teruggedraaid: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
