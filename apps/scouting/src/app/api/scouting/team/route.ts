import { z } from "zod";
import { auth } from "@oranje-wit/auth";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { berekenOverall, berekenEWMA, bepaalBetrouwbaarheid } from "@/lib/scouting/rating";
import { bepaalLeeftijdsgroep } from "@/lib/scouting/leeftijdsgroep";
import { berekenXP, checkBadges, bepaalLevel, getBadgeInfo } from "@/lib/scouting/gamification";

const TeamRapportSchema = z.object({
  owTeamId: z.number().int().positive(),
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  contextDetail: z.string().optional(),
  rapporten: z
    .array(
      z.object({
        spelerId: z.string().min(1),
        scores: z.record(z.string(), z.number()),
        opmerking: z.string().optional(),
      })
    )
    .min(1, "Minimaal 1 spelerrapport vereist"),
  rankings: z.record(z.string(), z.array(z.string())).optional(),
});

/**
 * POST /api/scouting/team
 *
 * Sla een team-scouting sessie op met rapporten voor meerdere spelers tegelijk.
 *
 * 1. Maak TeamScoutingSessie aan
 * 2. Voor elke speler: maak ScoutingRapport aan
 * 3. Update SpelersKaart per speler
 * 4. Ken XP toe: 15 per speler + 50 bonus voor team-complete
 * 5. Check badges
 * 6. Return resultaat
 */
// Prisma 7 type recursion workarounds — alle scouting-modellen
const db = prisma as any;

