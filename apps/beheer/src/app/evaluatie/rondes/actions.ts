"use server";

import { prisma } from "@/lib/db/prisma";
import {
  getRondes as _getRondes,
  createRonde as _createRonde,
  updateRondeStatus as _updateRondeStatus,
  type EvaluatieRondeMetCounts,
} from "@oranje-wit/database";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type { ActionResult } from "@oranje-wit/types";

export type RondeRow = EvaluatieRondeMetCounts;

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle evaluatierondes met counts.
 */
export async function getRondes() {
  return _getRondes(prisma);
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
    const result = await _createRonde(prisma, {
      seizoen: parsed.data.seizoen,
      ronde: parsed.data.ronde,
      naam: parsed.data.naam,
      type: parsed.data.type,
      deadline: new Date(parsed.data.deadline),
    });

    if (!result.ok) {
      return result;
    }

    logger.info(`Evaluatieronde aangemaakt: ${parsed.data.naam}`);
    revalidatePath("/evaluatie/rondes");
    return result;
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
    const result = await _updateRondeStatus(prisma, id, parsed.data);

    logger.info(`Evaluatieronde ${id} status gewijzigd naar ${parsed.data}`);
    revalidatePath("/evaluatie/rondes");
    return result;
  } catch (error) {
    logger.warn("updateRondeStatus mislukt:", error);
    return { ok: false, error: "Kon status niet wijzigen" };
  }
}
