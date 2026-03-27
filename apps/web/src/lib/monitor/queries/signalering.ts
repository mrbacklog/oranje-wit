// @ts-nocheck — Prisma 7 type-recursie workaround (TS2321)
import { prisma } from "@/lib/db/prisma";

export type SignaleringRow = {
  id: number;
  seizoen: string;
  type: string;
  ernst: string;
  leeftijdsgroep: string | null;
  geslacht: string | null;
  waarde: number | null;
  drempel: number | null;
  streef: number | null;
  beschrijving: string | null;
  advies: string | null;
};

export async function getSignaleringen(seizoen: string): Promise<SignaleringRow[]> {
  const rows = await prisma.signalering.findMany({
    where: { seizoen },
    orderBy: [{ ernst: "asc" }, { type: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    seizoen: r.seizoen,
    type: r.type,
    ernst: r.ernst,
    leeftijdsgroep: r.leeftijdsgroep,
    geslacht: r.geslacht,
    waarde: r.waarde ? Number(r.waarde) : null,
    drempel: r.drempel ? Number(r.drempel) : null,
    streef: r.streef ? Number(r.streef) : null,
    beschrijving: r.beschrijving,
    advies: r.advies,
  }));
}

export type SignaleringSamenvatting = {
  totaal: number;
  kritiek: number;
  aandacht: number;
};

export async function getSignaleringSamenvatting(
  seizoen: string
): Promise<SignaleringSamenvatting> {
  const alerts = await getSignaleringen(seizoen);
  return {
    totaal: alerts.length,
    kritiek: alerts.filter((a) => a.ernst === "kritiek").length,
    aandacht: alerts.filter((a) => a.ernst === "aandacht").length,
  };
}
