import { z } from "zod";
import { auth } from "@oranje-wit/auth";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { berekenOverall, berekenEWMA, bepaalBetrouwbaarheid } from "@/lib/scouting/rating";
import { bepaalLeeftijdsgroep } from "@/lib/scouting/leeftijdsgroep";
import { berekenXP, checkBadges, bepaalLevel } from "@/lib/scouting/gamification";

// Prisma 7 type recursion workarounds — alle scouting-modellen
const db = prisma as any;

const RapportSchema = z.object({
  spelerId: z.string().min(1, "spelerId is verplicht"),
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  contextDetail: z.string().optional(),
  scores: z.record(z.string(), z.number()),
  opmerking: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticatie
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    // 2. Valideer body
    const parsed = await parseBody(request, RapportSchema);
    if (!parsed.ok) return parsed.response;

    const { spelerId, context, contextDetail, scores, opmerking } = parsed.data;

    // 3. Zoek de speler op (via rel_code = Speler.id)
    const speler = await db.speler.findUnique({
      where: { id: spelerId },
    });

    if (!speler) {
      return fail(`Speler met rel_code '${spelerId}' niet gevonden`, 404, "NOT_FOUND");
    }

    // 4. Vind of maak Scout profiel
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

    // 5. Bepaal leeftijdsgroep en bereken scores
    const groep = bepaalLeeftijdsgroep(speler);
    const { overall, pijlerScores } = berekenOverall(scores, groep);

    // 6. Sla het rapport op
    const rapport = await db.scoutingRapport.create({
      data: {
        scoutId: scout.id,
        spelerId,
        seizoen: HUIDIG_SEIZOEN,
        context,
        contextDetail: contextDetail ?? null,
        scores,
        opmerking: opmerking ?? null,
        overallScore: overall,
      },
    });

    logger.info(`Rapport ${rapport.id} opgeslagen: speler=${spelerId}, overall=${overall}`);

    // 7. Update SpelersKaart (EWMA)
    const bestaandeKaart = await db.spelersKaart.findUnique({
      where: {
        spelerId_seizoen: {
          spelerId,
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

    // Trend: verschil t.o.v. vorige overall
    const trend = bestaandeKaart ? nieuwOverall - bestaandeKaart.overall : 0;

    await db.spelersKaart.upsert({
      where: {
        spelerId_seizoen: {
          spelerId,
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
        spelerId,
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

    // 8. XP toekenning
    const isEersteVoorSpeler = !bestaandeKaart;
    const xpGained = berekenXP(isEersteVoorSpeler);

    const updatedScout = await db.scout.update({
      where: { id: scout.id },
      data: {
        xp: { increment: xpGained },
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

    return ok({
      rapport: {
        id: rapport.id,
        overall,
        pijlerScores,
      },
      xpGained,
      totalXp: updatedScout.xp,
      levelInfo,
      badgeUnlocked: nieuweBadges.length > 0 ? nieuweBadges : undefined,
    });
  } catch (error) {
    logger.error("Fout bij opslaan rapport:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
