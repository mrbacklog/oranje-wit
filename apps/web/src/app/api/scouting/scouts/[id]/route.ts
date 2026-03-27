import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";
import { requireTC } from "@/lib/scouting/auth/helpers";

// Prisma 7 type recursion workaround
const db = prisma as any;

type RouteParams = { params: Promise<{ id: string }> };

// ── PATCH /api/scouts/[id] ─────────────────────────────────────
// Wijzig scout-instellingen (vrijScouten toggle). Alleen TC.

const UpdateScoutSchema = z.object({
  vrijScouten: z.boolean(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    // Controleer dat scout bestaat
    const bestaand = await db.scout.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!bestaand) {
      return fail("Scout niet gevonden", 404, "NOT_FOUND");
    }

    // Valideer body
    const parsed = await parseBody(request, UpdateScoutSchema);
    if (!parsed.ok) return parsed.response;

    const scout = await db.scout.update({
      where: { id },
      data: { vrijScouten: parsed.data.vrijScouten },
      select: {
        id: true,
        naam: true,
        vrijScouten: true,
      },
    });

    logger.info(`Scout ${id} vrijScouten gewijzigd naar ${parsed.data.vrijScouten}`);

    return ok(scout);
  } catch (error) {
    logger.error("Fout bij bijwerken scout:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
