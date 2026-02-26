"use server";

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@oranje-wit/database";
import type { SpelerStatus } from "@oranje-wit/database";

/**
 * Haal de blauwdruk voor een seizoen op, of maak een nieuwe aan.
 */
export async function getBlauwdruk(seizoen: string) {
  return prisma.blauwdruk.upsert({
    where: { seizoen },
    create: {
      seizoen,
      kaders: {},
      speerpunten: [],
      toelichting: "",
    },
    update: {},
  });
}

/**
 * Update kaders (JSON).
 */
export async function updateKaders(
  blauwdrukId: string,
  kaders: Prisma.InputJsonValue
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { kaders },
  });
}

/**
 * Update speerpunten (string[]).
 */
export async function updateSpeerpunten(
  blauwdrukId: string,
  speerpunten: string[]
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { speerpunten },
  });
}

/**
 * Update toelichting (string).
 */
export async function updateToelichting(
  blauwdrukId: string,
  toelichting: string
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { toelichting },
  });
}

/**
 * Keuzes: strategische vragen die in scenario's worden uitgespeeld.
 */
export interface Keuze {
  id: string;
  vraag: string;       // "Hoeveel U15-teams?"
  opties: string[];    // ["1 team", "2 teams"]
}

export async function updateKeuzes(
  blauwdrukId: string,
  keuzes: Keuze[]
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { keuzes: keuzes as unknown as Prisma.InputJsonValue },
  });
}

/**
 * Update de status van een speler (beschikbaar/twijfelt/stopt/nieuw).
 */
export async function updateSpelerStatus(
  spelerId: string,
  status: SpelerStatus
) {
  await prisma.speler.update({
    where: { id: spelerId },
    data: { status },
  });
}
