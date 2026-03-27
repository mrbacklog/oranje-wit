import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { logger } from "@oranje-wit/types";

const CLEANUP_KEY = process.env.CLEANUP_API_KEY;
const SOFT_DELETE_DAGEN = 30;
const SNAPSHOT_DAGEN = 90;

/**
 * POST /api/cleanup
 * Ruim soft-deleted scenario's (>30d) en oude snapshots (>90d) op.
 * Beschermd met API-key header.
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const key = request.headers.get("x-api-key");
    if (!CLEANUP_KEY || key !== CLEANUP_KEY) {
      return fail("Niet geautoriseerd", 401, "UNAUTHORIZED");
    }

    const nu = new Date();

    // Scenario's soft-deleted > 30 dagen → hard delete
    const scenarioDrempel = new Date(nu.getTime() - SOFT_DELETE_DAGEN * 24 * 60 * 60 * 1000);
    const oudeScenarios = await prisma.scenario.findMany({
      where: { verwijderdOp: { lt: scenarioDrempel } },
      select: { id: true, naam: true },
    });
    for (const s of oudeScenarios) {
      await prisma.scenario.delete({ where: { id: s.id } });
      logger.info(`[cleanup] Scenario definitief verwijderd: "${s.naam}" (${s.id})`);
    }

    // Snapshots > 90 dagen verwijderen
    const snapshotDrempel = new Date(nu.getTime() - SNAPSHOT_DAGEN * 24 * 60 * 60 * 1000);
    const oudeSnapshots = await prisma.scenarioSnapshot.deleteMany({
      where: { createdAt: { lt: snapshotDrempel } },
    });

    const resultaat = {
      scenariosVerwijderd: oudeScenarios.length,
      snapshotsVerwijderd: oudeSnapshots.count,
    };

    logger.info(
      `[cleanup] ${resultaat.scenariosVerwijderd} scenario's, ${resultaat.snapshotsVerwijderd} snapshots opgeruimd`
    );
    return ok(resultaat);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
