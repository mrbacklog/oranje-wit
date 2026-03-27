"use server";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type CoordinatorRow = Awaited<ReturnType<typeof getCoordinatoren>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle coordinatoren met hun teamkoppelingen.
 */
export async function getCoordinatoren() {
  const coordinatoren = await prisma.coordinator.findMany({
    orderBy: { naam: "asc" },
    include: {
      teams: {
        include: {
          owTeam: {
            select: { id: true, naam: true, seizoen: true, owCode: true },
          },
        },
        orderBy: { seizoen: "desc" },
      },
    },
  });
  return coordinatoren;
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
  const raw = {
    naam: formData.get("naam"),
    email: formData.get("email"),
  };

  const parsed = CreateCoordinatorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const bestaand = await prisma.coordinator.findUnique({
      where: { email: parsed.data.email },
    });
    if (bestaand) {
      return { ok: false, error: "Dit e-mailadres is al in gebruik" };
    }

    const coordinator = await prisma.coordinator.create({
      data: {
        naam: parsed.data.naam,
        email: parsed.data.email,
      },
    });

    logger.info(`Coordinator aangemaakt: ${coordinator.naam}`);
    revalidatePath("/evaluatie/coordinatoren");
    return { ok: true, data: { id: coordinator.id } };
  } catch (error) {
    logger.warn("createCoordinator mislukt:", error);
    return { ok: false, error: "Kon coordinator niet aanmaken" };
  }
}

/**
 * Verwijder een coordinator.
 */
export async function deleteCoordinator(id: string): Promise<ActionResult> {
  try {
    await prisma.coordinator.delete({ where: { id } });

    logger.info(`Coordinator verwijderd: ${id}`);
    revalidatePath("/evaluatie/coordinatoren");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("deleteCoordinator mislukt:", error);
    return { ok: false, error: "Kon coordinator niet verwijderen" };
  }
}
