import { auth } from "@oranje-wit/auth";
import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/scout/challenges
 *
 * Retourneert actieve challenges plus voortgang van de huidige scout.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    // Actieve challenges (nog niet verlopen)
    const nu = new Date();
    const challenges = await prisma.scoutChallenge.findMany({
      where: {
        eindDatum: { gte: nu },
        startDatum: { lte: nu },
      },
      orderBy: { eindDatum: "asc" },
    });

    // Zoek de scout
    // Type assertion: Prisma 7 type recursion workaround op Scout model
    const scout = await (
      prisma.scout as unknown as {
        findUnique: (args: { where: { email: string } }) => Promise<{ id: string } | null>;
      }
    ).findUnique({
      where: { email: session.user.email },
    });

    if (!scout || challenges.length === 0) {
      return ok({ challenges: [] });
    }

    // Bereken voortgang per challenge
    const challengesMet = await Promise.all(
      challenges.map(async (ch) => {
        const voortgang = await berekenVoortgang(
          scout.id,
          ch.voorwaarde as unknown as ChallengeVoorwaarde,
          ch.startDatum,
          ch.eindDatum
        );

        return {
          id: ch.id,
          naam: ch.naam,
          beschrijving: ch.beschrijving,
          xpBeloning: ch.xpBeloning,
          startDatum: ch.startDatum.toISOString(),
          eindDatum: ch.eindDatum.toISOString(),
          voortgang: voortgang.huidig,
          doel: voortgang.doel,
          voltooid: voortgang.huidig >= voortgang.doel,
        };
      })
    );

    return ok({ challenges: challengesMet });
  } catch (error) {
    logger.error("Fout bij ophalen challenges:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

interface ChallengeVoorwaarde {
  type: "rapporten" | "unieke_spelers" | "team_sessies";
  aantal: number;
}

async function berekenVoortgang(
  scoutId: string,
  voorwaarde: ChallengeVoorwaarde,
  startDatum: Date,
  eindDatum: Date
): Promise<{ huidig: number; doel: number }> {
  const doel = voorwaarde.aantal;

  switch (voorwaarde.type) {
    case "rapporten": {
      const count = await prisma.scoutingRapport.count({
        where: {
          scoutId,
          datum: { gte: startDatum, lte: eindDatum },
        },
      });
      return { huidig: count, doel };
    }

    case "unieke_spelers": {
      const groups = await prisma.scoutingRapport.groupBy({
        by: ["spelerId"],
        where: {
          scoutId,
          datum: { gte: startDatum, lte: eindDatum },
        },
      });
      return { huidig: groups.length, doel };
    }

    case "team_sessies": {
      const count = await prisma.teamScoutingSessie.count({
        where: {
          scoutId,
          datum: { gte: startDatum, lte: eindDatum },
        },
      });
      return { huidig: count, doel };
    }

    default:
      return { huidig: 0, doel };
  }
}
