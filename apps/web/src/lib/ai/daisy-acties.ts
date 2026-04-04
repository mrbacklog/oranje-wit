/**
 * CRUD voor DaisyActie — audit-log en undo-mechanisme.
 */
import { prisma } from "@/lib/teamindeling/db/prisma";

export interface DaisyActieRecord {
  id: string;
  sessieId: string;
  tool: string;
  doPayload: unknown;
  undoPayload: unknown;
  tijdstip: Date;
  namens: string | null;
  uitgevoerdIn: string;
  ongedaan: boolean;
}

/** Log een uitgevoerde actie. */
export async function logDaisyActie(params: {
  sessieId: string;
  tool: string;
  doPayload: unknown;
  undoPayload: unknown;
  namens?: string;
  uitgevoerdIn: string;
}): Promise<DaisyActieRecord> {
  return prisma.daisyActie.create({
    data: {
      sessieId: params.sessieId,
      tool: params.tool,
      doPayload: params.doPayload as any,
      undoPayload: params.undoPayload as any,
      namens: params.namens ?? null,
      uitgevoerdIn: params.uitgevoerdIn,
    },
  });
}

/** Haal de laatste N niet-ongedane acties op voor een sessie (nieuwste eerst). */
export async function getDaisyActies(sessieId: string, limit = 50): Promise<DaisyActieRecord[]> {
  return prisma.daisyActie.findMany({
    where: { sessieId, ongedaan: false },
    orderBy: { tijdstip: "desc" },
    take: limit,
  });
}

/** Markeer een actie als ongedaan. */
export async function markeerOngedaan(actieId: string): Promise<void> {
  await prisma.daisyActie.update({
    where: { id: actieId },
    data: { ongedaan: true },
  });
}

/** Haal één actie op. */
export async function getDaisyActie(actieId: string): Promise<DaisyActieRecord | null> {
  return prisma.daisyActie.findUnique({ where: { id: actieId } });
}

/**
 * Voer een undo uit op basis van het undoPayload van een actie.
 */
export async function voerUndoUit(actie: DaisyActieRecord): Promise<string> {
  const payload = actie.undoPayload as Record<string, any>;

  switch (actie.tool) {
    case "spelerVerplaatsen": {
      const { spelerId, vanTeamId, naarTeamId, versieId } = payload;
      await prisma.$transaction(async (tx: any) => {
        await tx.teamSpeler.deleteMany({ where: { spelerId, team: { versieId } } });
        if (naarTeamId) {
          await tx.teamSpeler.create({ data: { teamId: naarTeamId, spelerId } });
        }
      });
      return `Speler teruggeplaatst`;
    }

    case "spelerStatusZetten": {
      const { spelerId, status } = payload;
      await prisma.speler.update({ where: { id: spelerId }, data: { status } });
      return `Status hersteld naar ${status}`;
    }

    case "spelerNotitieZetten": {
      const { spelerId, notitie } = payload;
      await prisma.speler.update({
        where: { id: spelerId },
        data: { notitie: notitie ?? null },
      });
      return `Notitie hersteld`;
    }

    case "nieuwLidInBlauwdruk": {
      const { spelerId } = payload;
      await prisma.speler.delete({ where: { id: spelerId } });
      return `Nieuw lid "${spelerId}" verwijderd`;
    }

    case "plaatsreserveringZetten": {
      const { reserveringId } = payload;
      await prisma.plaatsreservering.delete({ where: { id: reserveringId } });
      return `Plaatsreservering verwijderd`;
    }

    case "besluitVastleggen":
    case "actiePlaatsen": {
      const { werkitemId } = payload;
      await prisma.werkitem.delete({ where: { id: werkitemId } });
      return `Werkitem verwijderd`;
    }

    case "teamAanmaken": {
      const { teamId } = payload;
      const spelerCount = await prisma.teamSpeler.count({ where: { teamId } });
      if (spelerCount > 0) {
        return `Kan team niet verwijderen: bevat al ${spelerCount} spelers. Verwijder handmatig.`;
      }
      await prisma.team.delete({ where: { id: teamId } });
      return `Team verwijderd`;
    }

    case "selectieAanmaken": {
      const { groepId } = payload;
      await prisma.selectieGroep.delete({ where: { id: groepId } });
      return `Selectiegroep verwijderd`;
    }

    case "stafPlaatsen": {
      const { stafId, teamId } = payload;
      await prisma.teamStaf.deleteMany({ where: { teamId, stafId } });
      return `Staaftoewijzing verwijderd`;
    }

    case "whatIfScenarioAanmaken": {
      const { scenarioId } = payload;
      const teamCount = await prisma.team.count({
        where: { versie: { werkindelingId: scenarioId } },
      });
      if (teamCount > 0) {
        return `Kan werkindeling niet verwijderen: bevat al ${teamCount} teams. Verwijder handmatig in TI-studio.`;
      }
      await prisma.werkindeling.delete({ where: { id: scenarioId } });
      return `Werkindeling verwijderd`;
    }

    default:
      return `Undo niet geïmplementeerd voor tool "${actie.tool}"`;
  }
}
