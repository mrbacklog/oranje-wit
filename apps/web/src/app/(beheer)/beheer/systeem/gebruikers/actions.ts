"use server";

import { prisma } from "@/lib/db/prisma";
import { verstuurSmartlinkEmail } from "@oranje-wit/auth/smartlink-email";
import { maakToegangsToken } from "@oranje-wit/auth/tokens";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Validatie-schema's ────────────────────────────────────────

const DoelgroepSchema = z.enum([
  "KWEEKVIJVER",
  "ONTWIKKELHART",
  "TOP",
  "WEDSTRIJDSPORT",
  "KORFBALPLEZIER",
  "ALLE",
]);

const CreateGebruikerSchema = z.object({
  email: z
    .string()
    .email("Ongeldig e-mailadres")
    .transform((e) => e.toLowerCase()),
  naam: z.string().min(1, "Naam is verplicht").max(100),
  isTC: z.boolean().optional().default(false),
  isTCKern: z.boolean().optional().default(false),
  isScout: z.boolean().optional().default(false),
  clearance: z.number().int().min(0).max(3).default(0),
  doelgroepen: z.array(DoelgroepSchema).optional().default([]),
});

const UpdateGebruikerSchema = z.object({
  naam: z.string().min(1).max(100).optional(),
  isTC: z.boolean().optional(),
  isTCKern: z.boolean().optional(),
  isScout: z.boolean().optional(),
  clearance: z.number().int().min(0).max(3).optional(),
  doelgroepen: z.array(DoelgroepSchema).optional(),
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
    isTC: formData.get("isTC") === "true",
    isScout: formData.get("isScout") === "true",
    clearance: Number(formData.get("clearance") ?? 0),
    doelgroepen: formData.getAll("doelgroepen").map(String),
  };

  const parsed = CreateGebruikerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
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
        isTC: parsed.data.isTC,
        isScout: parsed.data.isScout,
        clearance: parsed.data.clearance,
        doelgroepen: parsed.data.doelgroepen,
      },
    });

    const labels: string[] = [];
    if (gebruiker.isTC) labels.push("TC");
    if (gebruiker.isScout) labels.push("Scout");
    if (gebruiker.doelgroepen.length > 0) labels.push("Coordinator");
    logger.info(
      `Gebruiker aangemaakt: ${gebruiker.email} [${labels.join(", ") || "geen capabilities"}] clearance=${gebruiker.clearance}`
    );
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
  const isTC = formData.get("isTC");
  const isScout = formData.get("isScout");
  const clearance = formData.get("clearance");
  const doelgroepen = formData.getAll("doelgroepen");
  const actief = formData.get("actief");

  if (naam !== null) raw.naam = naam;
  if (isTC !== null) raw.isTC = isTC === "true";
  if (isScout !== null) raw.isScout = isScout === "true";
  if (clearance !== null) raw.clearance = Number(clearance);
  if (doelgroepen.length > 0) raw.doelgroepen = doelgroepen.map(String);
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
 * Het laatste TC-lid kan niet gedeactiveerd worden.
 */
export async function toggleActief(id: string): Promise<ActionResult> {
  try {
    const gebruiker = await prisma.gebruiker.findUnique({ where: { id } });
    if (!gebruiker) {
      return { ok: false, error: "Gebruiker niet gevonden" };
    }

    // Voorkom deactiveren van het laatste TC-lid
    if (gebruiker.isTC && gebruiker.actief) {
      const aantalTC = await prisma.gebruiker.count({
        where: { isTC: true, actief: true },
      });
      if (aantalTC <= 1) {
        return {
          ok: false,
          error: "Kan het laatste TC-lid niet deactiveren",
        };
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
 * Genereer een smartlink voor een niet-TC gebruiker.
 * De smartlink is 14 dagen geldig en bevat de capabilities als scope.
 */
export async function stuurSmartlink(
  gebruikerId: string
): Promise<ActionResult<{ token: string; url: string }>> {
  try {
    const gebruiker = await prisma.gebruiker.findUnique({
      where: { id: gebruikerId },
    });

    if (!gebruiker) {
      return { ok: false, error: "Gebruiker niet gevonden" };
    }

    if (!gebruiker.actief) {
      return { ok: false, error: "Kan geen smartlink genereren voor een inactieve gebruiker" };
    }

    if (gebruiker.isTC) {
      return { ok: false, error: "TC-leden loggen in via Google, geen smartlink nodig" };
    }

    const token = await maakToegangsToken({
      email: gebruiker.email,
      naam: gebruiker.naam,
      type: "sessie",
      scope: {
        isTC: gebruiker.isTC,
        isScout: gebruiker.isScout,
        clearance: gebruiker.clearance,
        doelgroepen: gebruiker.doelgroepen,
      },
      verlooptOverDagen: 14,
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://ckvoranjewit.app";
    const url = `${baseUrl}/login/smartlink/${token}`;

    // Verstuur e-mail (in dev: gelogd naar console)
    await verstuurSmartlinkEmail({
      email: gebruiker.email,
      naam: gebruiker.naam,
      url,
    });

    logger.info(`Smartlink gegenereerd en verstuurd naar ${gebruiker.email} (geldig 14 dagen)`);

    return { ok: true, data: { token, url } };
  } catch (error) {
    logger.warn("stuurSmartlink mislukt:", error);
    return { ok: false, error: "Kon smartlink niet genereren" };
  }
}

/**
 * Verwijder een gebruiker permanent.
 * TC-leden kunnen niet verwijderd worden (eerst isTC uitzetten).
 */
export async function deleteGebruiker(id: string): Promise<ActionResult> {
  try {
    const gebruiker = await prisma.gebruiker.findUnique({ where: { id } });
    if (!gebruiker) {
      return { ok: false, error: "Gebruiker niet gevonden" };
    }
    if (gebruiker.isTC) {
      return {
        ok: false,
        error: "TC-leden kunnen niet verwijderd worden (zet eerst TC-lid uit)",
      };
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
