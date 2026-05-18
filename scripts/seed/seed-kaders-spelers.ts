/**
 * seed-kaders-spelers — voor elke Speler een KadersSpeler-record in het
 * actieve werkseizoen-Kaders. Pool-query op /indeling vereist dit; zonder
 * deze records is de spelerspool leeg ondanks dat Spelers en TeamSpelers
 * bestaan.
 *
 * Idempotent: upsert op samengestelde unique (kadersId, spelerId).
 */
import { prisma } from "./types";
import { logger } from "@oranje-wit/types";

export async function seedKadersSpelers(kadersId: string): Promise<void> {
  logger.info("[seed-kaders-spelers] starten");

  const spelers = await prisma.speler.findMany({ select: { id: true } });

  let aangemaakt = 0;
  for (const s of spelers) {
    await prisma.kadersSpeler.upsert({
      where: { kadersId_spelerId: { kadersId, spelerId: s.id } },
      create: { kadersId, spelerId: s.id, gezienStatus: "ONGEZIEN" },
      update: {},
    });
    aangemaakt++;
  }

  logger.info(`[seed-kaders-spelers] klaar — ${aangemaakt} KadersSpeler-records`);
}
