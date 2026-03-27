import { z } from "zod";
import { auth } from "@oranje-wit/auth";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";

// Prisma 7 type recursion workarounds
const db = prisma as any;

const VergelijkingSchema = z.object({
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  opmerking: z.string().optional(),
  spelerIds: z.array(z.string().min(1)).min(2).max(6),
  posities: z.array(
    z.object({
      spelerId: z.string().min(1),
      pijlerCode: z.string().min(1),
      balkPositie: z.number().min(0).max(100),
    })
  ),
  teamId: z.number().int().positive().optional(),
  verzoekId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticatie
    const session = await auth();
    if (!session?.user?.email) {
      return fail("Niet ingelogd", 401, "UNAUTHORIZED");
    }

    // 2. Valideer body
    const parsed = await parseBody(request, VergelijkingSchema);
    if (!parsed.ok) return parsed.response;

    const { context, opmerking, spelerIds, posities, teamId, verzoekId } = parsed.data;

    // 3. Vind of maak Scout-profiel
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

    // 4. Controleer dat alle spelers bestaan
    for (const spelerId of spelerIds) {
      const speler = await db.speler.findUnique({ where: { id: spelerId } });
      if (!speler) {
        return fail(`Speler ${spelerId} niet gevonden`, 404, "NOT_FOUND");
      }
    }

    // 5. Sla de vergelijking op
    // Note: ScoutingVergelijking en ScoutingVergelijkingPositie modellen
    // moeten nog worden aangemaakt in het Prisma schema. Voor nu slaan we
    // het op als een ScoutingRapport met type "vergelijking" in de scores JSON.
    // Dit is een tijdelijke oplossing totdat de migratie is uitgevoerd.

    // Groepeer posities per speler
    const positiesPerSpeler: Record<string, Record<string, number>> = {};
    for (const pos of posities) {
      if (!positiesPerSpeler[pos.spelerId]) positiesPerSpeler[pos.spelerId] = {};
      positiesPerSpeler[pos.spelerId][pos.pijlerCode] = pos.balkPositie;
    }

    // Sla op als een speciaal rapport per speler met de balkposities als scores
    const rapportIds: string[] = [];
    for (const spelerId of spelerIds) {
      const spelerPosities = positiesPerSpeler[spelerId] ?? {};

      const rapport = await db.scoutingRapport.create({
        data: {
          scoutId: scout.id,
          spelerId,
          seizoen: HUIDIG_SEIZOEN,
          context,
          contextDetail: `Vergelijking: ${spelerIds.length} spelers`,
          scores: {
            _type: "vergelijking",
            posities: spelerPosities,
            vergelekenMet: spelerIds.filter((id: string) => id !== spelerId),
          },
          opmerking: opmerking ?? null,
          overallScore: null,
          verzoekId: verzoekId ?? null,
        },
      });

      rapportIds.push(rapport.id);
    }

    logger.info(
      `Vergelijking opgeslagen: ${spelerIds.length} spelers, ${rapportIds.length} rapporten`
    );

    return ok({
      rapportIds,
      spelerIds,
      aantalSpelers: spelerIds.length,
    });
  } catch (error) {
    logger.error("Fout bij opslaan vergelijking:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
