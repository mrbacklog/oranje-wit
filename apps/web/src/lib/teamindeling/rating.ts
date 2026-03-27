import {
  logger,
  HUIDIG_SEIZOEN,
  PEILJAAR,
  A_CATEGORIE_USS,
  knkvNaarUSS,
  coachNaarUSS,
  parseACatKey,
} from "@oranje-wit/types";
import type { EvaluatieScore } from "@oranje-wit/types";

/** Pure berekeningsfunctie: USS-rating op basis van teamscore + trainerniveau.
 *  Gebruikt coachNaarUSS uit het USS-model. */
export function berekenRating(teamscore: number, niveau?: number): number {
  if (niveau == null) return Math.round(teamscore);
  return coachNaarUSS(teamscore, niveau);
}

/** Bepaal de USS-teamscore voor een speler op basis van team + competitiedata */
export async function bepaalTeamscore(
  speler: { huidig: any },
  seizoen: string,
  prisma: any
): Promise<number | null> {
  const huidig = speler.huidig;
  if (!huidig?.team) return null;

  // Zoek het ReferentieTeam
  const refTeam = await prisma.referentieTeam.findFirst({
    where: { naam: huidig.team, seizoen },
  });
  if (!refTeam) return null;

  // Gebruik opgeslagen teamscore als die gezet is (vanuit conceptindeling of handmatig)
  if (refTeam.teamscore != null) return refTeam.teamscore;

  // A-categorie: USS-waarden uit het gedeelde score-model
  if (huidig.a_categorie && refTeam.poolVeld) {
    const key = parseACatKey(refTeam.poolVeld);
    if (key && A_CATEGORIE_USS[key] != null) {
      return A_CATEGORIE_USS[key];
    }
    // Fallback: probeer categorie + niveau
    if (huidig.a_categorie && refTeam.niveau) {
      const niveauKey =
        refTeam.niveau === "Hoofdklasse" || refTeam.niveau === "Overgangsklasse"
          ? "HK"
          : refTeam.niveau.replace(/e klasse/, "").trim();
      const fallbackKey = `${huidig.a_categorie}-${niveauKey}`;
      if (A_CATEGORIE_USS[fallbackKey] != null) {
        return A_CATEGORIE_USS[fallbackKey];
      }
    }
    return null;
  }

  // B-categorie: KNKV-rating direct als USS (via knkvNaarUSS)
  const poolVeld = refTeam.poolVeld;
  if (!poolVeld) return null;

  // Zoek meest recente periode (veld_voorjaar > zaal > veld_najaar)
  const periodes = ["veld_voorjaar", "zaal", "veld_najaar"];
  for (const periode of periodes) {
    const poolStand = await prisma.poolStand.findUnique({
      where: {
        seizoen_periode_pool: { seizoen, periode, pool: poolVeld },
      },
      include: { regels: { where: { isOW: true } } },
    });
    if (poolStand?.regels?.length > 0) {
      // KNKV-rating direct als USS (was: punten * 8)
      return knkvNaarUSS(poolStand.regels[0].punten);
    }
  }

  return null;
}

/** Haal het niveau uit een trainer-evaluatie van het seizoen.
 *  Als `ronde` is meegegeven: exacte ronde. Anders: meest recente ronde. */
export async function haalLaatsteNiveau(
  spelerId: string,
  seizoen: string,
  prisma: any,
  ronde?: number
): Promise<number | undefined> {
  const evaluatie =
    ronde != null
      ? await prisma.evaluatie.findFirst({
          where: { spelerId, seizoen, type: "trainer", ronde },
          select: { scores: true },
        })
      : await prisma.evaluatie.findFirst({
          where: { spelerId, seizoen, type: "trainer" },
          orderBy: { ronde: "desc" },
          select: { scores: true },
        });
  if (!evaluatie?.scores) return undefined;
  const scores = evaluatie.scores as EvaluatieScore;
  return scores.niveau ?? undefined;
}

/** Herbereken USS-ratings voor alle spelers met een huidig team */
export async function berekenAlleRatings(
  seizoen: string,
  prisma: any,
  ronde?: number
): Promise<{ bijgewerkt: number; overgeslagen: number; fouten: number }> {
  const spelers = await prisma.speler.findMany({
    where: { huidig: { not: null } },
    select: {
      id: true,
      huidig: true,
      rating: true,
      ratingBerekend: true,
      geboortejaar: true,
    },
  });

  let bijgewerkt = 0;
  let overgeslagen = 0;
  let fouten = 0;

  for (const speler of spelers) {
    try {
      // Ratings alleen voor spelers met korfballeeftijd < 20
      if (PEILJAAR - speler.geboortejaar >= 20) {
        overgeslagen++;
        continue;
      }

      const teamscore = await bepaalTeamscore(speler, seizoen, prisma);
      if (teamscore == null) {
        overgeslagen++;
        continue;
      }

      const niveau = await haalLaatsteNiveau(speler.id, seizoen, prisma, ronde);
      const berekend = berekenRating(teamscore, niveau);

      // Update altijd beide velden — handmatige override gebeurt via RatingEditor
      const updateData: any = { ratingBerekend: berekend, rating: berekend };

      await prisma.speler.update({
        where: { id: speler.id },
        data: updateData,
      });
      bijgewerkt++;
    } catch (error) {
      logger.warn(`Rating berekening mislukt voor speler ${speler.id}:`, error);
      fouten++;
    }
  }

  logger.info(
    `Ratings berekend: ${bijgewerkt} bijgewerkt, ${overgeslagen} overgeslagen, ${fouten} fouten`
  );
  return { bijgewerkt, overgeslagen, fouten };
}

/** Herbereken ratings voor het huidige seizoen */
export async function herbereken(prisma: any) {
  return berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
}
