"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { getActiefSeizoen } from "@oranje-wit/teamindeling-shared/seizoen";
import type { ActionResult } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

export type VoorstelType = "SPELERWIJZIGING" | "TEAMSTRUCTUUR" | "OVERIG";

export interface VoorstelData {
  type: VoorstelType;
  omschrijving: string;
  spelerId?: string;
  teamNaam?: string;
}

/**
 * Dien een wijzigingsvoorstel in als coördinator.
 */
export async function dienVoorstelIn(data: VoorstelData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTC();
    const email = session.user!.email!;
    const seizoen = await getActiefSeizoen();

    // Zoek coördinator op e-mail
    const coordinator = await prisma.coordinator.findUnique({
      where: { email },
      select: { id: true, naam: true },
    });

    if (!coordinator) {
      return { ok: false, error: "Jouw account is niet gekoppeld als coördinator." };
    }

    if (!data.omschrijving.trim()) {
      return { ok: false, error: "Omschrijving is verplicht." };
    }

    const voorstel = await prisma.coordinatorVoorstel.create({
      data: {
        coordinatorId: coordinator.id,
        type: data.type,
        omschrijving: data.omschrijving.trim(),
        spelerId: data.spelerId ?? null,
        teamNaam: data.teamNaam ?? null,
        seizoen,
      },
    });

    logger.info(`Voorstel ingediend door ${coordinator.naam}: ${data.type}`);
    return { ok: true, data: { id: voorstel.id } };
  } catch (error) {
    logger.error("dienVoorstelIn mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
