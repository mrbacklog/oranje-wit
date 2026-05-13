"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma as _prisma, SpelerStatus, GezienStatus } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import type { ActionResult } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

// Workaround voor TS2321 Prisma v7 type-recursie (zie packages/database/src/index.ts PrismaFn opmerking)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _prisma as any;

function genId(): string {
  return randomBytes(12).toString("hex");
}

// ── 3.1 Speler status updaten ──────────────────────────────────────────

const updateSpelerStatusSchema = z.object({
  spelerId: z.string().min(1),
  status: z.nativeEnum(SpelerStatus),
});

export async function updateSpelerStatus(
  formData: z.infer<typeof updateSpelerStatusSchema>
): Promise<ActionResult<{ spelerId: string; status: SpelerStatus }>> {
  await requireTC();

  const parsed = updateSpelerStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.speler.update({
      where: { id: parsed.data.spelerId },
      data: { status: parsed.data.status },
    });
    revalidatePath("/personen/spelers");
    return { ok: true, data: { spelerId: parsed.data.spelerId, status: parsed.data.status } };
  } catch (error) {
    logger.warn("updateSpelerStatus mislukt:", error);
    return { ok: false, error: "Status bijwerken mislukt" };
  }
}

// ── 3.2 Gezien-status updaten ──────────────────────────────────────────

const updateGezienStatusSchema = z.object({
  kadersId: z.string().min(1),
  spelerId: z.string().min(1),
  gezienStatus: z.nativeEnum(GezienStatus),
});

export async function updateGezienStatus(
  formData: z.infer<typeof updateGezienStatusSchema>
): Promise<ActionResult<{ kadersSpelerId: string; gezienStatus: GezienStatus }>> {
  await requireTC();

  const parsed = updateGezienStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    const record = await db.kadersSpeler.upsert({
      where: {
        kadersId_spelerId: {
          kadersId: parsed.data.kadersId,
          spelerId: parsed.data.spelerId,
        },
      },
      update: { gezienStatus: parsed.data.gezienStatus },
      create: {
        kadersId: parsed.data.kadersId,
        spelerId: parsed.data.spelerId,
        gezienStatus: parsed.data.gezienStatus,
      },
      select: { id: true },
    });
    revalidatePath("/personen/spelers");
    return {
      ok: true,
      data: { kadersSpelerId: record.id, gezienStatus: parsed.data.gezienStatus },
    };
  } catch (error) {
    logger.warn("updateGezienStatus mislukt:", error);
    return { ok: false, error: "Gezien-status bijwerken mislukt" };
  }
}

// ── 3.3 Indeling bijwerken ─────────────────────────────────────────────

const updateIndelingSchema = z.object({
  spelerId: z.string().min(1),
  versieId: z.string().min(1),
  teamId: z.string().nullable(),
});

export async function updateSpelerIndeling(
  formData: z.infer<typeof updateIndelingSchema>
): Promise<ActionResult<{ spelerId: string; teamId: string | null }>> {
  await requireTC();

  const parsed = updateIndelingSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  const { spelerId, versieId, teamId } = parsed.data;

  try {
    if (teamId === null) {
      // Verwijder uit alle teams in deze versie
      const teams = await db.team.findMany({
        where: { versieId },
        select: { id: true },
      });
      await db.teamSpeler.deleteMany({
        where: {
          spelerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          teamId: { in: teams.map((t: any) => t.id) },
        },
      });
    } else {
      // Eerst verwijder uit andere teams in deze versie
      const teams = await db.team.findMany({
        where: { versieId },
        select: { id: true },
      });
      await db.teamSpeler.deleteMany({
        where: {
          spelerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          teamId: { in: teams.map((t: any) => t.id) },
        },
      });
      // Dan upsert in het gewenste team
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.teamSpeler.upsert({
        where: { teamId_spelerId: { teamId, spelerId } },
        update: {},
        create: { teamId, spelerId },
      });
    }
    revalidatePath("/personen/spelers");
    revalidatePath("/indeling");
    return { ok: true, data: { spelerId, teamId } };
  } catch (error) {
    logger.warn("updateSpelerIndeling mislukt:", error);
    return { ok: false, error: "Indeling bijwerken mislukt" };
  }
}

