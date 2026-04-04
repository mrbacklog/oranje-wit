"use server";

import { prisma } from "./prisma";
import { logger } from "@oranje-wit/types";

/**
 * Haal de werkindeling op voor een blauwdruk.
 * Retourneert null als er geen werkindeling is.
 */
export async function getWerkindeling(blauwdrukId: string) {
  return prisma.werkindeling.findFirst({
    where: { blauwdrukId, verwijderdOp: null },
    select: {
      id: true,
      naam: true,
      status: true,
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
  const result = await prisma.werkindeling.findFirst({
    where: { blauwdrukId, verwijderdOp: null },
    select: { id: true },
  });
  return result?.id ?? null;
}

/**
 * Maak een werkindeling aan voor een blauwdruk (eerste lege versie).
 * Wordt automatisch aangeroepen als er nog geen werkindeling bestaat.
 */
export async function maakWerkindelingAan(blauwdrukId: string, auteur: string): Promise<string> {
  const werkindeling = await prisma.werkindeling.create({
    data: {
      blauwdrukId,
      naam: "Werkindeling",
      versies: {
        create: {
          nummer: 1,
          naam: "Initieel",
          auteur,
        },
      },
    },
    select: { id: true },
  });
  logger.info(`Werkindeling aangemaakt voor blauwdruk ${blauwdrukId}`);
  return werkindeling.id;
}
