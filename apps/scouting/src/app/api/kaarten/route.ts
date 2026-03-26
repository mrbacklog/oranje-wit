import { logger, PEILJAAR, HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";
import { leeftijdsgroepVanLeeftijd } from "@/lib/scouting/leeftijdsgroep";
import { bepaalTier, SCORE_RANGES } from "@/lib/scouting/rating";

/**
 * GET /api/kaarten
 *
 * Retourneert alle spelerskaarten voor het huidige seizoen,
 * inclusief berekende tier en sterren. Gesorteerd op overall desc.
 */
export async function GET() {
  try {
    let kaarten: Array<{
      id: string;
      spelerId: string;
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
    }> = [];

    try {
      kaarten = await prisma.spelersKaart.findMany({
        where: { seizoen: HUIDIG_SEIZOEN },
        orderBy: { overall: "desc" },
      });
    } catch {
      logger.info("[kaarten] SpelersKaart tabel niet beschikbaar");
      return ok([]);
    }

    if (kaarten.length === 0) {
      return ok([]);
    }

    // Speler-info ophalen voor alle spelerId's
    const spelerIds = kaarten.map((k) => k.spelerId);
    const spelers = await (
      prisma.speler as unknown as {
        findMany: (args: {
          where: { id: { in: string[] } };
          select: {
            id: true;
            roepnaam: true;
            achternaam: true;
            geboortejaar: true;
            huidig: true;
          };
        }) => Promise<
          Array<{
            id: string;
            roepnaam: string;
            achternaam: string;
            geboortejaar: number;
            huidig: unknown;
          }>
        >;
      }
    ).findMany({
      where: { id: { in: spelerIds } },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        huidig: true,
      },
    });

    const spelerMap = new Map(spelers.map((s) => [s.id, s]));

    // Lid-gegevens voor tussenvoegsels
    const lids = await (
      prisma.lid as unknown as {
        findMany: (args: {
          where: { relCode: { in: string[] } };
          select: { relCode: true; tussenvoegsel: true };
        }) => Promise<Array<{ relCode: string; tussenvoegsel: string | null }>>;
      }
    ).findMany({
      where: { relCode: { in: spelerIds } },
      select: { relCode: true, tussenvoegsel: true },
    });
    const lidMap = new Map(lids.map((l) => [l.relCode, l]));

    // Foto-info
    const fotos = await prisma.lidFoto.findMany({
      where: { relCode: { in: spelerIds } },
      select: { relCode: true },
    });
    const fotoSet = new Set(fotos.map((f) => f.relCode));

    const result = kaarten
      .map((kaart) => {
        const speler = spelerMap.get(kaart.spelerId);
        if (!speler) return null;

        const lid = lidMap.get(kaart.spelerId);
        const leeftijd = PEILJAAR - speler.geboortejaar;
        const groep = leeftijdsgroepVanLeeftijd(leeftijd);
        const tier = bepaalTier(kaart.overall, groep);

        const range = SCORE_RANGES[groep];
        const rangeSize = range.max - range.min;
        const relatiefPct = rangeSize > 0 ? (kaart.overall - range.min) / rangeSize : 0;
        const sterren = Math.max(1, Math.min(5, Math.ceil(relatiefPct * 5)));

        const achternaam = lid?.tussenvoegsel
          ? `${lid.tussenvoegsel} ${speler.achternaam}`
          : speler.achternaam;

        const huidig = speler.huidig as Record<string, unknown> | null;
        const team = (huidig?.team as string) ?? undefined;

        return {
          spelerId: kaart.spelerId,
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
          fotoUrl: fotoSet.has(kaart.spelerId) ? `/api/spelers/${kaart.spelerId}/foto` : null,
          laatsteUpdate: kaart.laatsteUpdate.toISOString(),
          achterkant: {
            bio: { korfbalLeeftijd: leeftijd },
            rapporten: [],
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
      })
      .filter(Boolean);

    logger.info(`[kaarten] ${result.length} kaarten opgehaald`);
    return ok(result);
  } catch (error) {
    logger.error("[kaarten] Fout:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
