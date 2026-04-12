"use server";

import { prisma } from "./prisma";
import { logger } from "@oranje-wit/types";

type SnapshotReden = "VERWIJDERD" | "HANDMATIG" | "PRE_DEFINITIEF" | "GEMIGREERD";

/**
 * Maak een JSON-snapshot van een volledige werkindeling.
 * Wordt bewaard in werkindeling_snapshots voor herstel of audit.
 */
export async function maakWerkindelingSnapshot(
  werkindelingId: string,
  reden: SnapshotReden,
  auteur?: string
): Promise<string> {
  const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
    where: { id: werkindelingId },
    include: {
      versies: {
        include: {
          teams: { include: { spelers: true, staf: true } },
          selectieGroepen: { include: { spelers: true, staf: true } },
          logItems: true,
        },
        orderBy: { nummer: "desc" },
      },
      werkitems: { include: { actiepunten: true } },
    },
  });

  let aantalTeams = 0;
  let aantalSpelers = 0;
  for (const versie of werkindeling.versies) {
    aantalTeams += versie.teams?.length ?? 0;
    for (const team of versie.teams ?? []) {
      aantalSpelers += team.spelers?.length ?? 0;
    }
  }

  const snapshot = await prisma.werkindelingSnapshot.create({
    data: {
      werkindelingId,
      naam: werkindeling.naam,
      reden,
      data: JSON.parse(JSON.stringify(werkindeling)),
      aantalTeams,
      aantalSpelers,
      auteur,
    },
  });

  logger.info(
    `[snapshot] ${reden}: werkindeling "${werkindeling.naam}" (${aantalTeams} teams, ${aantalSpelers} spelers)`
  );

  return snapshot.id;
}
