import { auth } from "@oranje-wit/auth";
import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";

interface RouteParams {
  params: Promise<{ owTeamId: string }>;
}

/**
 * GET /api/teams/:owTeamId/spelers
 *
 * Retourneert alle spelers van een team via CompetitieSpeler -> Speler.
 * Inclusief geboortejaar, roepnaam, achternaam en of er een foto beschikbaar is.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    const { owTeamId } = await params;
    const teamId = parseInt(owTeamId, 10);

    if (isNaN(teamId)) {
      return fail("Ongeldig team ID", 400, "BAD_REQUEST");
    }

    // Haal het team op
    const team = await (prisma.oWTeam as any).findUnique({
      where: { id: teamId },
      select: {
        id: true,
        naam: true,
        seizoen: true,
        kleur: true,
        leeftijdsgroep: true,
      },
    });

    if (!team) {
      return fail(`Team ${teamId} niet gevonden`, 404, "NOT_FOUND");
    }

    // Haal team-aliases op
    const aliases = await prisma.teamAlias.findMany({
      where: { owTeamId: team.id },
      select: { alias: true },
    });

    const teamNamen = [team.naam, ...aliases.map((a) => a.alias)].filter(Boolean) as string[];

    if (teamNamen.length === 0) {
      return ok({ team, spelers: [] });
    }

    // Vind unieke rel_codes van spelers in dit team
    const competitieSpelers = await prisma.competitieSpeler.findMany({
      where: {
        seizoen: team.seizoen,
        team: { in: teamNamen },
      },
      select: {
        relCode: true,
      },
      distinct: ["relCode"],
    });

    const relCodes = competitieSpelers.map((cs) => cs.relCode);

    if (relCodes.length === 0) {
      return ok({ team, spelers: [] });
    }

    // Haal Speler-records op (TI-tabellen)
    const spelers = (await (prisma.speler as any).findMany({
      where: { id: { in: relCodes } },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geslacht: true,
        huidig: true,
      },
      orderBy: { roepnaam: "asc" },
    })) as Array<{
      id: string;
      roepnaam: string;
      achternaam: string;
      geboortejaar: number;
      geslacht: string;
      huidig: unknown;
    }>;

    // Check foto-beschikbaarheid per speler
    const fotos = await prisma.lidFoto.findMany({
      where: { relCode: { in: relCodes } },
      select: { relCode: true },
    });
    const fotoSet = new Set(fotos.map((f) => f.relCode));

    const spelersMetFoto = spelers.map((s) => ({
      ...s,
      heeftFoto: fotoSet.has(s.id),
    }));

    logger.info(`Spelers opgehaald voor team ${team.naam}: ${spelersMetFoto.length} spelers`);

    return ok({ team, spelers: spelersMetFoto });
  } catch (error) {
    logger.error("Fout bij ophalen team-spelers:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
