import { requireTC } from "@/lib/teamindeling/auth-check";
import { ok, fail } from "@/lib/teamindeling/api";
import { parseCsvContent } from "@/lib/teamindeling/leden-csv";
import { berekenLedenDiff } from "@/lib/teamindeling/leden-diff";
import { logger } from "@oranje-wit/types";

export async function POST(request: Request) {
  try {
    await requireTC();

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
