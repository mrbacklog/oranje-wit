/**
 * Herstel script 01: Seizoenen seed
 * Vult de seizoenen tabel met 16 seizoenen (2010-2011 t/m 2025-2026)
 *
 * Gebruik: node scripts/herstel/01-seizoenen.js
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../apps/web/.env"),
});

const { Client } = require("pg");

// Bouw seizoen-records op voor 2010-2011 t/m 2025-2026
function buildSeizoen(startJaar) {
  const eindJaar = startJaar + 1;
  const seizoen = `${startJaar}-${eindJaar}`;
  const startDatum = `${startJaar}-08-01`;
  const eindDatum = `${eindJaar}-06-30`;
  const peildatum = `${startJaar}-12-31`;

  // Huidig seizoen = 2025-2026 => ACTIEF, rest => AFGEROND
  const status = startJaar === 2025 ? "ACTIEF" : "AFGEROND";

  return { seizoen, startJaar, eindJaar, startDatum, eindDatum, peildatum, status };
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL niet gevonden in apps/web/.env");
    process.exit(1);
  }

  console.log("Verbinding maken met productie database...");
  await client.connect();
  console.log("Verbonden.\n");

  // Bouw lijst van 16 seizoenen
  const seizoenen = [];
  for (let jaar = 2010; jaar <= 2025; jaar++) {
    seizoenen.push(buildSeizoen(jaar));
  }

  console.log(`Inserteren van ${seizoenen.length} seizoenen...`);

  let aangemaakt = 0;
  let overgeslagen = 0;

  for (const s of seizoenen) {
    const result = await client.query(
      `INSERT INTO seizoenen (seizoen, start_jaar, eind_jaar, start_datum, eind_datum, peildatum, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7::\"SeizoenStatus\")
       ON CONFLICT (seizoen) DO NOTHING
       RETURNING seizoen`,
      [s.seizoen, s.startJaar, s.eindJaar, s.startDatum, s.eindDatum, s.peildatum, s.status]
    );

    if (result.rowCount > 0) {
      aangemaakt++;
      console.log(`  ✓ ${s.seizoen} (${s.status})`);
    } else {
      overgeslagen++;
      console.log(`  ~ ${s.seizoen} — overgeslagen (al aanwezig)`);
    }
  }

  // Verificatie: tel totaal in DB
  const countResult = await client.query("SELECT COUNT(*) FROM seizoenen");
  const totaal = parseInt(countResult.rows[0].count, 10);

  console.log("\n--- Resultaat ---");
  console.log(`Aangemaakt:   ${aangemaakt}`);
  console.log(`Overgeslagen: ${overgeslagen}`);
  console.log(`Totaal in DB: ${totaal}`);

  if (totaal >= 16) {
    console.log("\nStatus: DONE — seizoenen tabel correct gevuld.");
  } else {
    console.log(
      `\nStatus: DONE_WITH_CONCERNS — slechts ${totaal} seizoenen in DB, verwacht >= 16.`
    );
  }

  await client.end();
}

main().catch((err) => {
  console.error("FOUT:", err.message);
  process.exit(1);
});