export async function POST(request: Request) {
  try {
    // 1. Authenticatie
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    // 2. Valideer body
    const parsed = await parseBody(request, TeamRapportSchema);
    if (!parsed.ok) return parsed.response;

    const { owTeamId, context, contextDetail, rapporten, rankings } = parsed.data;

    // 3. Controleer of het team bestaat

    const team = (await db.oWTeam.findUnique({
      where: { id: owTeamId },
      select: { id: true, naam: true, seizoen: true },
    })) as { id: number; naam: string | null; seizoen: string } | null;

    if (!team) {
      return fail(`Team ${owTeamId} niet gevonden`, 404, "NOT_FOUND");
    }

    // 4. Vind of maak Scout-profiel
    let scout = await db.scout.findUnique({
      where: { email: session.user.email },
    });

    if (!scout) {
      scout = await db.scout.create({
        data: {
          naam: session.user.name ?? "Onbekende scout",
          email: session.user.email,
        },
      });
      logger.info(`Nieuw scout-profiel aangemaakt: ${scout.id}`);
    }

    // 5. Maak TeamScoutingSessie aan
    const sessie = await db.teamScoutingSessie.create({
      data: {
        scoutId: scout.id,
        owTeamId,
        seizoen: HUIDIG_SEIZOEN,
        context,
        contextDetail: contextDetail ?? null,
        rankings: rankings ?? undefined,
      },
    });

    logger.info(
      `TeamScoutingSessie ${sessie.id} aangemaakt voor team ${team.naam}, ${rapporten.length} spelers`
    );

    // 6. Verwerk elk spelerrapport
    let totaalXpGained = 0;
    let rapportenCount = 0;
    const rapportResultaten: Array<{ spelerId: string; overall: number }> = [];

    for (const rapport of rapporten) {
      // Zoek de speler

      const speler = (await db.speler.findUnique({
        where: { id: rapport.spelerId },
      })) as { id: string; geboortejaar: number; huidig: unknown } | null;

      if (!speler) {
        logger.warn(`Speler ${rapport.spelerId} niet gevonden, overgeslagen`);
        continue;
      }

      // Bereken scores
      const groep = bepaalLeeftijdsgroep(speler);
      const { overall, pijlerScores } = berekenOverall(rapport.scores, groep);

      // Sla rapport op met teamSessieId
      const savedRapport = await db.scoutingRapport.create({
        data: {
          scoutId: scout.id,
          spelerId: rapport.spelerId,
          seizoen: HUIDIG_SEIZOEN,
          context,
          contextDetail: contextDetail ?? null,
          scores: rapport.scores,
          opmerking: rapport.opmerking ?? null,
          overallScore: overall,
          teamSessieId: sessie.id,
        },
      });

      // Update SpelersKaart (EWMA)
      const bestaandeKaart = await db.spelersKaart.findUnique({
        where: {
          spelerId_seizoen: {
            spelerId: rapport.spelerId,
            seizoen: HUIDIG_SEIZOEN,
          },
        },
      });

      const nieuwOverall = berekenEWMA(overall, bestaandeKaart?.overall ?? null);
      const nieuwSchot = berekenEWMA(pijlerScores.SCH ?? 0, bestaandeKaart?.schot ?? null);
      const nieuwAanval = berekenEWMA(pijlerScores.AAN ?? 0, bestaandeKaart?.aanval ?? null);
      const nieuwPassing = berekenEWMA(pijlerScores.PAS ?? 0, bestaandeKaart?.passing ?? null);
      const nieuwVerdediging = berekenEWMA(
        pijlerScores.VER ?? 0,
        bestaandeKaart?.verdediging ?? null
      );
      const nieuwFysiek = berekenEWMA(pijlerScores.FYS ?? 0, bestaandeKaart?.fysiek ?? null);
      const nieuwMentaal = berekenEWMA(pijlerScores.MEN ?? 0, bestaandeKaart?.mentaal ?? null);
      const nieuwAantalRapporten = (bestaandeKaart?.aantalRapporten ?? 0) + 1;
      const trend = bestaandeKaart ? nieuwOverall - bestaandeKaart.overall : 0;

      await db.spelersKaart.upsert({
        where: {
          spelerId_seizoen: {
            spelerId: rapport.spelerId,
            seizoen: HUIDIG_SEIZOEN,
          },
        },
        update: {
          overall: nieuwOverall,
          schot: nieuwSchot,
          aanval: nieuwAanval,
          passing: nieuwPassing,
          verdediging: nieuwVerdediging,
          fysiek: nieuwFysiek,
          mentaal: nieuwMentaal,
          aantalRapporten: nieuwAantalRapporten,
          betrouwbaarheid: bepaalBetrouwbaarheid(nieuwAantalRapporten),
          trendOverall: trend,
          laatsteUpdate: new Date(),
        },
        create: {
          spelerId: rapport.spelerId,
          seizoen: HUIDIG_SEIZOEN,
          overall: nieuwOverall,
          schot: nieuwSchot,
          aanval: nieuwAanval,
          passing: nieuwPassing,
          verdediging: nieuwVerdediging,
          fysiek: nieuwFysiek,
          mentaal: nieuwMentaal,
          aantalRapporten: 1,
          betrouwbaarheid: bepaalBetrouwbaarheid(1),
          trendOverall: 0,
        },
      });

      // XP: 15 per speler
      const isEersteVoorSpeler = !bestaandeKaart;
      const xp = berekenXP(isEersteVoorSpeler);
      totaalXpGained += xp;
      rapportenCount++;

      rapportResultaten.push({
        spelerId: rapport.spelerId,
        overall: nieuwOverall,
      });

      logger.info(
        `Rapport ${savedRapport.id} opgeslagen: speler=${rapport.spelerId}, overall=${overall}`
      );
    }

    // 7. Bonus XP voor team-complete (50 extra)
    const TEAM_COMPLETE_BONUS = 50;
    totaalXpGained += TEAM_COMPLETE_BONUS;

    // 8. Update scout XP
    const updatedScout = await db.scout.update({
      where: { id: scout.id },
      data: {
        xp: { increment: totaalXpGained },
      },
    });

    // Update level
    const levelInfo = bepaalLevel(updatedScout.xp);
    if (levelInfo.level !== updatedScout.level) {
      await db.scout.update({
        where: { id: scout.id },
        data: { level: levelInfo.level },
      });
    }

    // 9. Check badges
    const totaalRapporten = await db.scoutingRapport.count({
      where: { scoutId: scout.id },
    });
    const uniekeSpelers = await db.scoutingRapport.groupBy({
      by: ["spelerId"],
      where: { scoutId: scout.id },
    });
    const contexten = await db.scoutingRapport.groupBy({
      by: ["context"],
      where: { scoutId: scout.id },
    });
    const wedstrijdRapporten = await db.scoutingRapport.count({
      where: { scoutId: scout.id, context: "WEDSTRIJD" },
    });
    const bestaandeBadges = await db.scoutBadge.findMany({
      where: { scoutId: scout.id },
      select: { badge: true },
    });

    const nieuweBadges = checkBadges({
      totaalRapporten,
      uniekeSpelers: uniekeSpelers.length,
      contexten: contexten.length,
      wedstrijdRapporten,
      bestaandeBadges: bestaandeBadges.map((b: { badge: string }) => b.badge),
    });

    // Sla nieuwe badges op
    if (nieuweBadges.length > 0) {
      await db.scoutBadge.createMany({
        data: nieuweBadges.map((badge: string) => ({
          scoutId: scout.id,
          badge,
        })),
      });
      logger.info(`Nieuwe badges voor scout ${scout.id}: ${nieuweBadges.join(", ")}`);
    }

    // Badge-info ophalen voor de eerste nieuwe badge (voor celebration)
    const eersteBadge = nieuweBadges.length > 0 ? getBadgeInfo(nieuweBadges[0]) : null;

    return ok({
      sessie: {
        id: sessie.id,
        teamNaam: team.naam,
      },
      rapportenCount,
      rapporten: rapportResultaten,
      xpGained: totaalXpGained,
      totalXp: updatedScout.xp + totaalXpGained,
      levelInfo,
      badgeUnlocked: eersteBadge ? { badge: nieuweBadges[0], naam: eersteBadge.naam } : undefined,
      badges: nieuweBadges,
    });
  } catch (error) {
    logger.error("Fout bij opslaan team-scouting sessie:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
