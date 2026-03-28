"use server";

import { requireTC } from "@oranje-wit/auth/checks";
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
 * Zorg dat seizoenen 10 jaar vooruit bestaan.
 * Wordt aangeroepen bij het laden van de kalender.
 */
export async function ensureSeizoenen(): Promise<void> {
  await requireTC();
  const huidigJaar = new Date().getFullYear();
  const seizoenen: string[] = [];
  for (let j = huidigJaar; j < huidigJaar + 10; j++) {
    seizoenen.push(`${j}-${j + 1}`);
  }

  const bestaand = await (prisma.seizoen.findMany as PrismaFn)({
    where: { seizoen: { in: seizoenen } },
    select: { seizoen: true },
  });
  const bestaandSet = new Set(bestaand.map((s: { seizoen: string }) => s.seizoen));

  for (const s of seizoenen) {
    if (bestaandSet.has(s)) continue;
    const [startStr] = s.split("-");
    const startJaar = Number(startStr);
    await (prisma.seizoen.create as PrismaFn)({
      data: {
        seizoen: s,
        startJaar,
        eindJaar: startJaar + 1,
        startDatum: new Date(`${startJaar}-07-01`),
        eindDatum: new Date(`${startJaar + 1}-06-30`),
        peildatum: new Date(`${startJaar}-12-31`),
        status: "VOORBEREIDING",
      },
    });
    logger.info(`Seizoen ${s} automatisch aangemaakt`);
  }
}

/**
 * Actieve en voorbereidende seizoenen (afgeronde horen in Archivering).
 */
export async function getSeizoenen(): Promise<SeizoenRow[]> {
  await requireTC();
  await ensureSeizoenen();
  const seizoenen = await (prisma.seizoen.findMany as PrismaFn)({
    where: { status: { in: ["VOORBEREIDING", "ACTIEF"] } },
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

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Wijzig de status van een seizoen.
 * Bij ACTIEF: er mag maar 1 actief seizoen tegelijk zijn.
 */
export async function updateSeizoenStatus(seizoen: string, status: string): Promise<ActionResult> {
  await requireTC();
  const parsed = SeizoenStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige status" };
  }

  try {
    // Bij activeren: controleer dat er niet al een ander actief seizoen is
    if (parsed.data === "ACTIEF") {
      const huidigActief = await (prisma.seizoen.findFirst as PrismaFn)({
        where: { status: "ACTIEF", seizoen: { not: seizoen } },
        select: { seizoen: true },
      });
      if (huidigActief) {
        return {
          ok: false,
          error: `Seizoen ${huidigActief.seizoen} is al actief. Rond dat eerst af.`,
        };
      }
    }

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
