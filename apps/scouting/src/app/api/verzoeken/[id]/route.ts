import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireTC, requireScout } from "@/lib/auth/requireTC";

// Prisma 7 type recursion workaround
const db = prisma as any;

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/verzoeken/[id] ─────────────────────────────────────
// Detail van 1 verzoek met toewijzingen en rapporten.
// Als verzoek.anoniem === true en requester niet TC: anonimiseer scoutnamen.

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Auth: elke scout mag detail zien (maar anonimisatie voor niet-TC)
    const authResult = await requireScout();
    if (!authResult.ok) return authResult.response;

    const isTC = authResult.scout.rol === "TC";

    const verzoek = await db.scoutingVerzoek.findUnique({
      where: { id },
      include: {
        maker: { select: { naam: true, email: true } },
        toewijzingen: {
          include: {
            scout: { select: { id: true, naam: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        rapporten: {
          include: {
            scout: { select: { id: true, naam: true } },
            speler: { select: { id: true } },
          },
          orderBy: { datum: "desc" },
        },
      },
    });

    if (!verzoek) {
      return fail("Verzoek niet gevonden", 404, "NOT_FOUND");
    }

    // Anonimisatie: als verzoek anoniem is en requester niet TC,
    // vervang scoutnamen door "Scout 1", "Scout 2", etc.
    const shouldAnonymize = verzoek.anoniem && !isTC;

    // Bouw anoniem-mapping: scout.id → "Scout N"
    const scoutIdToLabel = new Map<string, string>();
    if (shouldAnonymize) {
      let counter = 1;
      for (const t of verzoek.toewijzingen) {
        if (!scoutIdToLabel.has(t.scoutId)) {
          scoutIdToLabel.set(t.scoutId, `Scout ${counter}`);
          counter++;
        }
      }
      // Voeg ook scouts toe die alleen rapporten hebben (zonder toewijzing)
      for (const r of verzoek.rapporten) {
        if (!scoutIdToLabel.has(r.scoutId)) {
          scoutIdToLabel.set(r.scoutId, `Scout ${counter}`);
          counter++;
        }
      }
    }

    const getScoutNaam = (scoutId: string, realNaam: string): string => {
      if (!shouldAnonymize) return realNaam;
      return scoutIdToLabel.get(scoutId) ?? "Scout";
    };

    return ok({
      id: verzoek.id,
      type: verzoek.type,
      doel: verzoek.doel,
      status: verzoek.status,
      toelichting: verzoek.toelichting,
      deadline: verzoek.deadline?.toISOString() ?? null,
      anoniem: verzoek.anoniem,
      teamId: verzoek.teamId,
      spelerIds: verzoek.spelerIds,
      seizoen: verzoek.seizoen,
      maker: verzoek.maker,
      toewijzingen: verzoek.toewijzingen.map(
        (t: {
          id: string;
          scoutId: string;
          scout: { id: string; naam: string; email: string };
          status: string;
          createdAt: Date;
        }) => ({
          id: t.id,
          scoutId: shouldAnonymize ? undefined : t.scoutId,
          scoutNaam: getScoutNaam(t.scoutId, t.scout.naam),
          status: t.status,
          createdAt: t.createdAt.toISOString(),
        })
      ),
      rapporten: verzoek.rapporten.map(
        (r: {
          id: string;
          scoutId: string;
          scout: { id: string; naam: string };
          spelerId: string;
          speler: { id: string };
          overallScore: number | null;
          opmerking: string | null;
          context: string;
          datum: Date;
        }) => ({
          id: r.id,
          scoutNaam: getScoutNaam(r.scoutId, r.scout.naam),
          spelerId: r.spelerId,
          overallScore: r.overallScore,
          opmerking: r.opmerking,
          context: r.context,
          datum: r.datum.toISOString(),
        })
      ),
      createdAt: verzoek.createdAt.toISOString(),
      updatedAt: verzoek.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Fout bij ophalen verzoek detail:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ── PATCH /api/verzoeken/[id] ───────────────────────────────────
// Wijzig status, toelichting of deadline

const UpdateVerzoekSchema = z
  .object({
    status: z.enum(["OPEN", "ACTIEF", "AFGEROND", "GEANNULEERD"]).optional(),
    toelichting: z.string().optional(),
    deadline: z.string().datetime({ offset: true }).nullable().optional(),
    anoniem: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimaal 1 veld moet worden meegegeven",
  });

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Auth: alleen TC
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    // Controleer dat verzoek bestaat
    const bestaand = await db.scoutingVerzoek.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!bestaand) {
      return fail("Verzoek niet gevonden", 404, "NOT_FOUND");
    }

    // Geen wijzigingen op geannuleerde verzoeken
    if (bestaand.status === "GEANNULEERD") {
      return fail("Geannuleerd verzoek kan niet meer worden gewijzigd", 409, "CONFLICT");
    }

    // Valideer body
    const parsed = await parseBody(request, UpdateVerzoekSchema);
    if (!parsed.ok) return parsed.response;

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.toelichting !== undefined) updateData.toelichting = parsed.data.toelichting;
    if (parsed.data.deadline !== undefined) {
      updateData.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
    }
    if (parsed.data.anoniem !== undefined) updateData.anoniem = parsed.data.anoniem;

    const verzoek = await db.scoutingVerzoek.update({
      where: { id },
      data: updateData,
      include: {
        maker: { select: { naam: true, email: true } },
        _count: { select: { toewijzingen: true, rapporten: true } },
      },
    });

    logger.info(`Verzoek ${id} bijgewerkt: ${JSON.stringify(parsed.data)}`);

    return ok({
      id: verzoek.id,
      type: verzoek.type,
      doel: verzoek.doel,
      status: verzoek.status,
      toelichting: verzoek.toelichting,
      deadline: verzoek.deadline?.toISOString() ?? null,
      anoniem: verzoek.anoniem,
      teamId: verzoek.teamId,
      spelerIds: verzoek.spelerIds,
      seizoen: verzoek.seizoen,
      maker: verzoek.maker,
      aantalToewijzingen: verzoek._count.toewijzingen,
      aantalRapporten: verzoek._count.rapporten,
      updatedAt: verzoek.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Fout bij bijwerken verzoek:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ── DELETE /api/verzoeken/[id] ──────────────────────────────────
// Soft delete: zet status op GEANNULEERD

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Auth: alleen TC
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    // Controleer dat verzoek bestaat
    const bestaand = await db.scoutingVerzoek.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!bestaand) {
      return fail("Verzoek niet gevonden", 404, "NOT_FOUND");
    }

    if (bestaand.status === "GEANNULEERD") {
      return fail("Verzoek is al geannuleerd", 409, "ALREADY_CANCELLED");
    }

    const verzoek = await db.scoutingVerzoek.update({
      where: { id },
      data: { status: "GEANNULEERD" },
      select: { id: true, status: true, updatedAt: true },
    });

    logger.info(`Verzoek ${id} geannuleerd`);

    return ok({
      id: verzoek.id,
      status: verzoek.status,
      updatedAt: verzoek.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Fout bij annuleren verzoek:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
