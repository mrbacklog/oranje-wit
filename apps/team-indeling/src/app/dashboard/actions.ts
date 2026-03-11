"use server";

import { prisma } from "@/lib/db/prisma";
import { getActiefSeizoen } from "@/lib/seizoen";

export async function getMijlpalen() {
  const seizoen = await getActiefSeizoen();
  return prisma.mijlpaal.findMany({
    where: { seizoen },
    orderBy: { volgorde: "asc" },
  });
}

export async function getScenarioOverzicht() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findFirst({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return [];

  return prisma.scenario.findMany({
    where: { concept: { blauwdrukId: blauwdruk.id } },
    select: {
      id: true,
      naam: true,
      status: true,
      updatedAt: true,
      _count: { select: { versies: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