// ── 3.4 Nieuwe speler aanmaken ─────────────────────────────────────────

const nieuweSpelerSchema = z.object({
  roepnaam: z.string().min(1).max(100),
  achternaam: z.string().min(1).max(100),
  geslacht: z.enum(["M", "V"]),
  geboortedatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.nativeEnum(SpelerStatus).default("NIEUW_POTENTIEEL"),
});

export async function maakNieuweSpeler(
  formData: z.infer<typeof nieuweSpelerSchema>
): Promise<ActionResult<{ spelerId: string }>> {
  await requireTC();

  const parsed = nieuweSpelerSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  const { roepnaam, achternaam, geslacht, geboortedatum, status } = parsed.data;
  const gebDatum = new Date(geboortedatum);
  const geboortejaar = gebDatum.getFullYear();

  // Handmatig-aangemaakt speler: geen rel_code, gebruik OW-prefix + cuid
  const spelerId = `OW-${genId()}`;

  try {
    await db.speler.create({
      data: {
        id: spelerId,
        roepnaam,
        achternaam,
        geslacht: geslacht as "M" | "V",
        geboortedatum: gebDatum,
        geboortejaar,
        status,
      },
    });
    revalidatePath("/personen/spelers");
    return { ok: true, data: { spelerId } };
  } catch (error) {
    logger.warn("maakNieuweSpeler mislukt:", error);
    return { ok: false, error: "Speler aanmaken mislukt" };
  }
}

// ── 3.5 Nieuwe staf aanmaken ───────────────────────────────────────────

const nieuweStafSchema = z.object({
  naam: z.string().min(1).max(200),
  rollen: z.array(z.string()).default([]),
  email: z.string().email().optional(),
  geboortejaar: z.number().int().min(1940).max(2010).optional(),
});

export async function maakNieuweStaf(
  formData: z.infer<typeof nieuweStafSchema>
): Promise<ActionResult<{ stafId: string }>> {
  await requireTC();

  const parsed = nieuweStafSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    // Genereer stafCode: STAF-XXX (autoincrement padded)
    const count = await db.staf.count();
    const stafId = `STAF-${String(count + 1).padStart(3, "0")}`;

    await db.staf.create({
      data: {
        id: stafId,
        naam: parsed.data.naam,
        rollen: parsed.data.rollen,
        email: parsed.data.email ?? null,
        geboortejaar: parsed.data.geboortejaar ?? null,
      },
    });
    revalidatePath("/personen/staf");
    return { ok: true, data: { stafId } };
  } catch (error) {
    logger.warn("maakNieuweStaf mislukt:", error);
    return { ok: false, error: "Staf aanmaken mislukt" };
  }
}

// ── 3.6 Nieuwe reserveringsspeler aanmaken ────────────────────────────

const nieuweReserveringSchema = z.object({
  titel: z.string().min(1).max(200),
  geslacht: z.enum(["M", "V"]),
});

export async function maakNieuweReservering(
  formData: z.infer<typeof nieuweReserveringSchema>
): Promise<ActionResult<{ id: string }>> {
  await requireTC();

  const parsed = nieuweReserveringSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    const reservering = await db.reserveringsspeler.create({
      data: {
        titel: parsed.data.titel,
        geslacht: parsed.data.geslacht as "M" | "V",
      },
      select: { id: true },
    });
    revalidatePath("/personen/reserveringen");
    return { ok: true, data: { id: reservering.id } };
  } catch (error) {
    logger.warn("maakNieuweReservering mislukt:", error);
    return { ok: false, error: "Reservering aanmaken mislukt" };
  }
}
