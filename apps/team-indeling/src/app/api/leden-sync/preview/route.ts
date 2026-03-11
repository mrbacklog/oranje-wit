import { requireEditor } from "@/lib/auth-check";
import { ok, fail } from "@/lib/api";
import { parseCsvContent } from "@/lib/leden-csv";
import { berekenLedenDiff } from "@/lib/leden-diff";
import { logger } from "@oranje-wit/types";

export async function POST(request: Request) {
  try {
    await requireEditor();

    const formData = await request.formData();
    const file = formData.get("csv");
    if (!file || !(file instanceof File)) {
      return fail("Geen CSV-bestand meegegeven", 400, "MISSING_FILE");
    }

    const csvContent = await file.text();
    const rijen = parseCsvContent(csvContent);
    const diff = await berekenLedenDiff(rijen);

    logger.info(
      `[leden-sync] Preview: ${diff.csvBondsleden} bondsleden, ${diff.nieuweLeden.length} nieuw, ${diff.vertrokkenSpelers.length} vertrokken, ${diff.gewijzigdeLeden.length} gewijzigd`
    );

    return ok(diff);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[leden-sync] Preview fout:", msg);
    return fail(msg);
  }
}
