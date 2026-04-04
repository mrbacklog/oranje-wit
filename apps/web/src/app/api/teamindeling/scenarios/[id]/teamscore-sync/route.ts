import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { berekenAlleRatings } from "@/lib/teamindeling/rating";
import { guardTC } from "@oranje-wit/auth/checks";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Haal werkindeling op met laatste versie + teams + spelers
    const scenario = await prisma.werkindeling.findUnique({
      where: { id },
      include: {
        versies: {
          orderBy: { nummer: "desc" },
          take: 1,
          include: {
            teams: {
              include: {
                spelers: {
                  include: { speler: { select: { id: true, rating: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!scenario) return fail("Scenario niet gevonden", 404, "NOT_FOUND");
    const versie = scenario.versies[0];
    if (!versie) return fail("Scenario heeft geen versie", 400, "NO_VERSION");

    // Bereken gemiddelde spelerrating per team
    const teamScores: { naam: string; teamscore: number; spelerCount: number }[] = [];

    for (const team of versie.teams) {
      const metRating = team.spelers.filter(
        (ts: { speler: { id: string; rating: number | null } }) => ts.speler.rating != null
      );
      if (metRating.length === 0) continue;

      const gem =
        metRating.reduce(
          (sum: number, ts: { speler: { id: string; rating: number | null } }) =>
            sum + ts.speler.rating!,
          0
        ) / metRating.length;
      teamScores.push({
        naam: team.naam,
        teamscore: Math.round(gem),
        spelerCount: metRating.length,
      });
    }

    // Match op ReferentieTeam.naam en update teamscore
    const seizoen = HUIDIG_SEIZOEN;
    let gesynchroniseerd = 0;
    let nietGevonden = 0;

    for (const ts of teamScores) {
      const updated = await prisma.referentieTeam.updateMany({
        where: { naam: ts.naam, seizoen },
        data: { teamscore: ts.teamscore },
      });
      if (updated.count > 0) {
        gesynchroniseerd++;
      } else {
        nietGevonden++;
      }
    }

    // Herbereken alle spelerratings
    const ratingResult = await berekenAlleRatings(seizoen, prisma);

    return ok({
      teamScores,
      gesynchroniseerd,
      nietGevonden,
      ratings: ratingResult,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
