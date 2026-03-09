import { prisma, anyTeam } from "./prisma";

/**
 * Haal de versieId op voor een team.
 */
export async function getVersieIdVoorTeam(teamId: string): Promise<string> {
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { versieId: true },
  })) as { versieId: string };
  return team.versieId;
}

/**
 * Controleer of een speler al ergens in de versie zit (team of selectiegroep).
 * Retourneert de teamnaam als de speler al geplaatst is, of null als vrij.
 */
export async function vindSpelerInVersie(
  versieId: string,
  spelerId: string
): Promise<string | null> {
  // Check TeamSpeler
  const teamSpeler = (await prisma.teamSpeler.findFirst({
    where: { spelerId, team: { versieId } },
    select: { team: { select: { naam: true } } },
  })) as { team: { naam: string } } | null;

  if (teamSpeler) return teamSpeler.team.naam;

  // Check SelectieSpeler
  const selectieSpeler = (await prisma.selectieSpeler.findFirst({
    where: { spelerId, selectieGroep: { versieId } },
    select: {
      selectieGroep: {
        select: { teams: { select: { naam: true }, take: 2 } },
      },
    },
  })) as { selectieGroep: { teams: { naam: string }[] } } | null;

  if (selectieSpeler) {
    return selectieSpeler.selectieGroep.teams.map((t) => t.naam).join(" + ");
  }

  return null;
}

/**
 * Gooi een error als de speler al in de versie zit.
 * Gebruik dit vóór elke teamSpeler.create / selectieSpeler.create.
 */
export async function assertSpelerVrij(versieId: string, spelerId: string): Promise<void> {
  const bestaandeTeam = await vindSpelerInVersie(versieId, spelerId);
  if (bestaandeTeam) {
    throw new Error(`Speler ${spelerId} zit al in ${bestaandeTeam}`);
  }
}

/**
 * Filter een lijst speler-IDs en retourneer alleen degenen die nog niet in de versie zitten.
 * Handig voor batch-operaties.
 */
export async function filterVrijeSpelers(versieId: string, spelerIds: string[]): Promise<string[]> {
  if (spelerIds.length === 0) return [];

  const bestaandeTeamSpelers = (await prisma.teamSpeler.findMany({
    where: { spelerId: { in: spelerIds }, team: { versieId } },
    select: { spelerId: true },
  })) as { spelerId: string }[];

  const bestaandeSelectieSpelers = (await prisma.selectieSpeler.findMany({
    where: { spelerId: { in: spelerIds }, selectieGroep: { versieId } },
    select: { spelerId: true },
  })) as { spelerId: string }[];

  const bezet = new Set([
    ...bestaandeTeamSpelers.map((s) => s.spelerId),
    ...bestaandeSelectieSpelers.map((s) => s.spelerId),
  ]);

  return spelerIds.filter((id) => !bezet.has(id));
}
