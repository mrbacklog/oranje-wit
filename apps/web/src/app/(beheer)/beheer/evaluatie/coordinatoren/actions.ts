"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import {
  getCoordinatoren as _getCoordinatoren,
  createCoordinator as _createCoordinator,
  deleteCoordinator as _deleteCoordinator,
  type CoordinatorMetTeams,
} from "@oranje-wit/database";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type { ActionResult } from "@oranje-wit/types";

export type CoordinatorRow = CoordinatorMetTeams;

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle coordinatoren met hun teamkoppelingen.
 */
export async function getCoordinatoren() {
  await requireTC();
  return _getCoordinatoren(prisma);
}

// ── Validatie ─────────────────────────────────────────────────

const CreateCoordinatorSchema = z.object({
  naam: z.string().min(1, "Naam is verplicht").max(200),
  email: z
    .string()
    .email("Ongeldig e-mailadres")
    .transform((e) => e.toLowerCase()),
});

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Maak een nieuwe coordinator aan.
 */
export async function createCoordinator(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireTC();
  const raw = {
    naam: formData.get("naam"),
    email: formData.get("email"),
  };

  const parsed = CreateCoordinatorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await _createCoordinator(prisma, {
      naam: parsed.data.naam,
      email: parsed.data.email,
    });

    if (!result.ok) {
      return result;
    }

    logger.info(`Coordinator aangemaakt: ${parsed.data.naam}`);
    revalidatePath("/beheer/evaluatie/coordinatoren");
    return result;
  } catch (error) {
    logger.warn("createCoordinator mislukt:", error);
    return { ok: false, error: "Kon coordinator niet aanmaken" };
  }
}

/**
 * Verwijder een coordinator.
 */
export async function deleteCoordinator(id: string): Promise<ActionResult> {
  await requireTC();
  try {
    const result = await _deleteCoordinator(prisma, id);

    logger.info(`Coordinator verwijderd: ${id}`);
    revalidatePath("/beheer/evaluatie/coordinatoren");
    return result;
  } catch (error) {
    logger.warn("deleteCoordinator mislukt:", error);
    return { ok: false, error: "Kon coordinator niet verwijderen" };
  }
}
