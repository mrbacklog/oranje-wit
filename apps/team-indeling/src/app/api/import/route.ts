import { NextResponse } from "next/server";
import * as fs from "fs";
import { importData, getLastImport, type ExportData } from "@/lib/import";

/**
 * POST /api/import — Trigger data-import vanuit export-JSON.
 * Body: { exportPad: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const exportPad = body.exportPad;

    if (!exportPad) {
      return NextResponse.json({ error: "exportPad is verplicht" }, { status: 400 });
    }

    if (!fs.existsSync(exportPad)) {
      return NextResponse.json({ error: `Bestand niet gevonden: ${exportPad}` }, { status: 404 });
    }

    const data: ExportData = JSON.parse(fs.readFileSync(exportPad, "utf-8"));
    const result = await importData(data);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Import mislukt: ${message}` }, { status: 500 });
  }
}

/**
 * GET /api/import — Laatste import-status opvragen.
 */
export async function GET() {
  try {
    const lastImport = await getLastImport();

    return NextResponse.json({
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
    return NextResponse.json({ error: `Status ophalen mislukt: ${message}` }, { status: 500 });
  }
}
