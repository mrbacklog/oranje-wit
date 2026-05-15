/**
 * Agent Cleanup Endpoint
 *
 * POST /api/agent/cleanup
 * Body: { secret: string, agentRunId: string }
 *
 * Draait alle niet-teruggedraaide AgentMutaties terug voor een gegeven agentRunId.
 * Verwerkt mutaties in omgekeerde volgorde (nieuwste eerst).
 *
 * Beveiligd via AGENT_SECRET env var (min. 32 tekens).
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@oranje-wit/types";
import { db as prisma } from "@/lib/db";
import { verplaatsSpelerInternal } from "@/actions/werkbord/verplaats-speler";

interface CleanupBody {
  secret: string;
  agentRunId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CleanupBody;

  try {
    body = (await req.json()) as CleanupBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldige JSON body" }, { status: 400 });
  }

  const { secret, agentRunId } = body;

  // Valideer secret
  const agentSecret = process.env.AGENT_SECRET;
  if (!secret || !agentSecret || agentSecret.length < 32 || secret !== agentSecret) {
    logger.warn("agent/cleanup: ongeldig secret ontvangen");
    return NextResponse.json({ ok: false, error: "Ongeautoriseerd" }, { status: 401 });
  }

  if (!agentRunId || typeof agentRunId !== "string" || agentRunId.length === 0) {
    return NextResponse.json({ ok: false, error: "agentRunId ontbreekt" }, { status: 400 });
  }

  // Haal alle niet-teruggedraaide mutaties op in omgekeerde volgorde (nieuwste eerst)
  const mutaties = await prisma.agentMutatie.findMany({
    where: {
      agentRunId,
      rolledBackAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  logger.info(`agent/cleanup: ${mutaties.length} mutaties gevonden voor agentRunId=${agentRunId}`);

  let rolledBack = 0;

  for (const mutatie of mutaties) {
    try {
      if (mutatie.type === "speler_verplaats") {
        const inverse = mutatie.inverse as {
          actie: string;
          rel_code: string;
          versieId: string;
          doel: string | null;
        };

        await verplaatsSpelerInternal({
          versieId: inverse.versieId,
          rel_code: inverse.rel_code,
          naarTeamId: inverse.doel,
        });

        logger.info(
          `agent/cleanup: mutatie ${mutatie.id} teruggedraaid — rel_code=${inverse.rel_code} → ${inverse.doel ?? "pool"}`
        );
      } else {
        logger.warn(`agent/cleanup: onbekend mutatie-type "${mutatie.type}" — overgeslagen`);
      }

      // Markeer als teruggedraaid
      await prisma.agentMutatie.update({
        where: { id: mutatie.id },
        data: { rolledBackAt: new Date() },
      });

      rolledBack++;
    } catch (error) {
      logger.warn(`agent/cleanup: fout bij terugdraaien mutatie ${mutatie.id}:`, error);
      // Doorgaan met volgende mutatie
    }
  }

  logger.info(
    `agent/cleanup: ${rolledBack}/${mutaties.length} mutaties teruggedraaid voor agentRunId=${agentRunId}`
  );

  return NextResponse.json({ ok: true, rolledBack });
}
