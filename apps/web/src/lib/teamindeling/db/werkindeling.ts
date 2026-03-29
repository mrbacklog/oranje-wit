"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";

/**
 * Haal de werkindeling op voor een blauwdruk.
 * Retourneert null als er geen werkindeling is.
 */
export async function getWerkindeling(blauwdrukId: string) {
  return prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdrukId },
      verwijderdOp: null,
    },
    select: {
      id: true,
      naam: true,
      status: true,
      isWerkindeling: true,
      toelichting: true,
      createdAt: true,
      updatedAt: true,
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          id: true,
          nummer: true,
          teams: {
            orderBy: { volgorde: "asc" },
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              teamType: true,
              volgorde: true,
              validatieStatus: true,
              _count: { select: { spelers: true, staf: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Haal het werkindeling-ID op, of null als er geen is.
 */
export async function getWerkindelingId(blauwdrukId: string): Promise<string | null> {
  const result = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdrukId },
      verwijderdOp: null,
    },
    select: { id: true },
  });
  return result?.id ?? null;
}

/**
 * Guard: controleer dat er geen werkindeling bestaat voor deze blauwdruk.
 * Gooit een fout als er al een werkindeling is.
 */
export async function assertGeenWerkindeling(blauwdrukId: string): Promise<void> {
  const bestaand = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdrukId },
      verwijderdOp: null,
    },
    select: { id: true, naam: true },
  });
  if (bestaand) {
    throw new Error(`Blauwdruk heeft al een werkindeling: "${bestaand.naam}" (${bestaand.id})`);
  }
}

/**
 * Promoveer een bestaand scenario tot werkindeling.
 * Zet alle andere scenario's in dezelfde blauwdruk op isWerkindeling: false.
 */
export async function promoveerTotWerkindeling(scenarioId: string): Promise<void> {
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    select: {
      id: true,
      concept: { select: { blauwdrukId: true, id: true } },
    },
  });

  await prisma.$transaction(async (tx: any) => {
    // Zet alle scenario's in deze blauwdruk op false
    const conceptIds = await tx.concept.findMany({
      where: { blauwdrukId: scenario.concept.blauwdrukId },
      select: { id: true },
    });
    await tx.scenario.updateMany({
      where: {
        conceptId: { in: conceptIds.map((c: any) => c.id) },
        isWerkindeling: true,
      },
      data: { isWerkindeling: false },
    });

    // Zet dit scenario op true
    await tx.scenario.update({
      where: { id: scenarioId },
      data: { isWerkindeling: true },
    });
  });

  logger.info(`Scenario ${scenarioId} gepromoveerd tot werkindeling`);
}
