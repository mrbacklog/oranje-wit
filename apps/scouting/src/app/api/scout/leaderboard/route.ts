import { auth } from "@oranje-wit/auth";
import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { bepaalLevel } from "@/lib/scouting/gamification";

/**
 * GET /api/scout/leaderboard
 *
 * Retourneert top 10 scouts op XP plus de eigen positie.
 * Scouts zien alleen display-namen (privacy).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    // Type assertion: Prisma 7 type recursion workaround op Scout model
    type ScoutSelect = { id: string; naam: string; xp: number; level: number };
    const scoutClient = prisma.scout as unknown as {
      findMany: (args: {
        orderBy: { xp: "desc" };
        take: number;
        select: Record<string, true>;
      }) => Promise<ScoutSelect[]>;
      findUnique: (args: {
        where: { email: string };
        select: Record<string, true>;
      }) => Promise<ScoutSelect | null>;
      count: (args: { where: Record<string, unknown> }) => Promise<number>;
    };

    // Top 10 scouts op XP
    const topScouts = await scoutClient.findMany({
      orderBy: { xp: "desc" },
      take: 10,
      select: {
        id: true,
        naam: true,
        xp: true,
        level: true,
      },
    });

    // Eigen scout
    const eigenScout = await scoutClient.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        naam: true,
        xp: true,
        level: true,
      },
    });

    // Bepaal eigen positie
    let eigenPositie = 0;
    if (eigenScout) {
      const hogereScouts = await scoutClient.count({
        where: { xp: { gt: eigenScout.xp } },
      });
      eigenPositie = hogereScouts + 1;
    }

    // Map naar response met display-namen en level-info
    const leaderboard = topScouts.map((scout, index) => ({
      positie: index + 1,
      displayNaam: anonimiseerNaam(scout.naam),
      xp: scout.xp,
      levelInfo: bepaalLevel(scout.xp),
      isEigen: eigenScout?.id === scout.id,
    }));

    return ok({
      leaderboard,
      eigenPositie,
      eigenScout: eigenScout
        ? {
            displayNaam: eigenScout.naam,
            xp: eigenScout.xp,
            levelInfo: bepaalLevel(eigenScout.xp),
          }
        : null,
    });
  } catch (error) {
    logger.error("Fout bij ophalen leaderboard:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Toon alleen de voornaam voor privacy.
 * "Jan de Vries" -> "Jan"
 */
function anonimiseerNaam(naam: string): string {
  return naam.split(" ")[0] ?? naam;
}
