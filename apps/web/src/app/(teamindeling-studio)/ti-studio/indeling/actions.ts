"use server";

import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindeling, getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import { prisma } from "@/lib/teamindeling/db/prisma";

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
 * Check of er een werkindeling bestaat voor het actieve seizoen.
 * Retourneert het scenario-ID of null.
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
