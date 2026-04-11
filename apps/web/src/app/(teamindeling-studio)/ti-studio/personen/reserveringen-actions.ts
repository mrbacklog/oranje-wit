"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

export async function getReserveringenVoorStudio() {
  await requireTC();
  return prisma.reserveringsspeler.findMany({
    select: {
      id: true,
      titel: true,
      geslacht: true,
      teamId: true,
      team: { select: { naam: true, kleur: true } },
    },
    orderBy: { titel: "asc" },
  });
}

export type StudioReservering = Awaited<ReturnType<typeof getReserveringenVoorStudio>>[number];

export async function maakReserveringAan(data: {
  titel: string;
  geslacht: "M" | "V";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.reserveringsspeler.create({
      data: { titel: data.titel, geslacht: data.geslacht },
    });
    revalidatePath("/ti-studio/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("maakReserveringAan mislukt:", err);
    return { ok: false, error: "Kon reservering niet aanmaken" };
  }
}
