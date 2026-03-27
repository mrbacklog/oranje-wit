import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireTC } from "@/lib/auth/requireTC";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── PATCH /api/admin/raamwerk/[id] ───────────────────────────
// Status updaten: CONCEPT -> ACTIEF, ACTIEF -> GEARCHIVEERD

const UpdateStatusSchema = z.object({
  status: z.enum(["ACTIEF", "GEARCHIVEERD"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const { id } = await params;

    const parsed = await parseBody(request, UpdateStatusSchema);
    if (!parsed.ok) return parsed.response;

    const { status: nieuweStatus } = parsed.data;

    // Haal huidige versie op
    const versie = await db.raamwerkVersie.findUnique({
      where: { id },
    });

    if (!versie) {
      return fail(`Raamwerkversie met id '${id}' niet gevonden`, 404, "NOT_FOUND");
    }

    // Valideer status-overgang
    if (nieuweStatus === "ACTIEF") {
      if (versie.status !== "CONCEPT") {
        return fail(
          `Kan alleen een CONCEPT versie activeren (huidige status: ${versie.status})`,
          400,
          "INVALID_TRANSITION"
        );
      }

      // Deactiveer de huidige actieve versie
      await db.raamwerkVersie.updateMany({
        where: { status: "ACTIEF" },
        data: { status: "GEARCHIVEERD" },
      });

      // Activeer deze versie
      const updated = await db.raamwerkVersie.update({
        where: { id },
        data: {
          status: "ACTIEF",
          gepubliceerdOp: new Date(),
        },
      });

      logger.info(`Raamwerk ${id} geactiveerd: ${updated.naam}`);

      return ok({
        id: updated.id,
        seizoen: updated.seizoen,
        naam: updated.naam,
        status: updated.status,
        gepubliceerdOp: updated.gepubliceerdOp?.toISOString() ?? null,
      });
    }

    if (nieuweStatus === "GEARCHIVEERD") {
      if (versie.status !== "ACTIEF") {
        return fail(
          `Kan alleen een ACTIEF versie archiveren (huidige status: ${versie.status})`,
          400,
          "INVALID_TRANSITION"
        );
      }

      const updated = await db.raamwerkVersie.update({
        where: { id },
        data: { status: "GEARCHIVEERD" },
      });

      logger.info(`Raamwerk ${id} gearchiveerd: ${updated.naam}`);

      return ok({
        id: updated.id,
        seizoen: updated.seizoen,
        naam: updated.naam,
        status: updated.status,
      });
    }

    return fail("Ongeldige status", 400, "INVALID_STATUS");
  } catch (error) {
    logger.error("Fout bij updaten raamwerk status:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
