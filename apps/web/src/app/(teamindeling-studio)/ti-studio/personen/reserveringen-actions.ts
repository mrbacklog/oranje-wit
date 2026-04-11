"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

export async function getReserveringenVoorStudio() {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  if (!kaders) return [];

  const werkindeling = await prisma.werkindeling.findFirst({
    where: { kadersId: kaders.id, status: "ACTIEF" },
    select: {
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  const versieId = werkindeling?.versies?.[0]?.id;
  if (!versieId) return [];

  return prisma.plaatsreservering.findMany({
    where: { team: { versieId } },
    select: {
      id: true,
      naam: true,
      geslacht: true,
      teamId: true,
      team: { select: { naam: true, kleur: true } },
    },
    orderBy: { naam: "asc" },
  });
}

export type StudioReservering = Awaited<ReturnType<typeof getReserveringenVoorStudio>>[number];

export async function maakReserveringAan(data: {
  naam: string;
  geslacht?: string;
  teamId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.plaatsreservering.create({
      data: { naam: data.naam, geslacht: data.geslacht ?? null, teamId: data.teamId },
    });
    revalidatePath("/ti-studio/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("maakReserveringAan mislukt:", err);
    return { ok: false, error: "Kon reservering niet aanmaken" };
  }
}
