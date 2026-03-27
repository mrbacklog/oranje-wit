import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";
import { requireTC } from "@/lib/scouting/auth/helpers";

// Prisma 7 type recursion workaround
const db = prisma as any;

const ToewijzingSchema = z.object({
  scoutIds: z.array(z.string().min(1)).min(1, "Minimaal 1 scout vereist"),
});

/**
 * POST /api/verzoeken/[id]/toewijzingen
 *
 * Wijs scouts toe aan een scouting-verzoek (TC-only).
 * Maakt ScoutToewijzing records aan met status UITGENODIGD.
 * Bij de eerste toewijzing wordt het verzoek ACTIEF.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Alleen TC-leden mogen scouts toewijzen
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    // 2. Valideer body
    const parsed = await parseBody(request, ToewijzingSchema);
    if (!parsed.ok) return parsed.response;

    const { id: verzoekId } = await params;
    const { scoutIds } = parsed.data;

    // 3. Check of het verzoek bestaat en niet afgerond/geannuleerd is
    const verzoek = await db.scoutingVerzoek.findUnique({
      where: { id: verzoekId },
      include: { toewijzingen: { select: { scoutId: true } } },
    });

    if (!verzoek) {
      return fail("Verzoek niet gevonden", 404, "NOT_FOUND");
    }

    if (verzoek.status === "AFGEROND" || verzoek.status === "GEANNULEERD") {
      return fail(`Verzoek is al ${verzoek.status.toLowerCase()}`, 400, "INVALID_STATUS");
    }

    // 4. Check of alle scouts bestaan
    const scouts = await db.scout.findMany({
      where: { id: { in: scoutIds } },
      select: { id: true, naam: true },
    });

    const gevondenIds = new Set(scouts.map((s: { id: string }) => s.id));
    const onbekend = scoutIds.filter((id) => !gevondenIds.has(id));
    if (onbekend.length > 0) {
      return fail(`Scouts niet gevonden: ${onbekend.join(", ")}`, 404, "SCOUT_NOT_FOUND");
    }

    // 5. Filter scouts die al zijn toegewezen (unique constraint: verzoekId + scoutId)
    const alToegewezen = new Set(verzoek.toewijzingen.map((t: { scoutId: string }) => t.scoutId));
    const nieuweScoutIds = scoutIds.filter((id) => !alToegewezen.has(id));

    if (nieuweScoutIds.length === 0) {
      return ok({
        aangemaakt: 0,
        overgeslagen: scoutIds.length,
        bericht: "Alle scouts waren al toegewezen aan dit verzoek",
      });
    }

    // 6. Maak toewijzingen aan
    const toewijzingen = await db.scoutToewijzing.createMany({
      data: nieuweScoutIds.map((scoutId: string) => ({
        verzoekId,
        scoutId,
        status: "UITGENODIGD",
      })),
    });

    // 7. Update verzoek status naar ACTIEF als dit de eerste toewijzing(en) is/zijn
    const isEersteToewijzing = alToegewezen.size === 0;
    if (isEersteToewijzing && verzoek.status === "OPEN") {
      await db.scoutingVerzoek.update({
        where: { id: verzoekId },
        data: { status: "ACTIEF" },
      });
      logger.info(`Verzoek ${verzoekId} is nu ACTIEF na eerste toewijzing`);
    }

    const overgeslagen = scoutIds.length - nieuweScoutIds.length;

    logger.info(
      `${toewijzingen.count} scouts toegewezen aan verzoek ${verzoekId}` +
        (overgeslagen > 0 ? ` (${overgeslagen} overgeslagen, al toegewezen)` : "")
    );

    return ok({
      aangemaakt: toewijzingen.count,
      overgeslagen,
      verzoekStatus: isEersteToewijzing ? "ACTIEF" : verzoek.status,
    });
  } catch (error) {
    logger.error("Fout bij toewijzen scouts:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
