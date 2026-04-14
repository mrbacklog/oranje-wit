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

type VersieDoelTeam = {
  id: string;
  naam: string;
  kleur: string | null;
  volgorde: number | null;
  selectieGroepId: string | null;
};
type VersieDoelSelGroep = {
  id: string;
  naam: string | null;
  gebundeld: boolean;
  teams: { id: string; naam: string; kleur: string | null; volgorde: number | null }[];
};
type VersieMetDoelen = {
  id: string;
  teams: VersieDoelTeam[];
  selectieGroepen: VersieDoelSelGroep[];
};

/**
 * Haalt de actieve werkindeling-versie op met bijbehorende teams + selectiegroepen.
 * Intern hergebruikt door meerdere staf-acties.
 */
async function getActieveVersieMetDoelen(): Promise<VersieMetDoelen | null> {
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });
  if (!kaders) return null;
  const werkindeling = await prisma.werkindeling.findFirst({
    where: { kadersId: kaders.id, status: "ACTIEF" },
    select: {
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          id: true,
          teams: {
            select: {
              id: true,
              naam: true,
              kleur: true,
              volgorde: true,
              selectieGroepId: true,
            },
            orderBy: { volgorde: "asc" },
          },
          selectieGroepen: {
            select: {
              id: true,
              naam: true,
              gebundeld: true,
              teams: {
                select: { id: true, naam: true, kleur: true, volgorde: true },
                orderBy: { volgorde: "asc" },
              },
            },
          },
        },
      },
    },
  });
  return (werkindeling?.versies?.[0] as VersieMetDoelen | undefined) ?? null;
}

