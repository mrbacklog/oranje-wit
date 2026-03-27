import { z } from "zod";
import { auth } from "@oranje-wit/auth";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";
import {
  berekenOverall,
  berekenOverallV3,
  berekenEWMA,
  berekenEWMAPijlers,
  bepaalBetrouwbaarheid,
} from "@/lib/scouting/rating";
import { bepaalLeeftijdsgroep } from "@/lib/scouting/leeftijdsgroep";
import type { LeeftijdsgroepNaamV3 } from "@oranje-wit/types";
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
        groeiIndicator: z.enum(["geen", "weinig", "normaal", "veel"]).optional(),
        socialeVeiligheid: z.union([z.boolean(), z.number()]).nullable().optional(),
      })
    )
    .min(1, "Minimaal 1 spelerrapport vereist"),
  rankings: z.record(z.string(), z.array(z.string())).optional(),
  versie: z.string().optional(),
});

// Prisma 7 type recursion workarounds
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

    const { owTeamId, context, contextDetail, rapporten, rankings, versie } = parsed.data;
    const isV3 = versie === "v3";

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
      `TeamScoutingSessie ${sessie.id} aangemaakt voor team ${team.naam}, ${rapporten.length} spelers${isV3 ? " [v3]" : ""}`
    );

    // 6. Verwerk elk spelerrapport
    let totaalXpGained = 0;
    let rapportenCount = 0;
    const rapportResultaten: Array<{ spelerId: string; overall: number }> = [];

    for (const rapport of rapporten) {
      const speler = (await db.speler.findUnique({
        where: { id: rapport.spelerId },
      })) as { id: string; geboortejaar: number; huidig: unknown } | null;

      if (!speler) {
        logger.warn(`Speler ${rapport.spelerId} niet gevonden, overgeslagen`);
        continue;
      }

      const groep = bepaalLeeftijdsgroep(speler);

      let overall: number;
      let pijlerScoresResult: Record<string, number>;

      if (isV3) {
        const result = berekenOverallV3(rapport.scores, groep as LeeftijdsgroepNaamV3, true);
        overall = result.overall;
        pijlerScoresResult = result.pijlerScores;
      } else {
        const result = berekenOverall(rapport.scores, groep);
        overall = result.overall;
        pijlerScoresResult = result.pijlerScores as Record<string, number>;
      }

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
      const nieuwAantalRapporten = (bestaandeKaart?.aantalRapporten ?? 0) + 1;
      const trend = bestaandeKaart ? nieuwOverall - bestaandeKaart.overall : 0;

      if (isV3) {
        const bestaandePijlerScores =
          bestaandeKaart?.pijlerScores && typeof bestaandeKaart.pijlerScores === "object"
            ? (bestaandeKaart.pijlerScores as Record<string, number>)
            : null;

        const nieuwePijlerScores = berekenEWMAPijlers(pijlerScoresResult, bestaandePijlerScores);

        await db.spelersKaart.upsert({
          where: {
            spelerId_seizoen: {
              spelerId: rapport.spelerId,
              seizoen: HUIDIG_SEIZOEN,
            },
          },
          update: {
            overall: nieuwOverall,
            pijlerScores: nieuwePijlerScores,
            leeftijdsgroep: groep,
            aantalRapporten: nieuwAantalRapporten,
            betrouwbaarheid: bepaalBetrouwbaarheid(nieuwAantalRapporten),
            trendOverall: trend,
            laatsteUpdate: new Date(),
            schot:
              nieuwePijlerScores["SCOREN"] ??
              nieuwePijlerScores["BAL"] ??
              bestaandeKaart?.schot ??
              0,
            aanval: nieuwePijlerScores["AANVALLEN"] ?? bestaandeKaart?.aanval ?? 0,
            passing: nieuwePijlerScores["TECHNIEK"] ?? bestaandeKaart?.passing ?? 0,
            verdediging: nieuwePijlerScores["VERDEDIGEN"] ?? bestaandeKaart?.verdediging ?? 0,
            fysiek: nieuwePijlerScores["FYSIEK"] ?? bestaandeKaart?.fysiek ?? 0,
            mentaal: nieuwePijlerScores["MENTAAL"] ?? bestaandeKaart?.mentaal ?? 0,
          },
          create: {
            spelerId: rapport.spelerId,
            seizoen: HUIDIG_SEIZOEN,
            overall: nieuwOverall,
            pijlerScores: pijlerScoresResult,
            leeftijdsgroep: groep,
            schot: pijlerScoresResult["SCOREN"] ?? pijlerScoresResult["BAL"] ?? 0,
            aanval: pijlerScoresResult["AANVALLEN"] ?? 0,
            passing: pijlerScoresResult["TECHNIEK"] ?? 0,
            verdediging: pijlerScoresResult["VERDEDIGEN"] ?? 0,
            fysiek: pijlerScoresResult["FYSIEK"] ?? 0,
            mentaal: pijlerScoresResult["MENTAAL"] ?? 0,
            aantalRapporten: 1,
            betrouwbaarheid: bepaalBetrouwbaarheid(1),
            trendOverall: 0,
          },
        });
      } else {
        // Legacy
        const nieuwSchot = berekenEWMA(
          pijlerScoresResult["SCH"] ?? 0,
          bestaandeKaart?.schot ?? null
        );
        const nieuwAanval = berekenEWMA(
          pijlerScoresResult["AAN"] ?? 0,
          bestaandeKaart?.aanval ?? null
        );
        const nieuwPassing = berekenEWMA(
          pijlerScoresResult["PAS"] ?? 0,
          bestaandeKaart?.passing ?? null
        );
        const nieuwVerdediging = berekenEWMA(
          pijlerScoresResult["VER"] ?? 0,
          bestaandeKaart?.verdediging ?? null
        );
        const nieuwFysiek = berekenEWMA(
          pijlerScoresResult["FYS"] ?? 0,
          bestaandeKaart?.fysiek ?? null
        );
        const nieuwMentaal = berekenEWMA(
          pijlerScoresResult["MEN"] ?? 0,
          bestaandeKaart?.mentaal ?? null
        );

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
      }

      // XP per speler
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

    // 7. Bonus XP voor team-complete
    const TEAM_COMPLETE_BONUS = 50;
    totaalXpGained += TEAM_COMPLETE_BONUS;

    // 8. Update scout XP
    const updatedScout = await db.scout.update({
      where: { id: scout.id },
      data: {
        xp: { increment: totaalXpGained },
      },
    });

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

    if (nieuweBadges.length > 0) {
      await db.scoutBadge.createMany({
        data: nieuweBadges.map((badge: string) => ({
          scoutId: scout.id,
          badge,
        })),
      });
      logger.info(`Nieuwe badges voor scout ${scout.id}: ${nieuweBadges.join(", ")}`);
    }

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
