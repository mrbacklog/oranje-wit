"use server";

import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import {
  getWerkindeling,
  getWerkindelingId,
  maakWerkindelingAan,
} from "@/lib/teamindeling/db/werkindeling";
import { prisma } from "@/lib/teamindeling/db/prisma";

/**
 * Haal de werkindeling op voor het actieve seizoen, of maak hem aan.
 * Retourneert altijd een werkindeling (auto-create als nodig).
 */
export async function getOfMaakWerkindelingVoorSeizoen(auteur = "systeem") {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return null;

  const bestaand = await getWerkindeling(blauwdruk.id);
  if (bestaand) return bestaand;

  await maakWerkindelingAan(blauwdruk.id, auteur);
  return getWerkindeling(blauwdruk.id);
}

/**
 * Haal de werkindeling op voor het actieve seizoen.
 * Retourneert de werkindeling met teams-samenvatting, of null.
 */
export async function getWerkindelingVoorSeizoen() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return null;
  return getWerkindeling(blauwdruk.id);
}

/**
 * Haal alleen het werkindeling-ID op voor het actieve seizoen.
 */
export async function getWerkindelingIdVoorSeizoen(): Promise<string | null> {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return null;
  return getWerkindelingId(blauwdruk.id);
}
