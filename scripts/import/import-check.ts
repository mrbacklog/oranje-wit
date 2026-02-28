/**
 * Controleert of de import actueel is door de nieuwste export-datum
 * te vergelijken met de laatste import in de database.
 *
 * Gebruik:
 *   npx tsx scripts/import-check.ts
 */

import * as fs from "fs";
import * as path from "path";
import { getLastImport } from "../src/lib/import";

const OW_PATH = process.env.ORANJE_WIT_PATH || "C:\\Oranje Wit";

function findNewestExport(): { pad: string; datum: string; seizoen: string } | null {
  const exportDir = path.join(OW_PATH, "data", "export");
  if (!fs.existsSync(exportDir)) return null;

  const bestanden = fs
    .readdirSync(exportDir)
    .filter((f) => f.startsWith("export-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (bestanden.length === 0) return null;

  const pad = path.join(exportDir, bestanden[0]);
  const data = JSON.parse(fs.readFileSync(pad, "utf-8"));

  return {
    pad,
    datum: data.meta?.export_datum || "onbekend",
    seizoen: data.meta?.seizoen_nieuw || "onbekend",
  };
}

async function main() {
  console.log("=== Import Status Check ===\n");

  // Laatste import uit database
  const lastImport = await getLastImport();

  if (lastImport) {
    console.log(`Laatste import: ${lastImport.exportDatum} (snapshot ${lastImport.snapshotDatum})`);
    console.log(`  Seizoen:  ${lastImport.seizoen}`);
    console.log(`  Spelers:  ${lastImport.spelersNieuw + lastImport.spelersBijgewerkt}`);
    console.log(`  Staf:     ${lastImport.stafNieuw + lastImport.stafBijgewerkt}`);
    console.log(`  Teams:    ${lastImport.teamsGeladen}`);
    console.log(`  Gedaan:   ${lastImport.createdAt.toLocaleString("nl-NL")}`);
  } else {
    console.log("Laatste import: geen (database is leeg)");
  }

  // Nieuwste export
  const nieuwsteExport = findNewestExport();
  console.log("");

  if (!nieuwsteExport) {
    console.log("Nieuwste export: niet gevonden");
    console.log(`  Verwacht in: ${path.join(OW_PATH, "data", "export")}`);
    console.log("  Draai /oranje-wit:exporteer om een export te genereren.");
    return;
  }

  console.log(`Nieuwste export: ${nieuwsteExport.datum} (seizoen ${nieuwsteExport.seizoen})`);
  console.log(`  Bestand: ${nieuwsteExport.pad}`);

  // Vergelijk
  console.log("");
  if (!lastImport) {
    console.log("→ Nog geen data geimporteerd. Draai: npm run import");
  } else if (nieuwsteExport.datum > lastImport.exportDatum) {
    console.log(
      `→ Nieuwere export beschikbaar (${nieuwsteExport.datum} > ${lastImport.exportDatum})`
    );
    console.log("  Draai: npm run import");
  } else {
    console.log("→ Data is actueel. Geen import nodig.");
  }
}

main().catch((err) => {
  console.error("Check mislukt:", err);
  process.exit(1);
});
