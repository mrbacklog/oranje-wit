import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { Prisma } from "@oranje-wit/database";
import type { LogInput } from "./types";

export async function logWerkbordMutatie(input: LogInput): Promise<void> {
  try {
    await prisma.werkbordMutatie.create({
      data: {
        versieId: input.versieId,
        type: input.type,
        doorId: input.doorId,
        payload: input.payload as unknown as Prisma.InputJsonValue,
        inverse: (input.inverse ?? null) as unknown as Prisma.InputJsonValue,
        spelerId: input.spelerId ?? null,
        vanTeamId: input.vanTeamId ?? null,
        naarTeamId: input.naarTeamId ?? null,
        selectieGroepId: input.selectieGroepId ?? null,
        sessionId: input.sessionId ?? null,
      },
    });
  } catch (error) {
    logger.warn("logWerkbordMutatie kon niet opslaan:", error);
  }
}
