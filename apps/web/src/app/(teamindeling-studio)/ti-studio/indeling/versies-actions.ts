"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

export async function verwijderVersie(
  versieId: string
): Promise<{ ok: true } | { ok: false; fout: string }> {
  await requireTC();

  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: { werkindelingId: true, nummer: true },
  });

  const aantalVersies = await prisma.versie.count({
    where: { werkindelingId: versie.werkindelingId },
  });

  if (aantalVersies <= 1) {
    return { ok: false, fout: "De laatste versie kan niet verwijderd worden." };
  }

  await prisma.versie.delete({ where: { id: versieId } });
  logger.info(`Versie ${versieId} (v${versie.nummer}) hard verwijderd`);
  revalidatePath("/ti-studio/indeling");
  return { ok: true };
}

export async function herstelVersie(
  versieId: string,
  auteur: string
): Promise<{ nieuweVersieId: string }> {
  await requireTC();

  const oudeVersie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    include: {
      teams: {
        include: {
          spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
          staf: { select: { stafId: true, rol: true, notitie: true } },
        },
        orderBy: { volgorde: "asc" },
      },
    },
  });

  const hoogsteVersie = await prisma.versie.findFirst({
    where: { werkindelingId: oudeVersie.werkindelingId },
    orderBy: { nummer: "desc" },
    select: { nummer: true },
  });
  const volgendNummer = (hoogsteVersie?.nummer ?? 0) + 1;

  const nieuweVersie = await prisma.versie.create({
    data: {
      werkindelingId: oudeVersie.werkindelingId,
      nummer: volgendNummer,
      naam: `Hersteld van v${oudeVersie.nummer}`,
      auteur,
      posities: oudeVersie.posities ?? undefined,
      teams: {
        create: oudeVersie.teams.map((t: any) => ({
          naam: t.naam,
          alias: t.alias,
          categorie: t.categorie,
          kleur: t.kleur,
          teamType: t.teamType,
          niveau: t.niveau,
          volgorde: t.volgorde,
          spelers: { create: t.spelers },
          staf: { create: t.staf },
        })),
      },
    },
    select: { id: true },
  });

  logger.info(`Versie ${versieId} hersteld als v${volgendNummer}`);
  revalidatePath("/ti-studio/indeling");
  return { nieuweVersieId: nieuweVersie.id };
}
