"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export async function getMijlpalen() {
  const seizoen = await getActiefSeizoen();
  return prisma.mijlpaal.findMany({
    where: { seizoen },
    orderBy: { volgorde: "asc" },
  });
}

export async function getWerkindelingOverzicht() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.kaders.findFirst({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return [];

  return prisma.werkindeling.findMany({
    where: { kadersId: blauwdruk.id, verwijderdOp: null },
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
