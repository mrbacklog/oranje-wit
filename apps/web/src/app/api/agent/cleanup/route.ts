import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { logger } from "@oranje-wit/types";

/**
 * POST /api/agent/cleanup
 *
 * Ruimt agent-werkindeling-versies op die zijn aangemaakt tijdens een agent-sessie.
 * Verificatie via AGENT_SECRET — geen NextAuth sessie nodig (agents zijn mogelijk
 * al uitgelogd als ze cleanup aanroepen).
 *
 * Body: `{ secret: string, agentRunId: string }`
 * Response: `{ ok: true, data: { werkindelingenVerwijderd: number, agentRunId: string } }`
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Ongeldige JSON", 400, "BAD_REQUEST");
  }

  const { secret, agentRunId } = (body ?? {}) as {
    secret?: unknown;
    agentRunId?: unknown;
  };

  if (typeof secret !== "string" || secret.length === 0) {
    return fail("secret is verplicht", 400, "BAD_REQUEST");
  }

  const agentSecret = process.env.AGENT_SECRET;
  if (!agentSecret || secret !== agentSecret) {
    return fail("Ongeldige agent secret", 403, "FORBIDDEN");
  }

  if (typeof agentRunId !== "string" || agentRunId.length === 0) {
    return fail("agentRunId is verplicht", 400, "BAD_REQUEST");
  }

  try {
    // Vind alle werkindeling-versies aangemaakt door deze agent-run.
    // Naamconventie: "agent-[agentRunId]" of "agent-[agentRunId]-*"
    const agentWerkindelingen = await prisma.werkindeling.findMany({
      where: { naam: { startsWith: `agent-${agentRunId}` } },
      select: { id: true, naam: true },
    });

    for (const w of agentWerkindelingen) {
      await prisma.werkindeling.delete({ where: { id: w.id } });
      logger.warn(`[agent-cleanup] Werkindeling verwijderd: "${w.naam}" (${w.id})`);
    }

    const resultaat = {
      werkindelingenVerwijderd: agentWerkindelingen.length,
      agentRunId,
    };

    logger.warn(
      `[agent-cleanup] Cleanup klaar voor run ${agentRunId}: ${agentWerkindelingen.length} versies verwijderd`
    );
    return ok(resultaat);
  } catch (error) {
    logger.warn("[api/agent/cleanup]", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
