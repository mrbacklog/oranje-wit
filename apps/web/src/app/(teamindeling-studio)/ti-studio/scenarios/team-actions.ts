"use server";

import { prisma, anyTeam } from "@/lib/teamindeling/db/prisma";
import type { TeamCategorie, Kleur, TeamType } from "@oranje-wit/database";
import { revalidatePath } from "next/cache";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";

/**
 * Guard: controleer of het team bij een bewerkbaar seizoen hoort.
 */
async function assertTeamBewerkbaar(teamId: string) {
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      versie: {
        select: {
          scenario: {
            select: { concept: { select: { blauwdruk: { select: { seizoen: true } } } } },
          },
        },
      },
    },
  })) as { versie: { scenario: { concept: { blauwdruk: { seizoen: string } } } } };
  await assertBewerkbaar(team.versie.scenario.concept.blauwdruk.seizoen);
}

/**
 * Werk een team bij (alias, categorie, kleur, naam).
 */
export async function updateTeam(
  teamId: string,
  data: { alias?: string | null; categorie?: TeamCategorie; kleur?: Kleur | null; naam?: string }
) {
  await assertTeamBewerkbaar(teamId);
  await anyTeam.update({
    where: { id: teamId },
    data: {
      ...(data.alias !== undefined && { alias: data.alias }),
      ...(data.categorie !== undefined && { categorie: data.categorie }),
      ...(data.kleur !== undefined && { kleur: data.kleur }),
      ...(data.naam !== undefined && { naam: data.naam }),
    },
  });
  revalidatePath("/scenarios");
}

/**
 * Stel het teamtype in (VIERTAL, ACHTTAL of null = standaard 8-tal).
 */
export async function updateTeamType(teamId: string, teamType: TeamType | null) {
  await assertTeamBewerkbaar(teamId);
  await anyTeam.update({
    where: { id: teamId },
    data: { teamType },
  });
  revalidatePath("/scenarios");
}

/**
 * Verwijder een team.
 */
export async function deleteTeam(teamId: string) {
  await assertTeamBewerkbaar(teamId);
  // Als team in een selectie zit: haal het eruit
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { selectieGroepId: true },
  })) as { selectieGroepId: string | null };

  if (team.selectieGroepId) {
    await anyTeam.update({
      where: { id: teamId },
      data: { selectieGroepId: null },
    });
    // Check of er nog andere teams in de selectie zitten
    const remaining = await anyTeam.count({
      where: { selectieGroepId: team.selectieGroepId },
    });
    if (remaining < 2) {
      // Nog maar 1 team → selectie opheffen (verdeel spelers naar dat team)
      const lastTeam = (await anyTeam.findFirst({
        where: { selectieGroepId: team.selectieGroepId },
        select: { id: true },
      })) as { id: string } | null;
      if (lastTeam) {
        // Verplaats selectie-spelers naar het overgebleven team
        const selSpelers = await prisma.selectieSpeler.findMany({
          where: { selectieGroepId: team.selectieGroepId },
        });
        for (const sp of selSpelers) {
          await prisma.teamSpeler.create({
            data: {
              teamId: lastTeam.id,
              spelerId: sp.spelerId,
              statusOverride: sp.statusOverride,
              notitie: sp.notitie,
            },
          });
        }
        const selStaf = await prisma.selectieStaf.findMany({
          where: { selectieGroepId: team.selectieGroepId },
        });
        for (const st of selStaf) {
          await prisma.teamStaf.create({
            data: { teamId: lastTeam.id, stafId: st.stafId, rol: st.rol },
          });
        }
        await anyTeam.update({
          where: { id: lastTeam.id },
          data: { selectieGroepId: null },
        });
      }
      await prisma.selectieGroep.delete({ where: { id: team.selectieGroepId } });
    }
  }
  await anyTeam.delete({ where: { id: teamId } });
  revalidatePath("/scenarios");
}

/**
 * Koppel teams als selectie. Maak een SelectieGroep aan en verplaats
 * alle spelers en staf van de teams naar de selectie.
 */
