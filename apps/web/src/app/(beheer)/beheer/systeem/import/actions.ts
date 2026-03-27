"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";

/**
 * Haal de import-historie op, meest recent eerst.
 */
export async function getImportHistorie() {
  await requireTC();
  const imports = await prisma.import.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return imports.map((i) => ({
    id: i.id,
    seizoen: i.seizoen,
    exportDatum: i.exportDatum,
    snapshotDatum: i.snapshotDatum,
    spelersNieuw: i.spelersNieuw,
    spelersBijgewerkt: i.spelersBijgewerkt,
    stafNieuw: i.stafNieuw,
    stafBijgewerkt: i.stafBijgewerkt,
    teamsGeladen: i.teamsGeladen,
    createdAt: i.createdAt,
  }));
}

export type ImportRow = Awaited<ReturnType<typeof getImportHistorie>>[number];
