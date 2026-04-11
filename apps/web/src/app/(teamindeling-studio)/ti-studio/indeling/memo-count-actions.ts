// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-count-actions.ts
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";

export async function getOpenMemoCount(kadersId?: string): Promise<number> {
  try {
    return await prisma.werkitem.count({
      where: {
        ...(kadersId ? { kadersId } : { kaders: { isWerkseizoen: true } }),
        type: "MEMO",
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    });
  } catch (error) {
    logger.warn("getOpenMemoCount mislukt:", error);
    return 0;
  }
}
