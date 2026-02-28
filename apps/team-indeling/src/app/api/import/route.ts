import * as fs from "fs";
import { z } from "zod";
import { importData, getLastImport, type ExportData } from "@/lib/import";
import { ok, fail, parseBody } from "@/lib/api";

const ImportSchema = z.object({
  exportPad: z.string().min(1, "exportPad is verplicht"),
});

/**
 * POST /api/import — Trigger data-import vanuit export-JSON.
 * Body: { exportPad: string }
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, ImportSchema);
    if (!parsed.ok) return parsed.response;

    const { exportPad } = parsed.data;

    if (!fs.existsSync(exportPad)) {
      return fail(`Bestand niet gevonden: ${exportPad}`, 404, "NOT_FOUND");
    }

    const data: ExportData = JSON.parse(fs.readFileSync(exportPad, "utf-8"));
    const result = await importData(data);

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`Import mislukt: ${message}`);
  }
}

/**
 * GET /api/import — Laatste import-status opvragen.
 */
export async function GET() {
  try {
    const lastImport = await getLastImport();

    return ok({
      hasData: !!lastImport,
      lastImport: lastImport
        ? {
            id: lastImport.id,
            seizoen: lastImport.seizoen,
            exportDatum: lastImport.exportDatum,
            snapshotDatum: lastImport.snapshotDatum,
            spelers: lastImport.spelersNieuw + lastImport.spelersBijgewerkt,
            staf: lastImport.stafNieuw + lastImport.stafBijgewerkt,
            teams: lastImport.teamsGeladen,
            importedAt: lastImport.createdAt,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`Status ophalen mislukt: ${message}`);
  }
}
