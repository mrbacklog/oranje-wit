import { auth } from "@oranje-wit/auth";
import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { bepaalLevel, getBadgeInfo } from "@/lib/scouting/gamification";

/**
 * GET /api/scout/profiel
 *
 * Retourneert het scout-profiel inclusief XP, level, badges,
 * statistieken (totaal rapporten, unieke spelers, streak) en level-info.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    // Type assertion: Prisma 7 type recursion workaround op Scout model
    type ScoutWithBadges = {
      id: string;
      naam: string;
      xp: number;
      level: number;
      badges: Array<{ badge: string; unlockedAt: Date }>;
    };
    const scout = await (
      prisma.scout as unknown as {
        findUnique: (args: {
          where: { email: string };
          include: { badges: { orderBy: { unlockedAt: "desc" } } };
        }) => Promise<ScoutWithBadges | null>;
      }
    ).findUnique({
      where: { email: session.user.email },
      include: {
        badges: {
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    if (!scout) {
      // Scout bestaat nog niet — retourneer lege staat
      return ok({
        scout: null,
        levelInfo: bepaalLevel(0),
        badges: [],
        stats: {
          totaalRapporten: 0,
          dezeMaand: 0,
          gemiddeldPerWeek: 0,
          uniekeSpelers: 0,
          streak: 0,
        },
      });
    }

    // Stats berekenen
    const totaalRapporten = await prisma.scoutingRapport.count({
      where: { scoutId: scout.id },
    });

    // Rapporten deze maand
    const startMaand = new Date();
    startMaand.setDate(1);
    startMaand.setHours(0, 0, 0, 0);

    const dezeMaand = await prisma.scoutingRapport.count({
      where: {
        scoutId: scout.id,
        datum: { gte: startMaand },
      },
    });

    // Unieke spelers
    const uniekeSpelersGroups = await prisma.scoutingRapport.groupBy({
      by: ["spelerId"],
      where: { scoutId: scout.id },
    });

    // Gemiddeld per week: bereken op basis van eerste rapport
    // Type assertion: Prisma 7 type recursion workaround op ScoutingRapport model
    const eersteRapport = await (
      prisma.scoutingRapport as unknown as {
        findFirst: (args: {
          where: { scoutId: string };
          orderBy: { datum: "asc" };
          select: { datum: true };
        }) => Promise<{ datum: Date } | null>;
      }
    ).findFirst({
      where: { scoutId: scout.id },
      orderBy: { datum: "asc" },
      select: { datum: true },
    });

    let gemiddeldPerWeek = 0;
    if (eersteRapport && totaalRapporten > 0) {
      const wekenActief = Math.max(
        1,
        Math.ceil((Date.now() - eersteRapport.datum.getTime()) / (7 * 24 * 60 * 60 * 1000))
      );
      gemiddeldPerWeek = Math.round((totaalRapporten / wekenActief) * 10) / 10;
    }

    // Streak berekenen (weken achtereen met minimaal 1 rapport)
    const streak = await berekenStreak(scout.id);

    // Level-info
    const levelInfo = bepaalLevel(scout.xp);

    // Badges met extra info
    const badgesMetInfo = scout.badges.map((b) => ({
      id: b.badge,
      unlockedAt: b.unlockedAt.toISOString(),
      ...getBadgeInfo(b.badge),
    }));

    return ok({
      scout: {
        id: scout.id,
        naam: scout.naam,
        xp: scout.xp,
        level: scout.level,
      },
      levelInfo,
      badges: badgesMetInfo,
      stats: {
        totaalRapporten,
        dezeMaand,
        gemiddeldPerWeek,
        uniekeSpelers: uniekeSpelersGroups.length,
        streak,
      },
    });
  } catch (error) {
    logger.error("Fout bij ophalen scout profiel:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Bereken de streak: hoeveel opeenvolgende weken (incl. huidige)
 * de scout minimaal 1 rapport heeft ingediend.
 */
async function berekenStreak(scoutId: string): Promise<number> {
  try {
    const rapporten = await prisma.scoutingRapport.findMany({
      where: { scoutId },
      select: { datum: true },
      orderBy: { datum: "desc" },
    });

    if (rapporten.length === 0) return 0;

    // Groepeer per week-nummer (ISO week)
    const weekSet = new Set<string>();
    for (const r of rapporten) {
      const d = r.datum;
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const daysDiff = Math.floor((d.getTime() - jan4.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((daysDiff + jan4.getDay() + 1) / 7);
      weekSet.add(`${d.getFullYear()}-W${weekNum}`);
    }

    // Controleer consecutieve weken vanaf nu
    let streak = 0;
    const now = new Date();
    const checkDate = new Date(now);

    for (let i = 0; i < 52; i++) {
      const jan4 = new Date(checkDate.getFullYear(), 0, 4);
      const daysDiff = Math.floor((checkDate.getTime() - jan4.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((daysDiff + jan4.getDay() + 1) / 7);
      const weekKey = `${checkDate.getFullYear()}-W${weekNum}`;

      if (weekSet.has(weekKey)) {
        streak++;
      } else if (i > 0) {
        // Eerste week mag gemist worden (huidige week is nog bezig)
        break;
      }

      // Ga een week terug
      checkDate.setDate(checkDate.getDate() - 7);
    }

    return streak;
  } catch (error) {
    logger.warn("Streak-berekening mislukt:", error);
    return 0;
  }
}
