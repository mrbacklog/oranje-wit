"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type { ActionResult } from "@oranje-wit/types";

export type MijlpaalRow = Awaited<ReturnType<typeof getMijlpalen>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle mijlpalen, gegroepeerd per seizoen.
 */
export async function getMijlpalen(seizoen?: string) {
  await requireTC();
  const where = seizoen ? { seizoen } : {};
  const mijlpalen = await prisma.mijlpaal.findMany({
    where,
    orderBy: [{ seizoen: "desc" }, { volgorde: "asc" }, { datum: "asc" }],
  });
  return mijlpalen;
}

/**
 * Beschikbare seizoenen (voor de seizoen-selector).
 */
export async function getSeizoenOpties() {
  await requireTC();
  const seizoenen = await prisma.seizoen.findMany({
    orderBy: { startJaar: "desc" },
    select: { seizoen: true, status: true },
  });
  return seizoenen;
}

// ── Validatie ─────────────────────────────────────────────────

const CreateMijlpaalSchema = z.object({
  seizoen: z.string().min(1, "Seizoen is verplicht"),
  label: z.string().min(1, "Label is verplicht").max(200),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum"),
  volgorde: z.coerce.number().int().min(0).default(0),
});

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Maak een nieuwe mijlpaal aan.
 */
export async function createMijlpaal(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireTC();
  const raw = {
    seizoen: formData.get("seizoen"),
    label: formData.get("label"),
    datum: formData.get("datum"),
    volgorde: formData.get("volgorde") ?? 0,
  };

  const parsed = CreateMijlpaalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    // @ts-expect-error TS2321 excessive stack depth (Prisma/TypeScript limitation)
    const mijlpaal = await prisma.mijlpaal.create({
      data: {
        seizoen: parsed.data.seizoen,
        label: parsed.data.label,
        datum: new Date(parsed.data.datum),
        volgorde: parsed.data.volgorde,
      },
    });

    logger.info(`Mijlpaal aangemaakt: ${mijlpaal.label} (${parsed.data.seizoen})`);
    revalidatePath("/beheer/jaarplanning/mijlpalen");
    return { ok: true, data: { id: mijlpaal.id } };
  } catch (error) {
    logger.warn("createMijlpaal mislukt:", error);
    return { ok: false, error: "Kon mijlpaal niet aanmaken" };
  }
}

/**
 * Toggle afgerond-status van een mijlpaal.
 */
export async function toggleMijlpaalAfgerond(id: string): Promise<ActionResult> {
  await requireTC();
  try {
    const mijlpaal = await prisma.mijlpaal.findUnique({ where: { id } });
    if (!mijlpaal) {
      return { ok: false, error: "Mijlpaal niet gevonden" };
    }

    await prisma.mijlpaal.update({
      where: { id },
      data: {
        afgerond: !mijlpaal.afgerond,
        afgerondOp: !mijlpaal.afgerond ? new Date() : null,
      },
    });

    logger.info(`Mijlpaal ${id} ${!mijlpaal.afgerond ? "afgerond" : "heropend"}`);
    revalidatePath("/beheer/jaarplanning/mijlpalen");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("toggleMijlpaalAfgerond mislukt:", error);
    return { ok: false, error: "Kon status niet wijzigen" };
  }
}

/**
 * Verwijder een mijlpaal.
 */
export async function deleteMijlpaal(id: string): Promise<ActionResult> {
  await requireTC();
  try {
    await prisma.mijlpaal.delete({ where: { id } });

    logger.info(`Mijlpaal verwijderd: ${id}`);
    revalidatePath("/beheer/jaarplanning/mijlpalen");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("deleteMijlpaal mislukt:", error);
    return { ok: false, error: "Kon mijlpaal niet verwijderen" };
  }
}
