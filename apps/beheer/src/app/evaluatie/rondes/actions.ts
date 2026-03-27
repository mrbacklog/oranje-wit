"use server";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type RondeRow = Awaited<ReturnType<typeof getRondes>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle evaluatierondes met counts.
 */
export async function getRondes() {
  const rondes = await prisma.evaluatieRonde.findMany({
    orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
    include: {
      _count: {
        select: {
          uitnodigingen: true,
          evaluaties: true,
        },
      },
    },
  });
  return rondes;
}

// ── Validatie ─────────────────────────────────────────────────

const CreateRondeSchema = z.object({
  seizoen: z.string().regex(/^\d{4}-\d{4}$/, "Formaat moet JJJJ-JJJJ zijn"),
  ronde: z.coerce.number().int().min(1),
  naam: z.string().min(1, "Naam is verplicht").max(200),
  type: z.enum(["trainer", "speler"]).default("trainer"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum"),
});

const RondeStatusSchema = z.enum(["concept", "actief", "gesloten"]);

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Maak een nieuwe evaluatieronde.
 */
export async function createRonde(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = {
    seizoen: formData.get("seizoen"),
    ronde: formData.get("ronde"),
    naam: formData.get("naam"),
    type: formData.get("type") ?? "trainer",
    deadline: formData.get("deadline"),
  };

  const parsed = CreateRondeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const bestaand = await prisma.evaluatieRonde.findFirst({
      where: {
        seizoen: parsed.data.seizoen,
        ronde: parsed.data.ronde,
        type: parsed.data.type,
      },
    });
    if (bestaand) {
      return { ok: false, error: "Deze ronde bestaat al voor dit seizoen/type" };
    }

    const ronde = await prisma.evaluatieRonde.create({
      data: {
        seizoen: parsed.data.seizoen,
        ronde: parsed.data.ronde,
        naam: parsed.data.naam,
        type: parsed.data.type,
        deadline: new Date(parsed.data.deadline),
        status: "concept",
      },
    });

    logger.info(`Evaluatieronde aangemaakt: ${ronde.naam}`);
    revalidatePath("/evaluatie/rondes");
    return { ok: true, data: { id: ronde.id } };
  } catch (error) {
    logger.warn("createRonde mislukt:", error);
    return { ok: false, error: "Kon ronde niet aanmaken" };
  }
}

/**
 * Wijzig de status van een ronde.
 */
export async function updateRondeStatus(id: string, status: string): Promise<ActionResult> {
  const parsed = RondeStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige status" };
  }

  try {
    await prisma.evaluatieRonde.update({
      where: { id },
      data: { status: parsed.data },
    });

    logger.info(`Evaluatieronde ${id} status gewijzigd naar ${parsed.data}`);
    revalidatePath("/evaluatie/rondes");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("updateRondeStatus mislukt:", error);
    return { ok: false, error: "Kon status niet wijzigen" };
  }
}
