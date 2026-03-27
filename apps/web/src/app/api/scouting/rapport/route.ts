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
import { berekenXP, checkBadges, bepaalLevel } from "@/lib/scouting/gamification";

// Prisma 7 type recursion workarounds
const db = prisma as any;

const RapportSchema = z.object({
  spelerId: z.string().min(1, "spelerId is verplicht"),
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  contextDetail: z.string().optional(),
  scores: z.record(z.string(), z.number()),
  opmerking: z.string().optional(),
  verzoekId: z.string().optional(),
  relatie: z.enum(["GEEN", "OUDER", "FAMILIE", "BEKENDE", "TRAINER"]).optional().default("GEEN"),
  nietBeoordeeld: z.boolean().optional().default(false),
  // V3 extra velden
  versie: z.string().optional(), // "v3" voor nieuwe rapporten
  groeiIndicator: z.enum(["geen", "weinig", "normaal", "veel"]).optional(),
  socialeVeiligheid: z.union([z.boolean(), z.number()]).nullable().optional(),
  fysiekProfiel: z
    .object({
      lengte: z.string().optional(),
      lichaamsbouw: z.string().optional(),
      atletisch: z.string().optional(),
    })
    .optional(),
  veldZaal: z.enum(["veld", "zaal"]).optional(),
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

    const {
      spelerId,
      context,
      contextDetail,
      scores,
      opmerking,
      verzoekId,
      relatie,
      nietBeoordeeld,
      versie,
      groeiIndicator,
      socialeVeiligheid,
      veldZaal,
    } = parsed.data;

    // 3. Zoek de speler op
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

    // 4b. Vrij-scouten check
    if (!verzoekId) {
      if (!scout.vrijScouten && scout.rol !== "TC") {
        return fail(
          "Je hebt geen vrij-scouten recht. Wacht op een scoutingverzoek van de TC.",
          403,
          "VRIJ_SCOUTEN_NIET_TOEGESTAAN"
        );
      }
    }

    // 4c. Verzoek-toewijzing check
    if (verzoekId) {
      const toewijzing = await db.scoutToewijzing.findUnique({
        where: {
          verzoekId_scoutId: {
            verzoekId,
            scoutId: scout.id,
          },
        },
      });

      if (!toewijzing || toewijzing.status !== "GEACCEPTEERD") {
        return fail(
          "Je hebt geen geaccepteerde toewijzing voor dit scoutingverzoek",
          403,
          "TOEWIJZING_NIET_GEVONDEN"
        );
      }
    }

    // 5. Bepaal leeftijdsgroep en bereken scores
    const groep = bepaalLeeftijdsgroep(speler);
    const isV3 = versie === "v3";

    let overall: number | null = null;
    let pijlerScoresResult: Record<string, number> = {};

    if (!nietBeoordeeld) {
      if (isV3) {
        // V3: dynamische pijlers
        const result = berekenOverallV3(scores, groep as LeeftijdsgroepNaamV3);
        overall = result.overall;
        pijlerScoresResult = result.pijlerScores;
      } else {
        // Legacy: vaste 6 pijlers
        const result = berekenOverall(scores, groep);
        overall = result.overall;
        pijlerScoresResult = result.pijlerScores as Record<string, number>;
      }
    }

    // 6. Sla het rapport op
    const rapport = await db.scoutingRapport.create({
      data: {
        scoutId: scout.id,
        spelerId,
        seizoen: HUIDIG_SEIZOEN,
        context,
        contextDetail: contextDetail ?? null,
        scores: nietBeoordeeld ? {} : scores,
        opmerking: opmerking ?? null,
        overallScore: overall ?? null,
        verzoekId: verzoekId ?? null,
        relatie: relatie ?? "GEEN",
        nietBeoordeeld: nietBeoordeeld ?? false,
      },
    });

    logger.info(
      `Rapport ${rapport.id} opgeslagen: speler=${spelerId}, overall=${overall}${nietBeoordeeld ? " (niet beoordeeld)" : ""}${isV3 ? " [v3]" : ""}`
    );

    // 7. Bij nietBeoordeeld: sla SpelersKaart update, XP en badges over
    if (nietBeoordeeld) {
      return ok({
        rapport: {
          id: rapport.id,
          overall: null,
          pijlerScores: {},
          nietBeoordeeld: true,
        },
        xpGained: 0,
        totalXp: scout.xp,
        levelInfo: bepaalLevel(scout.xp),
      });
    }

    // 8. Update SpelersKaart (EWMA)
    const bestaandeKaart = await db.spelersKaart.findUnique({
      where: {
        spelerId_seizoen: {
          spelerId,
          seizoen: HUIDIG_SEIZOEN,
        },
      },
    });

    const nieuwOverall = berekenEWMA(overall as number, bestaandeKaart?.overall ?? null);
    const nieuwAantalRapporten = (bestaandeKaart?.aantalRapporten ?? 0) + 1;
    const trend = bestaandeKaart ? nieuwOverall - bestaandeKaart.overall : 0;

    if (isV3) {
      // V3: update met pijlerScores JSON
      const bestaandePijlerScores =
        bestaandeKaart?.pijlerScores && typeof bestaandeKaart.pijlerScores === "object"
          ? (bestaandeKaart.pijlerScores as Record<string, number>)
          : null;

      const nieuwePijlerScores = berekenEWMAPijlers(pijlerScoresResult, bestaandePijlerScores);

      await db.spelersKaart.upsert({
        where: {
          spelerId_seizoen: {
            spelerId,
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
          // Legacy kolommen - keep in sync for backward compat
          schot:
            nieuwePijlerScores["SCOREN"] ?? nieuwePijlerScores["BAL"] ?? bestaandeKaart?.schot ?? 0,
          aanval: nieuwePijlerScores["AANVALLEN"] ?? bestaandeKaart?.aanval ?? 0,
          passing: nieuwePijlerScores["TECHNIEK"] ?? bestaandeKaart?.passing ?? 0,
          verdediging: nieuwePijlerScores["VERDEDIGEN"] ?? bestaandeKaart?.verdediging ?? 0,
          fysiek: nieuwePijlerScores["FYSIEK"] ?? bestaandeKaart?.fysiek ?? 0,
          mentaal: nieuwePijlerScores["MENTAAL"] ?? bestaandeKaart?.mentaal ?? 0,
        },
        create: {
          spelerId,
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
      // Legacy: update met vaste 6 kolommen
      const nieuwSchot = berekenEWMA(pijlerScoresResult["SCH"] ?? 0, bestaandeKaart?.schot ?? null);
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
    }

    // 9. XP toekenning
    const isEersteVoorSpeler = !bestaandeKaart;
    const xpGained = berekenXP(isEersteVoorSpeler);

    const updatedScout = await db.scout.update({
      where: { id: scout.id },
      data: {
        xp: { increment: xpGained },
      },
    });

    const levelInfo = bepaalLevel(updatedScout.xp);
    if (levelInfo.level !== updatedScout.level) {
      await db.scout.update({
        where: { id: scout.id },
        data: { level: levelInfo.level },
      });
    }

    // 10. Check badges
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

    return ok({
      rapport: {
        id: rapport.id,
        overall,
        pijlerScores: pijlerScoresResult,
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
