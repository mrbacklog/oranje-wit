import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { LogActie } from "@oranje-wit/database";

// Interne helper — geen "use server" want dit is geen server action
export async function registreerLog(
  werkitemId: string,
  auteurNaam: string,
  auteurEmail: string,
  actie: LogActie,
  detail?: string
): Promise<void> {
  try {
    await prisma.werkitemLog.create({
      data: { werkitemId, auteurNaam, auteurEmail, actie, detail: detail ?? null },
    });
  } catch (error) {
    logger.warn("registreerLog mislukt (niet-kritisch):", error);
  }
}
