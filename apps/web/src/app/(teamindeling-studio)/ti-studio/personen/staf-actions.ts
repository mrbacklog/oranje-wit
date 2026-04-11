"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

export async function getStafVoorStudio() {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  const [stafLeden, teamStafKoppelingen, pins] = await Promise.all([
    prisma.staf.findMany({
      select: { id: true, naam: true, rollen: true, geboortejaar: true },
      orderBy: { naam: "asc" },
    }),
    prisma.teamStaf.findMany({
      select: {
        stafId: true,
        rol: true,
        team: { select: { id: true, naam: true, kleur: true } },
      },
    }),
    kaders
      ? prisma.pin.findMany({
          where: { kadersId: kaders.id, stafId: { not: null } },
          select: { stafId: true },
        })
      : Promise.resolve([]),
  ]);

  const gepindSet = new Set(pins.map((p) => p.stafId).filter(Boolean) as string[]);

  const teamMap = new Map<
    string,
    { teamId: string; teamNaam: string; kleur: string; rol: string }[]
  >();
  for (const k of teamStafKoppelingen) {
    const bestaande = teamMap.get(k.stafId) ?? [];
    bestaande.push({
      teamId: k.team.id,
      teamNaam: k.team.naam,
      kleur: k.team.kleur ?? "ONBEKEND",
      rol: k.rol,
    });
    teamMap.set(k.stafId, bestaande);
  }

  return stafLeden.map((s) => ({
    id: s.id,
    naam: s.naam,
    rollen: s.rollen as string[],
    geboortejaar: s.geboortejaar as number | null,
    gepind: gepindSet.has(s.id),
    teams: teamMap.get(s.id) ?? [],
  }));
}

export type StudioStaf = Awaited<ReturnType<typeof getStafVoorStudio>>[number];

export async function maakStafAan(data: {
  naam: string;
  rollen?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const stafId = `STAF-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    await prisma.staf.create({
      data: { id: stafId, naam: data.naam, rollen: data.rollen ?? [] },
    });
    revalidatePath("/ti-studio/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("maakStafAan mislukt:", err);
    return { ok: false, error: "Kon staflid niet aanmaken" };
  }
}
