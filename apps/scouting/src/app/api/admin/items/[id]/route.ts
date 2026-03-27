import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireTC } from "@/lib/auth/requireTC";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── PATCH /api/admin/items/[id] ──────────────────────────────
// Item updaten (formulering, kern, volgorde, actief)

const ItemUpdateSchema = z.object({
  label: z.string().min(3).max(100).optional(),
  vraagTekst: z.string().min(10).max(500).optional(),
  isKern: z.boolean().optional(),
  categorie: z.enum(["KERN", "ONDERSCHEIDEND"]).nullable().optional(),
  volgorde: z.number().int().min(0).optional(),
  actief: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const { id } = await params;

    const parsed = await parseBody(request, ItemUpdateSchema);
    if (!parsed.ok) return parsed.response;

    // Verifieer dat het item bestaat en bij een CONCEPT-versie hoort
    const bestaandItem = await db.ontwikkelItem.findUnique({
      where: { id },
      include: {
        pijler: {
          include: {
            groep: {
              include: {
                versie: { select: { id: true, status: true } },
              },
            },
          },
        },
      },
    });

    if (!bestaandItem) {
      return fail(`Item met id '${id}' niet gevonden`, 404, "NOT_FOUND");
    }

    if (bestaandItem.pijler.groep.versie.status !== "CONCEPT") {
      return fail(
        "Items kunnen alleen worden gewijzigd in een CONCEPT-versie",
        400,
        "VERSION_NOT_EDITABLE"
      );
    }

    const item = await db.ontwikkelItem.update({
      where: { id },
      data: parsed.data,
    });

    logger.info(`Item ${id} bijgewerkt: ${item.label}`);

    return ok({
      id: item.id,
      pijlerId: item.pijlerId,
      itemCode: item.itemCode,
      label: item.label,
      vraagTekst: item.vraagTekst,
      isKern: item.isKern,
      categorie: item.categorie,
      volgorde: item.volgorde,
      actief: item.actief,
    });
  } catch (error) {
    logger.error("Fout bij updaten item:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ── DELETE /api/admin/items/[id] ─────────────────────────────
// Soft delete: actief = false

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const { id } = await params;

    // Verifieer dat het item bestaat en bij een CONCEPT-versie hoort
    const bestaandItem = await db.ontwikkelItem.findUnique({
      where: { id },
      include: {
        pijler: {
          include: {
            groep: {
              include: {
                versie: { select: { id: true, status: true } },
              },
            },
          },
        },
      },
    });

    if (!bestaandItem) {
      return fail(`Item met id '${id}' niet gevonden`, 404, "NOT_FOUND");
    }

    if (bestaandItem.pijler.groep.versie.status !== "CONCEPT") {
      return fail(
        "Items kunnen alleen worden verwijderd in een CONCEPT-versie",
        400,
        "VERSION_NOT_EDITABLE"
      );
    }

    // Soft delete
    const item = await db.ontwikkelItem.update({
      where: { id },
      data: { actief: false },
    });

    logger.info(`Item ${id} gedeactiveerd: ${item.label}`);

    return ok({ id: item.id, actief: false });
  } catch (error) {
    logger.error("Fout bij verwijderen item:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
