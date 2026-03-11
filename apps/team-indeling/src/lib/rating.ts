import { logger, HUIDIG_SEIZOEN, PEILJAAR } from "@oranje-wit/types";
import type { EvaluatieScore } from "@oranje-wit/types";

// Vaste teamscores voor A-categorie (key = prefix van poolVeld)
const A_CATEGORIE_SCORES: Record<string, number> = {
  "U19-HK": 180,
  "U19-OK": 180, // Overgangsklasse = zelfde als HK
  "U19-1": 160,
  "U19-2": 140,
  "U17-HK": 160,
  "U17-1": 150,
  "U17-2": 140,
  "U15-HK": 150,
  "U15-1": 130,
};

// Niveau-aanpassing op basis van trainer-evaluatie
const NIVEAU_AANPASSING: Record<number, number> = {
  5: 0.1,
  4: 0.05,
  3: 0,
  2: -0.05,
  1: -0.1,
};

/** Pure berekeningsfunctie: teamscore × (1 + aanpassing) → afgerond geheel getal */
export function berekenRating(teamscore: number, niveau?: number): number {
  const factor = niveau != null ? (NIVEAU_AANPASSING[niveau] ?? 0) : 0;
  return Math.round(teamscore * (1 + factor));
}

/**
 * Parse A-categorie key uit een poolVeld naam.
 * Bijv. "U17-HK-07" → "U17-HK", "U19-2-08" → "U19-2"
 */
function parseACatKey(poolVeld: string): string | null {
  const match = poolVeld.match(/^(U\d{2})-(HK|OK|\d+)/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

/** Bepaal de teamscore voor een speler op basis van team + competitiedata */
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

  // A-categorie: vaste mapping op basis van poolVeld prefix
  if (huidig.a_categorie && refTeam.poolVeld) {
    const key = parseACatKey(refTeam.poolVeld);
    if (key && A_CATEGORIE_SCORES[key] != null) {
      return A_CATEGORIE_SCORES[key];
    }
    // Fallback: probeer categorie + niveau
    if (huidig.a_categorie && refTeam.niveau) {
      const niveauKey =
        refTeam.niveau === "Hoofdklasse" || refTeam.niveau === "Overgangsklasse"
          ? "HK"
          : refTeam.niveau.replace(/e klasse/, "").trim();
      const fallbackKey = `${huidig.a_categorie}-${niveauKey}`;
      if (A_CATEGORIE_SCORES[fallbackKey] != null) {
        return A_CATEGORIE_SCORES[fallbackKey];
      }
    }
    return null;
  }

  // B-categorie: zoek PoolStandRegel via poolVeld
  const poolVeld = refTeam.poolVeld;
  if (!poolVeld) return null;

  // Zoek meest recente periode (veld_voorjaar > zaal > veld_najaar)
  const periodes = ["veld_voorjaar", "zaal", "veld_najaar"];
  for (const periode of periodes) {
    const poolStand = await prisma.poolStand.findUnique({
      where: { seizoen_periode_pool: { seizoen, periode, pool: poolVeld } },
      include: { regels: { where: { isOW: true } } },
    });
    if (poolStand?.regels?.length > 0) {
      // Competitiepunten schalen naar teamscore-range (0-25 → ~10-200)
      return Math.round(poolStand.regels[0].punten * 8);
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

/** Herbereken ratings voor alle spelers met een huidig team */
export async function berekenAlleRatings(
  seizoen: string,
  prisma: any,
  ronde?: number
): Promise<{ bijgewerkt: number; overgeslagen: number; fouten: number }> {
  const spelers = await prisma.speler.findMany({
    where: { huidig: { not: null } },
    select: { id: true, huidig: true, rating: true, ratingBerekend: true, geboortejaar: true },
  });

  let bijgewerkt = 0;
  let overgeslagen = 0;
  let fouten = 0;

  for (const speler of spelers) {
    try {
      // Rankings alleen voor spelers met korfballeeftijd < 20
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
