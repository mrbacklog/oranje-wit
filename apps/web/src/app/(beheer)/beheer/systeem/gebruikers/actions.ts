"use server";

import { prisma } from "@/lib/db/prisma";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Validatie-schema's ────────────────────────────────────────

const RolSchema = z.enum(["EDITOR", "REVIEWER", "VIEWER"]);
const ScoutRolSchema = z.enum(["SCOUT", "TC"]).nullable().optional();

const CreateGebruikerSchema = z.object({
  email: z
    .string()
    .email("Ongeldig e-mailadres")
    .transform((e) => e.toLowerCase()),
  naam: z.string().min(1, "Naam is verplicht").max(100),
  rol: RolSchema,
  scoutRol: ScoutRolSchema,
  isAdmin: z.boolean().optional().default(false),
});

const UpdateGebruikerSchema = z.object({
  naam: z.string().min(1).max(100).optional(),
  rol: RolSchema.optional(),
  scoutRol: ScoutRolSchema,
  isAdmin: z.boolean().optional(),
  actief: z.boolean().optional(),
});

// ── Types ─────────────────────────────────────────────────────

export type GebruikerRow = Awaited<ReturnType<typeof getGebruikers>>[number];

export type { ActionResult } from "@oranje-wit/types";

// ── Queries ───────────────────────────────────────────────────

/**
 * Lijst alle gebruikers, gesorteerd op naam.
 */
export async function getGebruikers() {
  const gebruikers = await prisma.gebruiker.findMany({
    orderBy: [{ actief: "desc" }, { naam: "asc" }],
  });
  return gebruikers;
}

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Maak een nieuwe gebruiker aan.
 */
export async function createGebruiker(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = {
    email: formData.get("email"),
    naam: formData.get("naam"),
    rol: formData.get("rol"),
    scoutRol: formData.get("scoutRol") || null,
    isAdmin: formData.get("isAdmin") === "true",
  };

  const parsed = CreateGebruikerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    // Check of e-mail al bestaat
    const bestaand = await prisma.gebruiker.findUnique({
      where: { email: parsed.data.email },
    });
    if (bestaand) {
      return { ok: false, error: "Dit e-mailadres is al in gebruik" };
    }

    const gebruiker = await prisma.gebruiker.create({
      data: {
        email: parsed.data.email,
        naam: parsed.data.naam,
        rol: parsed.data.rol,
        scoutRol: parsed.data.scoutRol ?? null,
        isAdmin: parsed.data.isAdmin,
      },
    });

    logger.info(`Gebruiker aangemaakt: ${gebruiker.email} (${gebruiker.rol})`);
    revalidatePath("/beheer/systeem/gebruikers");
    return { ok: true, data: { id: gebruiker.id } };
  } catch (error) {
    logger.warn("createGebruiker mislukt:", error);
    return { ok: false, error: "Kon gebruiker niet aanmaken" };
  }
}

/**
 * Wijzig een bestaande gebruiker.
 */
export async function updateGebruiker(id: string, formData: FormData): Promise<ActionResult> {
  const raw: Record<string, unknown> = {};
  const naam = formData.get("naam");
  const rol = formData.get("rol");
  const scoutRol = formData.get("scoutRol");
  const isAdmin = formData.get("isAdmin");
  const actief = formData.get("actief");

  if (naam !== null) raw.naam = naam;
  if (rol !== null) raw.rol = rol;
  if (scoutRol !== null) raw.scoutRol = scoutRol || null;
  if (isAdmin !== null) raw.isAdmin = isAdmin === "true";
  if (actief !== null) raw.actief = actief === "true";

  const parsed = UpdateGebruikerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.gebruiker.update({
      where: { id },
      data: parsed.data,
    });

    logger.info(`Gebruiker bijgewerkt: ${id}`);
    revalidatePath("/beheer/systeem/gebruikers");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("updateGebruiker mislukt:", error);
    return { ok: false, error: "Kon gebruiker niet bijwerken" };
  }
}

/**
 * Deactiveer een gebruiker (soft delete).
 * Admin-gebruikers kunnen niet gedeactiveerd worden.
 */
export async function toggleActief(id: string): Promise<ActionResult> {
  try {
    const gebruiker = await prisma.gebruiker.findUnique({ where: { id } });
    if (!gebruiker) {
      return { ok: false, error: "Gebruiker niet gevonden" };
    }

    // Voorkom deactiveren van de laatste admin
    if (gebruiker.isAdmin && gebruiker.actief) {
      const aantalAdmins = await prisma.gebruiker.count({
        where: { isAdmin: true, actief: true },
      });
      if (aantalAdmins <= 1) {
        return { ok: false, error: "Kan de laatste admin niet deactiveren" };
      }
    }

    await prisma.gebruiker.update({
      where: { id },
      data: { actief: !gebruiker.actief },
    });

    logger.info(
      `Gebruiker ${!gebruiker.actief ? "geactiveerd" : "gedeactiveerd"}: ${gebruiker.email}`
    );
    revalidatePath("/beheer/systeem/gebruikers");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("toggleActief mislukt:", error);
    return { ok: false, error: "Kon status niet wijzigen" };
  }
}

/**
 * Verwijder een gebruiker permanent.
 * Admin-gebruikers kunnen niet verwijderd worden.
 */
export async function deleteGebruiker(id: string): Promise<ActionResult> {
  try {
    const gebruiker = await prisma.gebruiker.findUnique({ where: { id } });
    if (!gebruiker) {
      return { ok: false, error: "Gebruiker niet gevonden" };
    }
    if (gebruiker.isAdmin) {
      return { ok: false, error: "Admin-gebruikers kunnen niet verwijderd worden" };
    }

    await prisma.gebruiker.delete({ where: { id } });

    logger.info(`Gebruiker verwijderd: ${gebruiker.email}`);
    revalidatePath("/beheer/systeem/gebruikers");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("deleteGebruiker mislukt:", error);
    return { ok: false, error: "Kon gebruiker niet verwijderen" };
  }
}
