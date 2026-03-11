"use server";

import { prisma } from "./prisma";
import { logger } from "@oranje-wit/types";

type SnapshotReden = "VERWIJDERD" | "HANDMATIG" | "PRE_DEFINITIEF";

/**
 * Maak een JSON-snapshot van een compleet scenario (versies, teams, spelers, staf).
 * Wordt opgeslagen in ScenarioSnapshot voor herstel na verwijdering.
 */
export async function maakScenarioSnapshot(
  scenarioId: string,
  reden: SnapshotReden,
  auteur?: string
): Promise<string> {
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    include: {
      versies: {
        include: {
          teams: {
            include: {
              spelers: true,
              staf: true,
            },
          },
          selectieGroepen: {
            include: {
              spelers: true,
              staf: true,
            },
          },
          logItems: true,
        },
        orderBy: { nummer: "desc" },
      },
      werkitems: {
        include: {
          actiepunten: true,
        },
      },
    },
  });

  // Tel teams en spelers over alle versies
  let aantalTeams = 0;
  let aantalSpelers = 0;
  for (const versie of scenario.versies) {
    aantalTeams += versie.teams?.length ?? 0;
    for (const team of versie.teams ?? []) {
      aantalSpelers += team.spelers?.length ?? 0;
    }
  }

  const snapshot = await prisma.scenarioSnapshot.create({
    data: {
      scenarioId,
      naam: scenario.naam,
      reden,
      data: JSON.parse(JSON.stringify(scenario)),
      aantalTeams,
      aantalSpelers,
      auteur,
    },
  });

  logger.info(
    `[snapshot] ${reden}: scenario "${scenario.naam}" (${aantalTeams} teams, ${aantalSpelers} spelers)`
  );

  return snapshot.id;
}
