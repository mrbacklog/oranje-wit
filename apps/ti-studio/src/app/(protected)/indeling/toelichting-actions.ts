"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";

export type ToelichtingData = {
  id: string;
  auteurNaam: string;
  auteurEmail: string;
  tekst: string;
  timestamp: string; // ISO string
};

export async function createToelichting(
  werkitemId: string,
  tekst: string
): Promise<ActionResult<ToelichtingData>> {
  try {
    const session = await requireTC();
    const user = session.user as Record<string, unknown>;
    const auteurEmail = (user?.email as string) ?? "onbekend";
    const auteurNaam = (user?.name as string) ?? auteurEmail.split("@")[0];

    const toelichting = await prisma.werkitemToelichting.create({
      data: { werkitemId, auteurNaam, auteurEmail, tekst },
    });

    revalidatePath("/memo");
    return {
      ok: true,
      data: {
        id: toelichting.id,
        auteurNaam: toelichting.auteurNaam,
        auteurEmail: toelichting.auteurEmail,
        tekst: toelichting.tekst,
        timestamp: toelichting.timestamp.toISOString(),
      },
    };
  } catch (error) {
    logger.error("createToelichting mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
