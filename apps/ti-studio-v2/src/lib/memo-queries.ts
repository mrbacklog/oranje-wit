// apps/ti-studio-v2/src/lib/memo-queries.ts
// Server-side Prisma helpers voor de memo-pagina.

import { db } from "@/lib/db";
import type { MemoKaartData, MemoDetailData, TijdlijnItem } from "@/components/memo/types";
import type {
  MemoPrioriteit,
  MemoStatus,
  MemoDoelgroep,
  MemoEntiteitType,
} from "@/lib/constants/memo-constants";

/**
 * Haal het actieve kaders-id op (isWerkseizoen === true).
 * Geeft null terug als er geen actief kaders is.
 */
export async function getActiefKadersId(): Promise<string | null> {
  const record = await db.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });
  return record?.id ?? null;
}

/**
 * Haalt alle MEMO-werkitems op voor het opgegeven kadersId.
 * Sortering: volgorde (applicatielaag sorteert daarna op prioriteit).
 */
export async function getMemoKaarten(kadersId: string): Promise<MemoKaartData[]> {
  const items = await db.werkitem.findMany({
    where: { kadersId, type: "MEMO" },
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      prioriteit: true,
      status: true,
      doelgroep: true,
      entiteit: true,
      spelerId: true,
      stafId: true,
      teamId: true,
      speler: { select: { naam: true } },
      staf: { select: { naam: true } },
      team: { select: { naam: true } },
      _count: { select: { toelichtingen: true } },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return items.map(
    (item: {
      id: string;
      titel: string | null;
      beschrijving: string;
      prioriteit: string;
      status: string;
      doelgroep: string | null;
      entiteit: string | null;
      speler: { naam: string } | null;
      staf: { naam: string } | null;
      team: { naam: string } | null;
      _count: { toelichtingen: number };
      createdAt: Date;
      updatedAt: Date;
    }): MemoKaartData => ({
      id: item.id,
      titel: item.titel,
      beschrijving: item.beschrijving,
      prioriteit: item.prioriteit as MemoPrioriteit,
      status: item.status as MemoStatus,
      doelgroep: item.doelgroep as MemoDoelgroep | null,
      entiteit: item.entiteit as MemoEntiteitType | null,
      entiteitLabel: item.speler?.naam ?? item.staf?.naam ?? item.team?.naam ?? null,
      aantalToelichtingen: item._count.toelichtingen,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })
  );
}

/**
 * Haalt detail van één memo op inclusief tijdlijn.
 */
export async function getMemoDetailData(memoId: string): Promise<MemoDetailData | null> {
  const item = await db.werkitem.findUnique({
    where: { id: memoId },
    include: {
      speler: { select: { naam: true } },
      staf: { select: { naam: true } },
      team: { select: { naam: true } },
      toelichtingen: { orderBy: { timestamp: "asc" } },
      activiteiten: { orderBy: { timestamp: "asc" } },
      _count: { select: { toelichtingen: true } },
    },
  });

  if (!item) return null;

  const tijdlijn: TijdlijnItem[] = [
    ...item.toelichtingen.map(
      (t: { id: string; auteurNaam: string; timestamp: Date; tekst: string }) => ({
        id: t.id,
        type: "toelichting" as const,
        auteurNaam: t.auteurNaam,
        timestamp: t.timestamp,
        tekst: t.tekst,
      })
    ),
    ...item.activiteiten.map(
      (a: {
        id: string;
        auteurNaam: string;
        timestamp: Date;
        actie: string;
        detail: string | null;
      }) => ({
        id: a.id,
        type: "log" as const,
        auteurNaam: a.auteurNaam,
        timestamp: a.timestamp,
        actie: a.actie as TijdlijnItem["actie"],
        detail: a.detail,
      })
    ),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    id: item.id,
    titel: item.titel,
    beschrijving: item.beschrijving,
    prioriteit: item.prioriteit as MemoPrioriteit,
    status: item.status as MemoStatus,
    doelgroep: item.doelgroep as MemoDoelgroep | null,
    entiteit: item.entiteit as MemoEntiteitType | null,
    entiteitLabel: item.speler?.naam ?? item.staf?.naam ?? item.team?.naam ?? null,
    aantalToelichtingen: item._count.toelichtingen,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tijdlijn,
  };
}
