#!/usr/bin/env node
require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const checks = [
    { label: "seizoenen", query: "SELECT COUNT(*) FROM seizoenen", min: 16 },
    { label: "leden", query: "SELECT COUNT(*) FROM leden", min: 1000 },
    { label: "competitie_spelers", query: "SELECT COUNT(*) FROM competitie_spelers", min: 500 },
    { label: "speler_seizoenen 2025-2026 (VIEW)", query: "SELECT COUNT(*) FROM speler_seizoenen WHERE seizoen = '2025-2026'", min: 200 },
    { label: "ledenverloop", query: "SELECT COUNT(*) FROM ledenverloop", min: 500 },
    { label: "cohort_seizoenen", query: "SELECT COUNT(*) FROM cohort_seizoenen", min: 200 },
    { label: "signalering", query: "SELECT COUNT(*) FROM signalering", min: 5 },
    { label: "Speler (TI Studio)", query: 'SELECT COUNT(*) FROM "Speler"', min: 250 },
    { label: "werkindelingen", query: "SELECT COUNT(*) FROM werkindelingen", min: 1 },
  ];

  console.log("=== Database Herstel Eindverificatie ===\n");
  let allesOk = true;

  for (const check of checks) {
    try {
      const { rows } = await client.query(check.query);
      const count = parseInt(rows[0].count);
      const ok = count >= check.min;
      console.log(`${ok ? "✅" : "⚠️ "} ${check.label}: ${count} records (min: ${check.min})`);
      if (!ok) allesOk = false;
    } catch (e) {
      console.log(`❌ ${check.label}: FOUT — ${e.message}`);
      allesOk = false;
    }
  }

  // Spelers per seizoen
  const { rows: dekking } = await client.query(
    `SELECT seizoen, COUNT(DISTINCT rel_code)::int as spelers
     FROM competitie_spelers
     GROUP BY seizoen ORDER BY seizoen`
  );
  console.log("\n=== Dekking per seizoen ===");
  dekking.forEach(r => console.log(`  ${r.seizoen}: ${r.spelers} spelers`));

  // Signalering overzicht
  const { rows: sigs } = await client.query(
    `SELECT ernst, COUNT(*) as n FROM signalering GROUP BY ernst ORDER BY ernst`
  );
  console.log("\n=== Signalering ===");
  sigs.forEach(r => console.log(`  ${r.ernst}: ${r.n} alerts`));

  console.log(`\n${ allesOk ? "✅ HERSTEL GESLAAGD" : "⚠️  HERSTEL DEELS — zie waarschuwingen" }`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
