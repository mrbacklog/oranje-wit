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
      where: { actief: true },
      select: { id: true, naam: true, geboortejaar: true },
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
    geboortejaar: s.geboortejaar as number | null,
    gepind: gepindSet.has(s.id),
    teams: teamMap.get(s.id) ?? [],
  }));
}

export type StudioStaf = Awaited<ReturnType<typeof getStafVoorStudio>>[number];

export async function getAlleStafVoorBeheer() {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  const [stafLeden, teamStafKoppelingen, pins, openMemoWerkitems] = await Promise.all([
    prisma.staf.findMany({
      select: { id: true, naam: true, geboortejaar: true, actief: true },
      orderBy: { naam: "asc" },
    }),
    prisma.teamStaf.findMany({
      select: {
        stafId: true,
        rol: true,
        team: { select: { id: true, naam: true, kleur: true, volgorde: true } },
      },
    }),
    kaders
      ? prisma.pin.findMany({
          where: { kadersId: kaders.id, stafId: { not: null } },
          select: { stafId: true },
        })
      : Promise.resolve([]),
    prisma.werkitem.findMany({
      where: {
        stafId: { not: null },
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
      select: { stafId: true },
    }),
  ]);

  const gepindSet = new Set(pins.map((p) => p.stafId).filter(Boolean) as string[]);

  const memoCountMap = new Map<string, number>();
  for (const w of openMemoWerkitems) {
    if (!w.stafId) continue;
    memoCountMap.set(w.stafId, (memoCountMap.get(w.stafId) ?? 0) + 1);
  }

  const teamMap = new Map<
    string,
    { teamId: string; teamNaam: string; kleur: string; rol: string; volgorde: number }[]
  >();
  for (const k of teamStafKoppelingen) {
    const bestaande = teamMap.get(k.stafId) ?? [];
    bestaande.push({
      teamId: k.team.id,
      teamNaam: k.team.naam,
      kleur: k.team.kleur ?? "ONBEKEND",
      rol: k.rol,
      volgorde: k.team.volgorde ?? 9999,
    });
    teamMap.set(k.stafId, bestaande);
  }

  return stafLeden.map((s) => ({
    id: s.id,
    naam: s.naam,
    geboortejaar: s.geboortejaar as number | null,
    actief: s.actief,
    gepind: gepindSet.has(s.id),
    openMemoCount: memoCountMap.get(s.id) ?? 0,
    teams: (teamMap.get(s.id) ?? []).sort((a, b) => a.volgorde - b.volgorde),
  }));
}

/**
 * Haalt alle teams op die in een team-rol gekoppeld kunnen worden aan stafleden.
 * We gebruiken teams uit de laatste actieve werkindeling-versie van het werkseizoen.
 */
export async function getTeamsVoorStafKoppeling(): Promise<
  { id: string; naam: string; kleur: string | null; volgorde: number }[]
> {
  await requireTC();

  // TeamStaf hangt aan Team records die in Versies zitten.
  // We laten alle teams zien (niet alleen werkseizoen) zodat bestaande
  // koppelingen werken; sorteer op volgorde.
  const teams = await prisma.team.findMany({
    select: { id: true, naam: true, kleur: true, volgorde: true },
    orderBy: [{ volgorde: "asc" }, { naam: "asc" }],
  });
  return teams.map((t) => ({
    id: t.id,
    naam: t.naam,
    kleur: t.kleur ?? null,
    volgorde: t.volgorde ?? 9999,
  }));
}

export async function voegStafAanTeamToe(
  stafId: string,
  teamId: string,
  rol: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const schoneRol = rol.trim();
    if (!schoneRol) return { ok: false, error: "Rol mag niet leeg zijn" };
    await prisma.teamStaf.upsert({
      where: { teamId_stafId: { teamId, stafId } },
      create: { teamId, stafId, rol: schoneRol },
      update: { rol: schoneRol },
    });
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("voegStafAanTeamToe mislukt:", err);
    return { ok: false, error: "Kon staflid niet aan team toevoegen" };
  }
}

export async function verwijderStafUitTeam(
  stafId: string,
  teamId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.teamStaf.deleteMany({ where: { stafId, teamId } });
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("verwijderStafUitTeam mislukt:", err);
    return { ok: false, error: "Kon staflid niet uit team verwijderen" };
  }
}

export async function updateStafRol(
  stafId: string,
  teamId: string,
  rol: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const schoneRol = rol.trim();
    if (!schoneRol) return { ok: false, error: "Rol mag niet leeg zijn" };
    await prisma.teamStaf.updateMany({
      where: { stafId, teamId },
      data: { rol: schoneRol },
    });
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("updateStafRol mislukt:", err);
    return { ok: false, error: "Kon rol niet bijwerken" };
  }
}

export type BeheerStaf = Awaited<ReturnType<typeof getAlleStafVoorBeheer>>[number];

export async function setStafActief(
  stafId: string,
  actief: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.staf.update({
      where: { id: stafId },
      data: { actief },
    });
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("setStafActief mislukt:", err);
    return { ok: false, error: "Kon status niet bijwerken" };
  }
}

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
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("maakStafAan mislukt:", err);
    return { ok: false, error: "Kon staflid niet aanmaken" };
  }
}
