import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireScout } from "@/lib/auth/helpers";

// Prisma 7 type recursion workaround
const db = prisma as any;

const StatusSchema = z.object({
  status: z.enum(["GEACCEPTEERD", "AFGEWEZEN", "GESTOPT"]),
});

/**
 * Geldige status-overgangen per huidige status.
 * UITGENODIGD → GEACCEPTEERD of AFGEWEZEN
 * GEACCEPTEERD → GESTOPT
 */
const GELDIGE_OVERGANGEN: Record<string, string[]> = {
  UITGENODIGD: ["GEACCEPTEERD", "AFGEWEZEN"],
  GEACCEPTEERD: ["GESTOPT"],
};

/**
 * PATCH /api/toewijzingen/[id]
 *
 * Wijzig de status van een toewijzing (door de toegewezen scout zelf).
 * Bij AFGEWEZEN/GESTOPT wordt gecontroleerd of alle toewijzingen
 * van het verzoek nu afgerond of afgewezen zijn → verzoek AFGEROND.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authenticatie: ingelogde scout
    const authResult = await requireScout();
    if (!authResult.ok) return authResult.response;
    const scout = authResult.scout;

    // 2. Valideer body
    const parsed = await parseBody(request, StatusSchema);
    if (!parsed.ok) return parsed.response;

    const { id: toewijzingId } = await params;
    const { status: nieuweStatus } = parsed.data;

    // 3. Zoek de toewijzing
    const toewijzing = await db.scoutToewijzing.findUnique({
      where: { id: toewijzingId },
      include: {
        verzoek: {
          select: { id: true, status: true },
        },
      },
    });

    if (!toewijzing) {
      return fail("Toewijzing niet gevonden", 404, "NOT_FOUND");
    }

    // 4. Check eigenaarschap: alleen de toegewezen scout mag de status wijzigen
    if (toewijzing.scoutId !== scout.id) {
      return fail("Je kunt alleen je eigen toewijzingen wijzigen", 403, "FORBIDDEN");
    }

    // 5. Valideer status-overgang
    const toegestaan = GELDIGE_OVERGANGEN[toewijzing.status] ?? [];
    if (!toegestaan.includes(nieuweStatus)) {
      return fail(
        `Status kan niet van ${toewijzing.status} naar ${nieuweStatus}`,
        400,
        "INVALID_TRANSITION"
      );
    }

    // 6. Update de toewijzing-status
    await db.scoutToewijzing.update({
      where: { id: toewijzingId },
      data: { status: nieuweStatus },
    });

    logger.info(
      `Toewijzing ${toewijzingId}: ${toewijzing.status} → ${nieuweStatus} (scout: ${scout.id})`
    );

    // 7. Bij AFGEWEZEN of GESTOPT: check of het verzoek AFGEROND moet worden
    let verzoekAfgerond = false;
    if (nieuweStatus === "AFGEWEZEN" || nieuweStatus === "GESTOPT") {
      verzoekAfgerond = await checkVerzoekAfronding(toewijzing.verzoek.id);
    }

    return ok({
      toewijzingId,
      status: nieuweStatus,
      verzoekAfgerond,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Niet ingelogd") {
      return fail(error.message, 401, "UNAUTHORIZED");
    }
    if (error instanceof Error && error.message.includes("scout-profiel")) {
      return fail(error.message, 403, "FORBIDDEN");
    }
    logger.error("Fout bij wijzigen toewijzing-status:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Check of alle toewijzingen van een verzoek afgerond of afgewezen zijn.
 * Zo ja, update het verzoek naar AFGEROND.
 *
 * Een verzoek is afgerond als er geen toewijzingen meer zijn met status
 * UITGENODIGD of GEACCEPTEERD (d.w.z. iedereen is klaar, afgewezen of gestopt).
 */
async function checkVerzoekAfronding(verzoekId: string): Promise<boolean> {
  const openToewijzingen = await db.scoutToewijzing.count({
    where: {
      verzoekId,
      status: { in: ["UITGENODIGD", "GEACCEPTEERD"] },
    },
  });

  if (openToewijzingen === 0) {
    await db.scoutingVerzoek.update({
      where: { id: verzoekId },
      data: { status: "AFGEROND" },
    });
    logger.info(`Verzoek ${verzoekId} automatisch AFGEROND (alle toewijzingen klaar)`);
    return true;
  }

  return false;
}
