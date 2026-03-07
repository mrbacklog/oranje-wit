/**
 * Helpers voor SelectieGroep-aware operaties in AI tools.
 * Teams kunnen in een SelectieGroep zitten — dan staan spelers op SelectieSpeler i.p.v. TeamSpeler.
 */

import { prisma, anyTeam } from "@/lib/db/prisma";

type SelectieGroepId = { selectieGroepId: string | null };

/** Haal selectieGroepId op voor een team */
export async function getTeamSelectie(teamId: string): Promise<SelectieGroepId> {
  return (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { selectieGroepId: true },
  })) as SelectieGroepId;
}

/** Verzamel alle ingedeelde speler-IDs in een versie (TeamSpeler + SelectieSpeler) */
export async function getAlleIngedeeldIds(versieId: string): Promise<Set<string>> {
  const [teamIngedeeld, selectieIngedeeld] = await Promise.all([
    prisma.teamSpeler.findMany({
      where: { team: { versieId } },
      select: { spelerId: true },
    }),
    prisma.selectieSpeler.findMany({
      where: { selectieGroep: { versieId } },
      select: { spelerId: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const ts of teamIngedeeld) ids.add(ts.spelerId);
  for (const ss of selectieIngedeeld) ids.add(ss.spelerId);
  return ids;
}

/** Voeg speler toe aan team of selectie (afhankelijk van selectieGroepId) */
export async function plaatsSpeler(
  teamId: string,
  spelerId: string,
  selectieGroepId: string | null
) {
  if (selectieGroepId) {
    await prisma.selectieSpeler.create({
      data: { selectieGroepId, spelerId },
    });
  } else {
    await prisma.teamSpeler.create({ data: { teamId, spelerId } });
  }
}

/** Verwijder speler uit team of selectie */
export async function verwijderSpeler(
  teamId: string,
  spelerId: string,
  selectieGroepId: string | null
) {
  if (selectieGroepId) {
    await prisma.selectieSpeler.deleteMany({
      where: { selectieGroepId, spelerId },
    });
  } else {
    await prisma.teamSpeler.deleteMany({ where: { teamId, spelerId } });
  }
}

/** Verplaats speler van bron naar doel (selectie-aware, in transactie) */
export async function verplaatsSpeler(
  vanTeamId: string,
  naarTeamId: string,
  spelerId: string,
  vanSelectie: string | null,
  naarSelectie: string | null
) {
  await prisma.$transaction(async (tx: any) => {
    if (vanSelectie) {
      await tx.selectieSpeler.deleteMany({
        where: { selectieGroepId: vanSelectie, spelerId },
      });
    } else {
      await tx.teamSpeler.deleteMany({
        where: { teamId: vanTeamId, spelerId },
      });
    }
    if (naarSelectie) {
      await tx.selectieSpeler.create({
        data: { selectieGroepId: naarSelectie, spelerId },
      });
    } else {
      await tx.teamSpeler.create({
        data: { teamId: naarTeamId, spelerId },
      });
    }
  });
}

/** Batch-plaats spelers in team of selectie */
export async function batchPlaatsSpelers(
  teamId: string,
  spelerIds: string[],
  selectieGroepId: string | null
) {
  if (selectieGroepId) {
    await prisma.selectieSpeler.createMany({
      data: spelerIds.map((id) => ({ selectieGroepId: selectieGroepId!, spelerId: id })),
      skipDuplicates: true,
    });
  } else {
    await prisma.teamSpeler.createMany({
      data: spelerIds.map((id) => ({ teamId, spelerId: id })),
      skipDuplicates: true,
    });
  }
}
