import { auth } from "@oranje-wit/auth";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/teams?seizoen=2025-2026
 *
 * Retourneert alle OWTeams voor het opgegeven seizoen (of het huidige).
 * Alleen jeugdteams — senioren worden uitgefilterd.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const seizoen = searchParams.get("seizoen") ?? HUIDIG_SEIZOEN;

    const teams = await prisma.oWTeam.findMany({
      where: {
        seizoen,
        // Filter op jeugd: categorie is niet "senioren"
        // Jeugd teams hebben een leeftijdsgroep
        NOT: {
          leeftijdsgroep: null,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { naam: "asc" }],
      select: {
        id: true,
        owCode: true,
        naam: true,
        categorie: true,
        kleur: true,
        leeftijdsgroep: true,
        spelvorm: true,
        isSelectie: true,
      },
    });

    // Tel het aantal spelers per team via CompetitieSpeler
    // We zoeken op de teamnaam in de meest recente competitie van het seizoen
    const teamsMetAantal = await Promise.all(
      teams.map(async (team) => {
        // Zoek via TeamAlias of directe teamnaam
        const aliases = await prisma.teamAlias.findMany({
          where: { owTeamId: team.id },
          select: { alias: true },
        });

        const teamNamen = [team.naam, ...aliases.map((a) => a.alias)].filter(Boolean) as string[];

        const aantalSpelers =
          teamNamen.length > 0
            ? await prisma.competitieSpeler.count({
                where: {
                  seizoen,
                  team: { in: teamNamen },
                },
              })
            : 0;

        return {
          ...team,
          aantalSpelers,
        };
      })
    );

    logger.info(`Teams opgehaald: ${teamsMetAantal.length} jeugdteams voor ${seizoen}`);

    return ok(teamsMetAantal);
  } catch (error) {
    logger.error("Fout bij ophalen teams:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