export async function koppelSelectie(teamIds: string[]) {
  if (teamIds.length !== 2) return;

  // Haal versieId op van eerste team
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamIds[0] },
    select: { versieId: true },
  })) as { versieId: string };

  await prisma.$transaction(async (tx) => {
    // 1. Maak SelectieGroep aan
    const groep = await tx.selectieGroep.create({
      data: { versieId: team.versieId },
    });

    // 2. Koppel alle teams aan de groep
    await tx.team.updateMany({
      where: { id: { in: teamIds } },
      data: { selectieGroepId: groep.id },
    });

    // 3. Verplaats alle spelers van teams naar SelectieSpeler
    for (const teamId of teamIds) {
      const spelers = await tx.teamSpeler.findMany({
        where: { teamId },
        select: { spelerId: true, statusOverride: true, notitie: true },
      });
      for (const sp of spelers) {
        await tx.selectieSpeler.upsert({
          where: {
            selectieGroepId_spelerId: {
              selectieGroepId: groep.id,
              spelerId: sp.spelerId,
            },
          },
          create: {
            selectieGroepId: groep.id,
            spelerId: sp.spelerId,
            statusOverride: sp.statusOverride,
            notitie: sp.notitie,
          },
          update: {},
        });
      }
      await tx.teamSpeler.deleteMany({ where: { teamId } });
    }

    // 4. Zelfde voor staf
    for (const teamId of teamIds) {
      const staf = await tx.teamStaf.findMany({
        where: { teamId },
        select: { stafId: true, rol: true },
      });
      for (const st of staf) {
        await tx.selectieStaf.upsert({
          where: {
            selectieGroepId_stafId: {
              selectieGroepId: groep.id,
              stafId: st.stafId,
            },
          },
          create: {
            selectieGroepId: groep.id,
            stafId: st.stafId,
            rol: st.rol,
          },
          update: {},
        });
      }
      await tx.teamStaf.deleteMany({ where: { teamId } });
    }
  });

  revalidatePath("/scenarios");
}

/**
 * Werk de naam van een selectiegroep bij.
 */
export async function updateSelectieNaam(groepId: string, naam: string | null) {
  await prisma.selectieGroep.update({
    where: { id: groepId },
    data: { naam: naam || null },
  });
  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie (simpel — spelers gaan verloren).
 */
export async function ontkoppelSelectie(groepId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.team.updateMany({
      where: { selectieGroepId: groepId },
      data: { selectieGroepId: null },
    });
    await tx.selectieGroep.delete({ where: { id: groepId } });
    // CASCADE verwijdert SelectieSpeler/SelectieStaf automatisch
  });
  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie met speler- en stafverdeling.
 * Spelers worden verdeeld over de teams.
 * Staf met key "alle" wordt gedupliceerd naar elk team.
 */
export async function ontkoppelSelectieMetVerdeling(
  groepId: string,
  spelerVerdeling: Record<string, string[]>,
  stafVerdeling: Record<string, string[]>,
  alleTeamIds: string[]
) {
  await prisma.$transaction(async (tx) => {
    // 1. Haal selectie-spelers op (met statusOverride/notitie)
    const selSpelers = await tx.selectieSpeler.findMany({
      where: { selectieGroepId: groepId },
    });
    const spelerMap = new Map(selSpelers.map((s) => [s.spelerId, s]));

    // 2. Verdeel spelers over teams
    for (const [teamId, spelerIds] of Object.entries(spelerVerdeling)) {
      for (const spelerId of spelerIds) {
        const sel = spelerMap.get(spelerId);
        await tx.teamSpeler.create({
          data: {
            teamId,
            spelerId,
            statusOverride: sel?.statusOverride ?? null,
            notitie: sel?.notitie ?? null,
          },
        });
      }
    }

    // 3. Verdeel staf over teams
    const selStaf = await tx.selectieStaf.findMany({
      where: { selectieGroepId: groepId },
    });
    const stafMap = new Map(selStaf.map((s) => [s.stafId, s]));

    for (const [teamIdOrAlle, stafIds] of Object.entries(stafVerdeling)) {
      if (teamIdOrAlle === "alle") {
        for (const stafId of stafIds) {
          const sel = stafMap.get(stafId);
          if (!sel) continue;
          for (const tid of alleTeamIds) {
            await tx.teamStaf.upsert({
              where: { teamId_stafId: { teamId: tid, stafId } },
              create: { teamId: tid, stafId, rol: sel.rol },
              update: {},
            });
          }
        }
      } else {
        for (const stafId of stafIds) {
          const sel = stafMap.get(stafId);
          if (!sel) continue;
          await tx.teamStaf.create({
            data: { teamId: teamIdOrAlle, stafId, rol: sel.rol },
          });
        }
      }
    }

    // 4. Ontkoppel teams + verwijder SelectieGroep (cascade verwijdert SelectieSpeler/Staf)
    await tx.team.updateMany({
      where: { selectieGroepId: groepId },
      data: { selectieGroepId: null },
    });
    await tx.selectieGroep.delete({ where: { id: groepId } });
  });

  revalidatePath("/scenarios");
}
