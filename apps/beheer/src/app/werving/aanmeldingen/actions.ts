"use server";

import { prisma, PrismaFn } from "@/lib/db/prisma";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type { ActionResult } from "@oranje-wit/types";

export type AanmeldingRow = Awaited<ReturnType<typeof getAanmeldingen>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle aanmeldingen, gesorteerd op status (actieve eerst) en datum.
 */
export async function getAanmeldingen() {
  const aanmeldingen = await prisma.aanmelding.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return aanmeldingen;
}

/**
 * Funnel-samenvatting: aantal per status.
 */
export async function getFunnelStats() {
  const stats = await prisma.aanmelding.groupBy({
    by: ["status"],
    _count: true,
  });

  const result: Record<string, number> = {
    AANMELDING: 0,
    PROEFLES: 0,
    INTAKE: 0,
    LID: 0,
    AFGEHAAKT: 0,
  };

  for (const s of stats) {
    result[s.status] = s._count;
  }

  return result;
}

// ── Validatie ─────────────────────────────────────────────────

const CreateAanmeldingSchema = z.object({
  naam: z.string().min(1, "Naam is verplicht").max(200),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  telefoon: z.string().max(20).optional().or(z.literal("")),
  geboortejaar: z.coerce.number().int().min(1950).max(2030).optional().or(z.literal("")),
  bron: z.string().max(100).optional().or(z.literal("")),
  opmerking: z.string().max(2000).optional().or(z.literal("")),
});

const AanmeldingStatusSchema = z.enum(["AANMELDING", "PROEFLES", "INTAKE", "LID", "AFGEHAAKT"]);

const UpdateAanmeldingSchema = z.object({
  naam: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.literal(null)),
  telefoon: z.string().max(20).optional().or(z.literal("")).or(z.literal(null)),
  geboortejaar: z.coerce
    .number()
    .int()
    .min(1950)
    .max(2030)
    .optional()
    .or(z.literal(""))
    .or(z.literal(null)),
  bron: z.string().max(100).optional().or(z.literal("")).or(z.literal(null)),
  opmerking: z.string().max(2000).optional().or(z.literal("")).or(z.literal(null)),
  ledenadmin: z.string().max(200).optional().or(z.literal("")).or(z.literal(null)),
  trainer: z.string().max(200).optional().or(z.literal("")).or(z.literal(null)),
  tcLid: z.string().max(200).optional().or(z.literal("")).or(z.literal(null)),
});

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Maak een nieuwe aanmelding aan.
 */
export async function createAanmelding(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = {
    naam: formData.get("naam"),
    email: formData.get("email") || undefined,
    telefoon: formData.get("telefoon") || undefined,
    geboortejaar: formData.get("geboortejaar") || undefined,
    bron: formData.get("bron") || undefined,
    opmerking: formData.get("opmerking") || undefined,
  };

  const parsed = CreateAanmeldingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const aanmelding = await prisma.aanmelding.create({
      data: {
        naam: parsed.data.naam,
        email: parsed.data.email || null,
        telefoon: parsed.data.telefoon || null,
        geboortejaar:
          typeof parsed.data.geboortejaar === "number" ? parsed.data.geboortejaar : null,
        bron: parsed.data.bron || null,
        opmerking: parsed.data.opmerking || null,
        status: "AANMELDING",
      },
    });

    logger.info(`Aanmelding aangemaakt: ${aanmelding.naam}`);
    revalidatePath("/werving/aanmeldingen");
    revalidatePath("/werving/funnel");
    return { ok: true, data: { id: aanmelding.id } };
  } catch (error) {
    logger.warn("createAanmelding mislukt:", error);
    return { ok: false, error: "Kon aanmelding niet aanmaken" };
  }
}

/**
 * Wijzig de status van een aanmelding (funnel-stap).
 */
export async function updateAanmeldingStatus(id: string, status: string): Promise<ActionResult> {
  const parsed = AanmeldingStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige status" };
  }

  try {
    await prisma.aanmelding.update({
      where: { id },
      data: { status: parsed.data },
    });

    logger.info(`Aanmelding ${id} status gewijzigd naar ${parsed.data}`);
    revalidatePath("/werving/aanmeldingen");
    revalidatePath("/werving/funnel");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("updateAanmeldingStatus mislukt:", error);
    return { ok: false, error: "Kon status niet wijzigen" };
  }
}

/**
 * Wijzig gegevens van een aanmelding.
 */
export async function updateAanmelding(id: string, formData: FormData): Promise<ActionResult> {
  const raw: Record<string, unknown> = {};
  const naam = formData.get("naam");
  const email = formData.get("email");
  const telefoon = formData.get("telefoon");
  const geboortejaar = formData.get("geboortejaar");
  const bron = formData.get("bron");
  const opmerking = formData.get("opmerking");
  const ledenadmin = formData.get("ledenadmin");
  const trainer = formData.get("trainer");
  const tcLid = formData.get("tcLid");

  if (naam !== null) raw.naam = naam;
  if (email !== null) raw.email = email || null;
  if (telefoon !== null) raw.telefoon = telefoon || null;
  if (geboortejaar !== null) raw.geboortejaar = geboortejaar || null;
  if (bron !== null) raw.bron = bron || null;
  if (opmerking !== null) raw.opmerking = opmerking || null;
  if (ledenadmin !== null) raw.ledenadmin = ledenadmin || null;
  if (trainer !== null) raw.trainer = trainer || null;
  if (tcLid !== null) raw.tcLid = tcLid || null;

  const parsed = UpdateAanmeldingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await (prisma.aanmelding.update as PrismaFn)({
      where: { id },
      data: parsed.data,
    });

    logger.info(`Aanmelding bijgewerkt: ${id}`);
    revalidatePath("/werving/aanmeldingen");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("updateAanmelding mislukt:", error);
    return { ok: false, error: "Kon aanmelding niet bijwerken" };
  }
}
