import { NextRequest } from "next/server";
import { logger, HUIDIG_SEIZOEN, grofKorfbalLeeftijd, HUIDIGE_PEILDATUM } from "@oranje-wit/types";
import { prisma } from "@/lib/scouting/db/prisma";
import { ok, fail } from "@/lib/scouting/api";
import { guardAuth } from "@oranje-wit/auth/checks";
import { filterSpelersData } from "@oranje-wit/auth/clearance";

/**
 * GET /api/spelers/[relCode]
 * Retourneert volledig spelerprofiel
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

    // Basisgegevens speler (geen includes om tabel-ontbreek fouten te voorkomen)
    // Type assertion: Prisma 7 type recursion workaround op Speler model
    const speler = await (
      prisma.speler as unknown as {
        findUnique: (args: { where: { id: string } }) => Promise<{
          id: string;
          roepnaam: string;
          achternaam: string;
          geboortejaar: number;
          geslacht: string;
          huidig: unknown;
          spelerspad: unknown;
          seizoenenActief: number | null;
          status: string;
          notitie: string | null;
          rating: number | null;
        } | null>;
      }
    ).findUnique({
      where: { id: relCode },
    });

    if (!speler) {
      return fail(`Speler ${relCode} niet gevonden`, 404, "NOT_FOUND");
    }

    // Foto-check
    const fotoCount = await prisma.lidFoto.count({ where: { relCode } });
    const heeftFoto = fotoCount > 0;

    // Lid-gegevens voor tussenvoegsel
    // Type assertion: Prisma 7 type recursion workaround op Lid model
    const lid = await (
      prisma.lid as unknown as {
        findUnique: (args: {
          where: { relCode: string };
          select: { tussenvoegsel: true; lidSinds: true };
        }) => Promise<{ tussenvoegsel: string | null; lidSinds: Date | null } | null>;
      }
    ).findUnique({
      where: { relCode },
      select: { tussenvoegsel: true, lidSinds: true },
    });

    // Evaluaties (tabel bestaat altijd)
    let evaluaties: Array<{
      id: string;
      seizoen: string;
      ronde: number;
      type: string;
      scores: unknown;
      opmerking: string | null;
      coach: string | null;
      teamNaam: string | null;
    }> = [];
    try {
      evaluaties = await prisma.evaluatie.findMany({
        where: { spelerId: relCode, seizoen: HUIDIG_SEIZOEN },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          seizoen: true,
          ronde: true,
          type: true,
          scores: true,
          opmerking: true,
          coach: true,
          teamNaam: true,
        },
      });
    } catch {
      logger.info(`[profiel] Evaluaties niet beschikbaar voor ${relCode}`);
    }

    // Scouting rapporten (tabel bestaat mogelijk nog niet)
    let scoutingRapporten: Array<{
      id: string;
      seizoen: string;
      datum: Date;
      context: string;
      overallScore: number | null;
      opmerking: string | null;
    }> = [];
    try {
      scoutingRapporten = await prisma.scoutingRapport.findMany({
        where: { spelerId: relCode },
        orderBy: { datum: "desc" },
        take: 10,
        select: {
          id: true,
          seizoen: true,
          datum: true,
          context: true,
          overallScore: true,
          opmerking: true,
        },
      });
    } catch {
      logger.info(`[profiel] Scouting rapporten tabel niet beschikbaar`);
    }

    // Spelerskaart (tabel bestaat mogelijk nog niet)
    let spelersKaart: {
      overall: number;
      schot: number;
      aanval: number;
      passing: number;
      verdediging: number;
      fysiek: number;
      mentaal: number;
      aantalRapporten: number;
      betrouwbaarheid: string;
    } | null = null;
    try {
      const kaarten = await prisma.spelersKaart.findMany({
        where: { spelerId: relCode, seizoen: HUIDIG_SEIZOEN },
        take: 1,
      });
      spelersKaart = (kaarten[0] as any) ?? null;
    } catch {
      logger.info(`[profiel] Spelerskaart tabel niet beschikbaar`);
    }

    const huidig = speler.huidig as Record<string, unknown> | null;
    const spelerspad = speler.spelerspad as Array<Record<string, unknown>> | null;
    const leeftijd = grofKorfbalLeeftijd(speler.geboortejaar, HUIDIGE_PEILDATUM);
    const kleur = (huidig?.kleur as string) ?? leeftijdNaarKleur(leeftijd);

    const volleAchternaam = lid?.tussenvoegsel
      ? `${lid.tussenvoegsel} ${speler.achternaam}`
      : speler.achternaam;

    const profiel = {
      relCode: speler.id,
      roepnaam: speler.roepnaam,
      achternaam: speler.achternaam,
      volleAchternaam,
      geboortejaar: speler.geboortejaar,
      geslacht: speler.geslacht,
      leeftijd,
      kleur,
      lidSinds: lid?.lidSinds ?? null,
      seizoenenActief: speler.seizoenenActief,
      status: speler.status,
      notitie: speler.notitie,
      rating: speler.rating,
      huidig: huidig
        ? {
            team: huidig.team ?? null,
            categorie: huidig.categorie ?? null,
            kleur: huidig.kleur ?? kleur,
            leeftijd: huidig.leeftijd ?? leeftijd,
          }
        : null,
      spelerspad: spelerspad ?? [],
      heeftFoto,
      fotoUrl: heeftFoto ? `/api/spelers/${relCode}/foto` : null,
      scoutingRapporten,
      spelersKaart,
      evaluaties,
    };

    // Clearance-filtering: verwijder velden waarvoor de gebruiker geen recht heeft
    const clearance = auth.session.user.clearance;
    const gefilterd = filterSpelersData(profiel as Record<string, unknown>, clearance);

    logger.info(
      `[profiel] ${relCode} -> ${speler.roepnaam} ${speler.achternaam} (clearance ${clearance})`
    );
    return ok(gefilterd);
  } catch (error) {
    logger.error("[profiel] Fout bij ophalen:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

function leeftijdNaarKleur(leeftijd: number): string {
  if (leeftijd <= 5) return "paars";
  if (leeftijd <= 7) return "blauw";
  if (leeftijd <= 9) return "groen";
  if (leeftijd <= 12) return "geel";
  if (leeftijd <= 15) return "oranje";
  if (leeftijd <= 18) return "rood";
  return "senior";
}
