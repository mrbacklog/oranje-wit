/**
 * Import Sportlink zaal-teamindeling CSV naar competitie_spelers.
 *
 * Bron: docs/Teams 317 personen gevonden (1).csv
 * Formaat: semicolon-separated, kolommen: Team;Teamsoort;Teamrol;Naam;Lidsoort;Rel. code;Geb.dat.;E-mailadres
 *
 * Gebruik:
 *   DATABASE_URL="..." npx tsx scripts/import/import-sportlink-zaal.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

const SEIZOEN = "2025-2026";
const COMPETITIE = "zaal";
const BRON = "sportlink";
const CSV_PATH = join(__dirname, "../../docs/Teams 317 personen gevonden (1).csv");

function parseCsvLine(line: string): string[] {
  const vals: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (line[i] === ";" && !inQuote) {
      vals.push(current.trim());
      current = "";
      continue;
    }
    current += line[i];
  }
  vals.push(current.trim());
  return vals;
}

async function main() {
  const raw = readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);
  console.log("Kolommen:", header);

  const teamIdx = header.indexOf("Team");
  const rolIdx = header.indexOf("Teamrol");
  const relIdx = header.indexOf("Rel. code");
  const gebIdx = header.indexOf("Geb.dat.");

  if (teamIdx < 0 || rolIdx < 0 || relIdx < 0) {
    throw new Error("Verwachte kolommen niet gevonden");
  }

  // Filter alleen teamspelers (geen staf)
  const spelers: { team: string; relCode: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols[rolIdx] !== "Teamspeler") continue;

    const team = cols[teamIdx];
    const relCode = cols[relIdx];
    if (!team || !relCode) continue;

    spelers.push({ team, relCode });
  }

  console.log(`${spelers.length} teamspelers gevonden in CSV`);

  // Verbind met database
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Verifieer dat rel_codes bestaan in leden tabel
  const relCodes = [...new Set(spelers.map((s) => s.relCode))];
  const bestaand = await client.query(
    "SELECT rel_code FROM leden WHERE rel_code = ANY($1)",
    [relCodes]
  );
  const bestaandeSet = new Set(bestaand.rows.map((r: any) => r.rel_code));
  const nietGevonden = relCodes.filter((rc) => !bestaandeSet.has(rc));
  if (nietGevonden.length > 0) {
    console.warn(`⚠ ${nietGevonden.length} rel_codes niet in leden:`, nietGevonden);
  }

  // Haal geslacht op uit leden
  const geslachtResult = await client.query(
    "SELECT rel_code, geslacht FROM leden WHERE rel_code = ANY($1)",
    [relCodes]
  );
  const geslachtMap = new Map<string, string>();
  for (const r of geslachtResult.rows) {
    geslachtMap.set(r.rel_code, r.geslacht);
  }

  // Insert in competitie_spelers
  let inserted = 0;
  let skipped = 0;

  for (const { team, relCode } of spelers) {
    if (!bestaandeSet.has(relCode)) {
      skipped++;
      continue;
    }

    const geslacht = geslachtMap.get(relCode) || null;

    await client.query(
      `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE SET
         team = EXCLUDED.team,
         geslacht = EXCLUDED.geslacht,
         bron = EXCLUDED.bron`,
      [relCode, SEIZOEN, COMPETITIE, team, geslacht, BRON]
    );
    inserted++;
  }

  console.log(`✓ ${inserted} spelers geïmporteerd in competitie_spelers (competitie='${COMPETITIE}')`);
  if (skipped > 0) console.log(`  ${skipped} overgeslagen (rel_code niet in leden)`);

  // Toon verdeling per team
  const check = await client.query(
    "SELECT team, COUNT(*)::int as cnt FROM competitie_spelers WHERE seizoen = $1 AND competitie = $2 GROUP BY team ORDER BY team",
    [SEIZOEN, COMPETITIE]
  );
  console.log("\nTeamverdeling:");
  for (const r of check.rows) {
    console.log(`  ${r.team}: ${r.cnt} spelers`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
