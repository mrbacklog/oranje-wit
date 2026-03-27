import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";
import { requireScout } from "@/lib/scouting/auth/helpers";

// Prisma 7 type recursion workaround
const db = prisma as any;

/**
 * GET /api/mijn-verzoeken
 *
 * Retourneert alle scouting-verzoeken waaraan de ingelogde scout
 * is toegewezen, met het verzoek-detail en het aantal eigen rapporten.
 *
 * Geen spelerskaart-data (anti-anchoring: scout mag niet beinvloed
 * worden door eerdere scores voordat het rapport is ingevuld).
 *
 * Sortering: OPEN/ACTIEF eerst, dan AFGEROND.
 */
export async function GET() {
  try {
    // 1. Authenticatie: ingelogde scout
    const authResult = await requireScout();
    if (!authResult.ok) return authResult.response;
    const scout = authResult.scout;

    // 2. Haal alle toewijzingen op met verzoek-detail
    const toewijzingen = await db.scoutToewijzing.findMany({
      where: { scoutId: scout.id },
      include: {
        verzoek: {
          select: {
            id: true,
            type: true,
            doel: true,
            status: true,
            toelichting: true,
            deadline: true,
            seizoen: true,
            spelerIds: true,
            teamId: true,
            anoniem: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Tel het aantal rapporten per verzoek door deze scout
    const verzoekIds = toewijzingen.map((t: { verzoek: { id: string } }) => t.verzoek.id);

    const rapportTellingen = await db.scoutingRapport.groupBy({
      by: ["verzoekId"],
      where: {
        scoutId: scout.id,
        verzoekId: { in: verzoekIds },
      },
      _count: { id: true },
    });

    const rapportCountMap = new Map<string, number>();
    for (const telling of rapportTellingen) {
      rapportCountMap.set(
        (telling as { verzoekId: string }).verzoekId,
        (telling as { _count: { id: number } })._count.id
      );
    }

    // 4. Bouw response — bewust geen spelerskaart-data (anti-anchoring)
    type ToewijzingRecord = {
      id: string;
      status: string;
      createdAt: Date;
      verzoek: {
        id: string;
        type: string;
        doel: string;
        status: string;
        toelichting: string | null;
        deadline: Date | null;
        seizoen: string;
        spelerIds: string[];
        teamId: string | null;
        anoniem: boolean;
        createdAt: Date;
      };
    };

    const result = toewijzingen.map((t: ToewijzingRecord) => ({
      toewijzingId: t.id,
      toewijzingStatus: t.status,
      toewijzingDatum: t.createdAt,
      verzoek: {
        id: t.verzoek.id,
        type: t.verzoek.type,
        doel: t.verzoek.doel,
        status: t.verzoek.status,
        toelichting: t.verzoek.toelichting,
        deadline: t.verzoek.deadline,
        seizoen: t.verzoek.seizoen,
        aantalSpelers: t.verzoek.spelerIds.length,
        heeftTeam: t.verzoek.teamId !== null,
        anoniem: t.verzoek.anoniem,
        aangemaakt: t.verzoek.createdAt,
      },
      aantalRapporten: rapportCountMap.get(t.verzoek.id) ?? 0,
    }));

    // 5. Sorteer: OPEN/ACTIEF verzoeken eerst, dan AFGEROND/GEANNULEERD
    const statusPrioriteit: Record<string, number> = {
      UITGENODIGD: 0,
      GEACCEPTEERD: 1,
      AFGEROND: 2,
      AFGEWEZEN: 3,
      GESTOPT: 3,
    };

    result.sort((a: { toewijzingStatus: string }, b: { toewijzingStatus: string }) => {
      const prioA = statusPrioriteit[a.toewijzingStatus] ?? 4;
      const prioB = statusPrioriteit[b.toewijzingStatus] ?? 4;
      return prioA - prioB;
    });

    return ok({
      verzoeken: result,
      totaal: result.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Niet ingelogd") {
      return fail(error.message, 401, "UNAUTHORIZED");
    }
    if (error instanceof Error && error.message.includes("scout-profiel")) {
      return fail(error.message, 403, "FORBIDDEN");
    }
    logger.error("Fout bij ophalen mijn verzoeken:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
