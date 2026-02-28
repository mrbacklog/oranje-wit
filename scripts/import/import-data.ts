/**
 * CLI wrapper voor data-import.
 *
 * Gebruik:
 *   npx tsx scripts/import-data.ts [pad-naar-export-json]
 *
 * Zonder argument: zoekt meest recente export in C:\Oranje Wit\data\export\
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { importData, type ExportData } from "../../apps/team-indeling/src/lib/import";

const ROOT = path.resolve(__dirname, "../..");
const EXPORT_DIR = path.join(ROOT, "data", "export");

function findExportFile(explicitPath?: string): string {
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  if (!fs.existsSync(EXPORT_DIR)) {
    throw new Error(
      `Export-map niet gevonden: ${EXPORT_DIR}\nDraai eerst de export-voor-teamindeling.js pipeline.`
    );
  }

  const bestanden = fs
    .readdirSync(EXPORT_DIR)
    .filter((f) => f.startsWith("export-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (bestanden.length === 0) {
    throw new Error(
      `Geen export-bestanden gevonden in ${EXPORT_DIR}\nDraai eerst de export pipeline.`
    );
  }

  return path.join(EXPORT_DIR, bestanden[0]);
}

async function main() {
  console.log("=== Team-Indeling Data Import ===\n");

  const exportPad = findExportFile(process.argv[2]);
  console.log(`Export: ${exportPad}`);

  const data: ExportData = JSON.parse(fs.readFileSync(exportPad, "utf-8"));
  const meta = data.meta;

  console.log(`  Bron:    ${meta.bron}`);
  console.log(`  Huidig:  ${meta.seizoen_huidig}`);
  console.log(`  Nieuw:   ${meta.seizoen_nieuw}`);
  console.log(`  Export:  ${meta.export_datum}`);
  console.log(`  Spelers: ${meta.totaal_actieve_spelers}`);
  console.log(`  Staf:    ${meta.totaal_staf}\n`);

  const result = await importData(data);

  console.log("\n=== Import voltooid ===\n");
  console.log(
    `Spelers:      ${result.spelers.nieuw} nieuw, ${result.spelers.bijgewerkt} bijgewerkt, ${result.spelers.fouten} fouten`
  );
  console.log(
    `Staf:         ${result.staf.nieuw} nieuw, ${result.staf.bijgewerkt} bijgewerkt, ${result.staf.fouten} fouten`
  );
  console.log(`Teams:        ${result.teams.geladen} referentieteams geladen`);
  console.log(`Blauwdruk:    ${result.blauwdruk.status}`);
  console.log(`Import ID:    ${result.importId}`);
}

main().catch((err) => {
  console.error("Import mislukt:", err);
  process.exit(1);
});
