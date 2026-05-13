// apps/ti-studio-v2/src/lib/kader-queries.ts

import { db as prisma } from "@/lib/db";
import { mergeMetDefaults } from "@/lib/kader-mapping";
import type { KaderPaginaData, KaderMemoItem } from "@/components/kader/types";

/**
 * Haalt alle data op die de kader-pagina nodig heeft.
 * Combineert het Kaders-record (JSON kaders-veld) met memos (Werkitem).
 */
export async function getKaderPaginaData(seizoen: string): Promise<KaderPaginaData> {
  const record = await prisma.kaders.findUnique({
    where: { seizoen },
    select: {
      id: true,
      seizoen: true,
      kaders: true,
      werkitems: {
        where: { type: "MEMO", doelgroep: { not: null } },
        orderBy: { volgorde: "asc" },
        select: {
          id: true,
          titel: true,
          beschrijving: true,
          status: true,
          prioriteit: true,
          doelgroep: true,
          createdAt: true,
        },
      },
    },
  });

  if (!record) {
    return {
      seizoen,
      kadersId: "",
      teamtypeKaders: mergeMetDefaults(null),
      memos: [],
    };
  }

  const opgeslagenKaders = record.kaders as Record<string, unknown> | null;
  const teamtypeKaders = mergeMetDefaults(
    (opgeslagenKaders?.["teamtypeKaders"] as Record<string, unknown> | null) ?? null
  );

  type WerkitemRow = (typeof record.werkitems)[number];
  const memos: KaderMemoItem[] = record.werkitems.map((w: WerkitemRow) => ({
    id: w.id,
    titel: w.titel,
    beschrijving: w.beschrijving,
    status: String(w.status),
    prioriteit: String(w.prioriteit),
    doelgroep: w.doelgroep ? String(w.doelgroep) : null,
    createdAt: w.createdAt.toISOString(),
  }));

  return {
    seizoen: record.seizoen,
    kadersId: record.id,
    teamtypeKaders,
    memos,
  };
}
