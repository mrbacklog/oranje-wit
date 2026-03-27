"use server";

import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type { ActionResult } from "@oranje-wit/types";

export interface SeizoenRow {
  seizoen: string;
  startJaar: number;
  eindJaar: number;
  startDatum: Date;
  eindDatum: Date;
  peildatum: Date;
  status: string;
  _count: {
    owTeams: number;
    competitieSpelers: number;
    mijlpalen: number;
  };
}

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle seizoenen, gesorteerd op startJaar (nieuwste eerst).
 */
export async function getSeizoenen(): Promise<SeizoenRow[]> {
  const seizoenen = await (prisma.seizoen.findMany as PrismaFn)({
    orderBy: { startJaar: "desc" },
    include: {
      _count: {
        select: {
          owTeams: true,
          competitieSpelers: true,
          mijlpalen: true,
        },
      },
    },
  });
  return seizoenen;
}

// ── Validatie ─────────────────────────────────────────────────

const SeizoenStatusSchema = z.enum(["VOORBEREIDING", "ACTIEF", "AFGEROND"]);

const NieuwSeizoenSchema = z.object({
  seizoen: z.string().regex(/^\d{4}-\d{4}$/, "Formaat moet JJJJ-JJJJ zijn (bijv. 2026-2027)"),
});

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Wijzig de status van een seizoen.
 */
export async function updateSeizoenStatus(seizoen: string, status: string): Promise<ActionResult> {
  const parsed = SeizoenStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige status" };
  }

  try {
    await (prisma.seizoen.update as PrismaFn)({
      where: { seizoen },
      data: { status: parsed.data },
    });

    logger.info(`Seizoen ${seizoen} status gewijzigd naar ${parsed.data}`);
    revalidatePath("/beheer/jaarplanning/kalender");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("updateSeizoenStatus mislukt:", error);
    return { ok: false, error: "Kon status niet wijzigen" };
  }
}

/**
 * Maak een nieuw seizoen aan.
 */
export async function maakNieuwSeizoen(
  seizoenStr: string
): Promise<ActionResult<{ seizoen: string }>> {
  const parsed = NieuwSeizoenSchema.safeParse({ seizoen: seizoenStr });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const [startStr, eindStr] = parsed.data.seizoen.split("-");
  const startJaar = Number(startStr);
  const eindJaar = Number(eindStr);

  if (eindJaar !== startJaar + 1) {
    return { ok: false, error: "Eindjaar moet startjaar + 1 zijn" };
  }

  try {
    const bestaand = await (prisma.seizoen.findUnique as PrismaFn)({
      where: { seizoen: parsed.data.seizoen },
    });
    if (bestaand) {
      return { ok: false, error: "Dit seizoen bestaat al" };
    }

    const seizoen = await (prisma.seizoen.create as PrismaFn)({
      data: {
        seizoen: parsed.data.seizoen,
        startJaar,
        eindJaar,
        startDatum: new Date(`${startJaar}-08-01`),
        eindDatum: new Date(`${eindJaar}-06-30`),
        peildatum: new Date(`${startJaar}-12-31`),
        status: "VOORBEREIDING",
      },
    });

    logger.info(`Nieuw seizoen aangemaakt: ${seizoen.seizoen}`);
    revalidatePath("/beheer/jaarplanning/kalender");
    return { ok: true, data: { seizoen: seizoen.seizoen } };
  } catch (error) {
    logger.warn("maakNieuwSeizoen mislukt:", error);
    return { ok: false, error: "Kon seizoen niet aanmaken" };
  }
}
