/**
 * CRUD voor DaisyActie — audit-log en undo-mechanisme.
 */
import { prisma } from "@/lib/teamindeling/db/prisma";

export interface DaisyActieRecord {
  id: string;
  sessieId: string;
  tool: string;
  doPayload: unknown;
  undoPayload: unknown;
  tijdstip: Date;
  namens: string | null;
  uitgevoerdIn: string;
  ongedaan: boolean;
}

/** Log een uitgevoerde actie. */
export async function logDaisyActie(params: {
  sessieId: string;
  tool: string;
  doPayload: unknown;
  undoPayload: unknown;
  namens?: string;
  uitgevoerdIn: string;
}): Promise<DaisyActieRecord> {
  return prisma.daisyActie.create({
    data: {
      sessieId: params.sessieId,
      tool: params.tool,
      doPayload: params.doPayload as any,
      undoPayload: params.undoPayload as any,
      namens: params.namens ?? null,
      uitgevoerdIn: params.uitgevoerdIn,
    },
  });
}

/** Haal de laatste N niet-ongedane acties op voor een sessie (nieuwste eerst). */
export async function getDaisyActies(sessieId: string, limit = 50): Promise<DaisyActieRecord[]> {
  return prisma.daisyActie.findMany({
    where: { sessieId, ongedaan: false },
    orderBy: { tijdstip: "desc" },
    take: limit,
  });
}

/** Markeer een actie als ongedaan. */
export async function markeerOngedaan(actieId: string): Promise<void> {
  await prisma.daisyActie.update({
    where: { id: actieId },
    data: { ongedaan: true },
  });
}

/** Haal één actie op. */
export async function getDaisyActie(actieId: string): Promise<DaisyActieRecord | null> {
  return prisma.daisyActie.findUnique({ where: { id: actieId } });
}
