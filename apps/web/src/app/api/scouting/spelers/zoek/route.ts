import { NextRequest } from "next/server";
import { z } from "zod";
import { logger, PEILJAAR } from "@oranje-wit/types";
import { prisma } from "@/lib/scouting/db/prisma";
import { ok, fail } from "@/lib/scouting/api";

const ZoekSchema = z.object({
  q: z.string().min(1, "Zoekterm is verplicht").max(100),
});

/**
 * GET /api/spelers/zoek?q=naam
 * Zoekt op roepnaam, achternaam, of rel_code (id)
 * Retourneert max 20 resultaten
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = ZoekSchema.safeParse({ q: searchParams.get("q") });

    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return fail(msg, 422, "VALIDATION_ERROR");
    }

    const { q } = parsed.data;

    const spelers = await prisma.speler.findMany({
      where: {
        OR: [
          { roepnaam: { contains: q, mode: "insensitive" } },
          { achternaam: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geslacht: true,
        huidig: true,
        status: true,
      },
      take: 20,
      orderBy: [{ roepnaam: "asc" }, { achternaam: "asc" }],
    });

    // Check welke spelers een foto hebben
    const relCodes = spelers.map((s) => s.id);
    const fotosAanwezig = await prisma.lidFoto.findMany({
      where: { relCode: { in: relCodes } },
      select: { relCode: true },
    });
    const fotoSet = new Set(fotosAanwezig.map((f) => f.relCode));

    const resultaten = spelers.map((speler) => {
      const huidig = speler.huidig as Record<string, unknown> | null;
      const leeftijd = PEILJAAR - speler.geboortejaar;
      const kleur = huidig?.kleur as string | undefined;
      const team = huidig?.team as string | undefined;

      return {
        relCode: speler.id,
        roepnaam: speler.roepnaam,
        achternaam: speler.achternaam,
        geslacht: speler.geslacht,
        geboortejaar: speler.geboortejaar,
        leeftijd,
        kleur: kleur ?? leeftijdNaarKleur(leeftijd),
        team: team ?? null,
        heeftFoto: fotoSet.has(speler.id),
      };
    });

    logger.info(`[zoek] q="${q}" → ${resultaten.length} resultaten`);
    return ok(resultaten);
  } catch (error) {
    logger.error("[zoek] Fout bij zoeken:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

/** Map leeftijd naar KNKV kleur */
function leeftijdNaarKleur(leeftijd: number): string {
  if (leeftijd <= 5) return "paars";
  if (leeftijd <= 7) return "blauw";
  if (leeftijd <= 9) return "groen";
  if (leeftijd <= 12) return "geel";
  if (leeftijd <= 15) return "oranje";
  if (leeftijd <= 18) return "rood";
  return "senior";
}