export async function getAlleStafVoorBeheer() {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  const versie = await getActieveVersieMetDoelen();
  const teamIdsInVersie: string[] = versie?.teams.map((t: VersieDoelTeam) => t.id) ?? [];
  const selectieGroepIdsInVersie: string[] =
    versie?.selectieGroepen.map((sg: VersieDoelSelGroep) => sg.id) ?? [];
  const gebundeldeGroepIds = new Set<string>(
    versie?.selectieGroepen
      .filter((sg: VersieDoelSelGroep) => sg.gebundeld)
      .map((sg: VersieDoelSelGroep) => sg.id) ?? []
  );

  const [stafLeden, teamStafKoppelingen, selectieStafKoppelingen, pins, openMemoWerkitems] =
    await Promise.all([
      prisma.staf.findMany({
        select: { id: true, naam: true, geboortejaar: true, actief: true },
        orderBy: { naam: "asc" },
      }),
      prisma.teamStaf.findMany({
        where: { teamId: { in: teamIdsInVersie } },
        select: {
          stafId: true,
          rol: true,
          team: {
            select: {
              id: true,
              naam: true,
              kleur: true,
              volgorde: true,
              selectieGroepId: true,
            },
          },
        },
      }),
      prisma.selectieStaf.findMany({
        where: { selectieGroepId: { in: selectieGroepIdsInVersie } },
        select: {
          stafId: true,
          rol: true,
          selectieGroep: {
            select: {
              id: true,
              naam: true,
              gebundeld: true,
              teams: {
                select: { naam: true, kleur: true, volgorde: true },
                orderBy: { volgorde: "asc" },
              },
            },
          },
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

  type StafDoel = {
    doelId: string;
    doelType: "team" | "selectie";
    naam: string;
    kleur: string;
    rol: string;
    volgorde: number;
    // Legacy aliassen voor bestaande UI
    teamId: string;
    teamNaam: string;
  };
  const doelenMap = new Map<string, StafDoel[]>();

  // Teams — filter teams die in een gebundelde selectie zitten (die hangen op selectie-niveau)
  for (const k of teamStafKoppelingen) {
    if (k.team.selectieGroepId && gebundeldeGroepIds.has(k.team.selectieGroepId)) continue;
    const bestaande = doelenMap.get(k.stafId) ?? [];
    bestaande.push({
      doelId: k.team.id,
      doelType: "team",
      naam: k.team.naam,
      kleur: k.team.kleur ?? "ONBEKEND",
      rol: k.rol,
      volgorde: k.team.volgorde ?? 9999,
      teamId: k.team.id,
      teamNaam: k.team.naam,
    });
    doelenMap.set(k.stafId, bestaande);
  }

  // Selecties met gebundelde pool — alleen deze tellen als target
  for (const k of selectieStafKoppelingen) {
    if (!k.selectieGroep.gebundeld) continue;
    const bestaande = doelenMap.get(k.stafId) ?? [];
    const naam =
      k.selectieGroep.naam ??
      k.selectieGroep.teams.map((t: { naam: string }) => t.naam).join(" + ");
    const kleur = k.selectieGroep.teams[0]?.kleur ?? "ONBEKEND";
    const volgorde = k.selectieGroep.teams[0]?.volgorde ?? 9999;
    bestaande.push({
      doelId: k.selectieGroep.id,
      doelType: "selectie",
      naam,
      kleur,
      rol: k.rol,
      volgorde,
      teamId: k.selectieGroep.id,
      teamNaam: naam,
    });
    doelenMap.set(k.stafId, bestaande);
  }

  return stafLeden.map((s) => ({
    id: s.id,
    naam: s.naam,
    geboortejaar: s.geboortejaar as number | null,
    actief: s.actief,
    gepind: gepindSet.has(s.id),
    openMemoCount: memoCountMap.get(s.id) ?? 0,
    teams: (doelenMap.get(s.id) ?? []).sort((a, b) => a.volgorde - b.volgorde),
  }));
}

/**
 * Haalt alle indelingsdoelen op waar stafleden aan gekoppeld kunnen worden:
 * - Teams zonder gebundelde selectie
 * - Selectiegroepen mét gebundelde pool
 * Bepaald t.o.v. de actieve werkindeling-versie van het werkseizoen.
 */
export async function getDoelenVoorStafKoppeling(): Promise<
  {
    id: string;
    naam: string;
    kleur: string | null;
    volgorde: number;
    type: "team" | "selectie";
  }[]
> {
  await requireTC();

  const versie = await getActieveVersieMetDoelen();
  if (!versie) return [];

  const gebundeldeGroepIds = new Set<string>(
    versie.selectieGroepen
      .filter((sg: VersieDoelSelGroep) => sg.gebundeld)
      .map((sg: VersieDoelSelGroep) => sg.id)
  );

  const teams = versie.teams
    .filter((t: VersieDoelTeam) => !t.selectieGroepId || !gebundeldeGroepIds.has(t.selectieGroepId))
    .map((t: VersieDoelTeam) => ({
      id: t.id,
      naam: t.naam,
      kleur: t.kleur ?? null,
      volgorde: t.volgorde ?? 9999,
      type: "team" as const,
    }));

  const selecties = versie.selectieGroepen
    .filter((sg: VersieDoelSelGroep) => sg.gebundeld && sg.teams.length > 0)
    .map((sg: VersieDoelSelGroep) => ({
      id: sg.id,
      naam: sg.naam ?? sg.teams.map((t: { naam: string }) => t.naam).join(" + "),
      kleur: sg.teams[0]?.kleur ?? null,
      volgorde: sg.teams[0]?.volgorde ?? 9999,
      type: "selectie" as const,
    }));

  return [...teams, ...selecties].sort((a, b) => a.volgorde - b.volgorde);
}

export async function voegStafAanDoelToe(
  stafId: string,
  doel: { id: string; type: "team" | "selectie" },
  rol: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const schoneRol = rol.trim();
    if (!schoneRol) return { ok: false, error: "Rol mag niet leeg zijn" };
    if (doel.type === "team") {
      await prisma.teamStaf.upsert({
        where: { teamId_stafId: { teamId: doel.id, stafId } },
        create: { teamId: doel.id, stafId, rol: schoneRol },
        update: { rol: schoneRol },
      });
    } else {
      await prisma.selectieStaf.upsert({
        where: { selectieGroepId_stafId: { selectieGroepId: doel.id, stafId } },
        create: { selectieGroepId: doel.id, stafId, rol: schoneRol },
        update: { rol: schoneRol },
      });
    }
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("voegStafAanDoelToe mislukt:", err);
    return { ok: false, error: "Kon staflid niet aan team/selectie toevoegen" };
  }
}

export async function verwijderStafUitDoel(
  stafId: string,
  doel: { id: string; type: "team" | "selectie" }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    if (doel.type === "team") {
      await prisma.teamStaf.deleteMany({ where: { stafId, teamId: doel.id } });
    } else {
      await prisma.selectieStaf.deleteMany({
        where: { stafId, selectieGroepId: doel.id },
      });
    }
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("verwijderStafUitDoel mislukt:", err);
    return { ok: false, error: "Kon staflid niet uit team/selectie verwijderen" };
  }
}

export async function updateStafRolOpDoel(
  stafId: string,
  doel: { id: string; type: "team" | "selectie" },
  rol: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const schoneRol = rol.trim();
    if (!schoneRol) return { ok: false, error: "Rol mag niet leeg zijn" };
    if (doel.type === "team") {
      await prisma.teamStaf.updateMany({
        where: { stafId, teamId: doel.id },
        data: { rol: schoneRol },
      });
    } else {
      await prisma.selectieStaf.updateMany({
        where: { stafId, selectieGroepId: doel.id },
        data: { rol: schoneRol },
      });
    }
    revalidatePath("/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("updateStafRolOpDoel mislukt:", err);
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
