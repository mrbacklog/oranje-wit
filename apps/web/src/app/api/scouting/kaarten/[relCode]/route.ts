import { NextRequest } from "next/server";
import { logger, PEILJAAR, HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "@/lib/scouting/db/prisma";
import { ok, fail } from "@/lib/scouting/api";
import { leeftijdsgroepVanLeeftijd } from "@/lib/scouting/leeftijdsgroep";
import { bepaalTier, SCORE_RANGES } from "@/lib/scouting/rating";
import { guardAuth } from "@oranje-wit/auth/checks";
import { filterSpelersData } from "@oranje-wit/auth/clearance";

/**
 * GET /api/kaarten/[relCode]
 *
 * Retourneert de SpelersKaart data incl. berekende tier, sterren en
 * achterkant-informatie. Geeft 404 als er nog geen kaart is.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ relCode: string }> }
) {
  const auth = await guardAuth();
  if (!auth.ok) return auth.response;

  try {
    const { relCode } = await params;

    if (!relCode || relCode.length < 2) {
      return fail("Ongeldige rel_code", 400, "BAD_REQUEST");
    }

    // Speler ophalen
    const speler = await (
      prisma.speler as unknown as {
        findUnique: (args: { where: { id: string } }) => Promise<{
          id: string;
          roepnaam: string;
          achternaam: string;
          geboortejaar: number;
          geslacht: string;
          huidig: unknown;
          rating: number | null;
        } | null>;
      }
    ).findUnique({
      where: { id: relCode },
    });

    if (!speler) {
      return fail(`Speler ${relCode} niet gevonden`, 404, "NOT_FOUND");
    }

    // SpelersKaart ophalen
    let kaart: {
      id: string;
      overall: number;
      schot: number;
      aanval: number;
      passing: number;
      verdediging: number;
      fysiek: number;
      mentaal: number;
      aantalRapporten: number;
      betrouwbaarheid: string;
      trendOverall: number | null;
      laatsteUpdate: Date;
    } | null = null;

    try {
      const kaarten = await prisma.spelersKaart.findMany({
        where: { spelerId: relCode, seizoen: HUIDIG_SEIZOEN },
        take: 1,
      });
      kaart = (kaarten[0] as any) ?? null;
    } catch {
      logger.info(`[kaarten] SpelersKaart tabel niet beschikbaar`);
    }

    if (!kaart) {
      return fail(`Geen spelerskaart voor ${relCode} in ${HUIDIG_SEIZOEN}`, 404, "NOT_FOUND");
    }

    // Leeftijdsgroep en tier berekenen
    const leeftijd = PEILJAAR - speler.geboortejaar;
    const groep = leeftijdsgroepVanLeeftijd(leeftijd);
    const tier = bepaalTier(kaart.overall, groep);

    // Sterren: relatief binnen de score-range van de groep
    const range = SCORE_RANGES[groep];
    const rangeSize = range.max - range.min;
    const relatiefPct = rangeSize > 0 ? (kaart.overall - range.min) / rangeSize : 0;
    const sterren = Math.max(1, Math.min(5, Math.ceil(relatiefPct * 5)));

    // Foto-check
    const fotoCount = await prisma.lidFoto.count({ where: { relCode } });
    const heeftFoto = fotoCount > 0;

    // Lid-gegevens
    const lid = await (
      prisma.lid as unknown as {
        findUnique: (args: {
          where: { relCode: string };
          select: { tussenvoegsel: true };
        }) => Promise<{ tussenvoegsel: string | null } | null>;
      }
    ).findUnique({
      where: { relCode },
      select: { tussenvoegsel: true },
    });

    const achternaam = lid?.tussenvoegsel
      ? `${lid.tussenvoegsel} ${speler.achternaam}`
      : speler.achternaam;

    // Huidig team
    const huidig = speler.huidig as Record<string, unknown> | null;
    const team = (huidig?.team as string) ?? undefined;

    // Laatste rapporten voor achterkant
    let rapporten: Array<{
      overallScore: number | null;
      datum: Date;
      scoutId: string | null;
    }> = [];
    try {
      rapporten = await prisma.scoutingRapport.findMany({
        where: { spelerId: relCode },
        orderBy: { datum: "desc" },
        take: 3,
        select: { overallScore: true, datum: true, scoutId: true },
      });
    } catch {
      logger.info(`[kaarten] Scouting rapporten niet beschikbaar`);
    }

    const result = {
      spelerId: relCode,
      roepnaam: speler.roepnaam,
      achternaam,
      leeftijd,
      team,
      overall: kaart.overall,
      stats: {
        schot: kaart.schot,
        aanval: kaart.aanval,
        passing: kaart.passing,
        verdediging: kaart.verdediging,
        fysiek: kaart.fysiek,
        mentaal: kaart.mentaal,
      },
      tier,
      sterren,
      fotoUrl: heeftFoto ? `/api/spelers/${relCode}/foto` : null,
      aantalRapporten: kaart.aantalRapporten,
      betrouwbaarheid: kaart.betrouwbaarheid,
      laatsteUpdate: kaart.laatsteUpdate,
      achterkant: {
        bio: {
          korfbalLeeftijd: leeftijd,
        },
        rapporten: rapporten
          .filter((r) => r.overallScore != null)
          .map((r) => ({
            score: r.overallScore!,
            datum: r.datum.toISOString(),
            scout: r.scoutId ?? undefined,
          })),
        trend: kaart.trendOverall ?? 0,
        radarScores: [
          kaart.schot,
          kaart.aanval,
          kaart.passing,
          kaart.verdediging,
          kaart.fysiek,
          kaart.mentaal,
        ],
      },
    };

    // Clearance-filtering: verwijder velden waarvoor de gebruiker geen recht heeft
    const clearance = auth.session.user.clearance;
    const gefilterd = filterSpelersData(result as Record<string, unknown>, clearance);

    logger.info(`[kaarten] ${relCode} -> clearance ${clearance}`);
    return ok(gefilterd);
  } catch (error) {
    logger.error("[kaarten] Fout:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
