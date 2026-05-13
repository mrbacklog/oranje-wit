// apps/ti-studio-v2/src/lib/homepage-queries.ts
// Server-side Prisma helpers voor de homepage-statistieken.

import { db } from "@/lib/db";
import { logger } from "@oranje-wit/types";

export interface HomepageStats {
  /** Seizoen van actief kaders, bijv. "2026-2027" */
  seizoen: string | null;
  /** Aantal actieve spelers (STOPT telt NIET mee — OP-1) */
  aantalSpelers: number;
  /** Aantal ingedeelde spelers in de actieve versie */
  ingedeeld: number;
  /** Voortgangspercentage (0-100) */
  pct: number;
  /** Memo-statistieken */
  memos: {
    open: number;
    inBespreking: number;
    /** hoge prio = BLOCKER of HOOG, status OPEN of IN_BESPREKING */
    hogePrio: number;
  };
  /** Werkindeling bestaat */
  heeftWerkindeling: boolean;
}

export async function getHomepageStats(): Promise<HomepageStats> {
  try {
    const kaders = await db.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: {
        id: true,
        seizoen: true,
        werkindelingen: {
          where: { status: "ACTIEF" },
          select: {
            id: true,
            versies: {
              orderBy: { nummer: "desc" as const },
              take: 1,
              select: {
                id: true,
                teamSpelers: {
                  select: { spelerId: true },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!kaders) {
      logger.warn("getHomepageStats: geen actief kaders gevonden");
      return {
        seizoen: null,
        aantalSpelers: 0,
        ingedeeld: 0,
        pct: 0,
        memos: { open: 0, inBespreking: 0, hogePrio: 0 },
        heeftWerkindeling: false,
      };
    }

    // OP-1: STOPT telt NIET mee als actieve speler
    const [spelersCount, memoItems] = await Promise.all([
      db.speler.count({
        where: {
          status: { not: "STOPT" },
        },
      }),
      db.werkitem.findMany({
        where: {
          kadersId: kaders.id,
          type: "MEMO",
          status: { not: "OPGELOST" },
        },
        select: {
          status: true,
          prioriteit: true,
        },
      }),
    ]);

    const actieveVersie = kaders.werkindelingen?.[0]?.versies?.[0];
    const ingedeeld = actieveVersie?.teamSpelers?.length ?? 0;
    const pct = spelersCount > 0 ? Math.round((ingedeeld / spelersCount) * 100) : 0;

    type MemoItem = { status: unknown; prioriteit: unknown };
    const open = (memoItems as MemoItem[]).filter((m) => m.status === "OPEN").length;
    const inBespreking = (memoItems as MemoItem[]).filter(
      (m) => m.status === "IN_BESPREKING"
    ).length;
    const hogePrio = (memoItems as MemoItem[]).filter(
      (m) =>
        (m.prioriteit === "BLOCKER" || m.prioriteit === "HOOG") &&
        (m.status === "OPEN" || m.status === "IN_BESPREKING")
    ).length;

    return {
      seizoen: kaders.seizoen as string,
      aantalSpelers: spelersCount,
      ingedeeld,
      pct,
      memos: { open, inBespreking, hogePrio },
      heeftWerkindeling: !!actieveVersie,
    };
  } catch (err) {
    logger.error("getHomepageStats fout:", err);
    return {
      seizoen: null,
      aantalSpelers: 0,
      ingedeeld: 0,
      pct: 0,
      memos: { open: 0, inBespreking: 0, hogePrio: 0 },
      heeftWerkindeling: false,
    };
  }
}
