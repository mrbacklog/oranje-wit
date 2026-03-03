"use server";

import { prisma } from "@/lib/db/prisma";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import { revalidatePath } from "next/cache";
import { assertBewerkbaar } from "@/lib/seizoen";

/**
 * Guard: controleer of het team bij een bewerkbaar seizoen hoort.
 */
async function assertTeamBewerkbaar(teamId: string) {
  const team = await prisma.team.findUniqueOrThrow({
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
  });
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
  await prisma.team.update({
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
 * Verwijder een team.
 */
export async function deleteTeam(teamId: string) {
  await assertTeamBewerkbaar(teamId);
  // Ontkoppel eerst eventuele selectie-leden die naar dit team verwijzen
  await prisma.team.updateMany({
    where: { selectieGroepId: teamId },
    data: { selectieGroepId: null },
  });
  await prisma.team.delete({
    where: { id: teamId },
  });
  revalidatePath("/scenarios");
}

/**
 * Koppel teams als selectie. Eerste team wordt de "groep leider".
 * Alle spelers en staf van lid-teams worden samengevoegd naar de leider (pool).
 */
export async function koppelSelectie(teamIds: string[]) {
  if (teamIds.length < 2) return;
  const [leiderId, ...restIds] = teamIds;

  await prisma.$transaction(async (tx) => {
    // 1. Koppel teams
    await tx.team.updateMany({
      where: { id: { in: restIds } },
      data: { selectieGroepId: leiderId },
    });

    // 2. Verplaats spelers van lid-teams naar leider
    const bestaandeSpelers = await tx.teamSpeler.findMany({
      where: { teamId: leiderId },
      select: { spelerId: true },
    });
    const bestaandSpelerSet = new Set(bestaandeSpelers.map((s) => s.spelerId));

    // Verwijder duplicaten (speler die al in leider zit)
    if (bestaandSpelerSet.size > 0) {
      await tx.teamSpeler.deleteMany({
        where: {
          teamId: { in: restIds },
          spelerId: { in: Array.from(bestaandSpelerSet) },
        },
      });
    }

    // Verplaats rest naar leider
    await tx.teamSpeler.updateMany({
      where: { teamId: { in: restIds } },
      data: { teamId: leiderId },
    });

    // 3. Zelfde voor staf
    const bestaandeStaf = await tx.teamStaf.findMany({
      where: { teamId: leiderId },
      select: { stafId: true },
    });
    const bestaandStafSet = new Set(bestaandeStaf.map((s) => s.stafId));

    if (bestaandStafSet.size > 0) {
      await tx.teamStaf.deleteMany({
        where: {
          teamId: { in: restIds },
          stafId: { in: Array.from(bestaandStafSet) },
        },
      });
    }

    await tx.teamStaf.updateMany({
      where: { teamId: { in: restIds } },
      data: { teamId: leiderId },
    });
  });

  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie (simpel — alle spelers/staf blijven bij leider).
 */
export async function ontkoppelSelectie(groepLeiderId: string) {
  await prisma.team.updateMany({
    where: { selectieGroepId: groepLeiderId },
    data: { selectieGroepId: null },
  });
  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie met speler- en stafverdeling.
 * Spelers worden verdeeld over de teams.
 * Staf met key "alle" wordt gedupliceerd naar elk team.
 */
export async function ontkoppelSelectieMetVerdeling(
  groepLeiderId: string,
  spelerVerdeling: Record<string, string[]>,
  stafVerdeling: Record<string, string[]>,
  alleTeamIds: string[]
) {
  await assertTeamBewerkbaar(groepLeiderId);

  await prisma.$transaction(async (tx) => {
    // 1. Verplaats spelers volgens verdeling
    for (const [teamId, spelerIds] of Object.entries(spelerVerdeling)) {
      if (teamId === groepLeiderId) continue;
      for (const spelerId of spelerIds) {
        await tx.teamSpeler.updateMany({
          where: { teamId: groepLeiderId, spelerId },
          data: { teamId },
        });
      }
    }

    // 2. Verplaats/dupliceer staf volgens verdeling
    for (const [teamIdOrAlle, stafIds] of Object.entries(stafVerdeling)) {
      if (teamIdOrAlle === "alle") {
        // Staf bij alle teams → dupliceer naar elk team (behalve leider)
        for (const stafId of stafIds) {
          const bestaand = await tx.teamStaf.findFirst({
            where: { teamId: groepLeiderId, stafId },
            select: { rol: true },
          });
          if (!bestaand) continue;
          for (const tid of alleTeamIds) {
            if (tid === groepLeiderId) continue;
            await tx.teamStaf.upsert({
              where: { teamId_stafId: { teamId: tid, stafId } },
              create: { teamId: tid, stafId, rol: bestaand.rol },
              update: {},
            });
          }
        }
      } else if (teamIdOrAlle !== groepLeiderId) {
        // Staf naar specifiek team → verplaats
        for (const stafId of stafIds) {
          await tx.teamStaf.updateMany({
            where: { teamId: groepLeiderId, stafId },
            data: { teamId: teamIdOrAlle },
          });
        }
      }
    }

    // 3. Ontkoppel de teams
    await tx.team.updateMany({
      where: { selectieGroepId: groepLeiderId },
      data: { selectieGroepId: null },
    });
  });

  revalidatePath("/scenarios");
}
