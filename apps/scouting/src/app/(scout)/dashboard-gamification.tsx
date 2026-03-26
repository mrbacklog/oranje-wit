"use client";

/**
 * Gamification-widget voor het dashboard.
 *
 * Toont de XP-balk (compact), actieve challenges (max 2)
 * en een leaderboard-preview (top 3).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { logger } from "@oranje-wit/types";
import { XPBar } from "@/components/xp-bar";
import { Challenges } from "@/components/challenges";
import { Leaderboard } from "@/components/leaderboard";

interface ProfielSummary {
  scout: {
    xp: number;
    level: number;
  } | null;
  levelInfo: {
    level: number;
    naam: string;
    xpVoorVolgend: number;
    voortgang: number;
  };
  stats: {
    totaalRapporten: number;
    streak: number;
  };
}

export function DashboardGamification() {
  const [data, setData] = useState<ProfielSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/scout/profiel");
      const json = await res.json();
      if (json.ok && json.data) {
        setData(json.data);
      }
    } catch (err) {
      logger.warn("[dashboard-gamification] Fetch fout:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="bg-surface-card rounded-2xl p-4">
        <div className="bg-surface-elevated h-3 animate-pulse rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const { scout, levelInfo, stats } = data;
  const xp = scout?.xp ?? 0;
  const levelXP = levelInfo.xpVoorVolgend > 0 ? Math.round(xp + levelInfo.xpVoorVolgend) : xp;

  return (
    <>
      {/* XP-balk */}
      <Link href="/profiel" className="block">
        <section className="bg-surface-card active:bg-surface-elevated rounded-2xl p-4 transition-colors">
          <XPBar
            currentXP={xp}
            levelXP={levelXP}
            level={levelInfo.level}
            levelNaam={levelInfo.naam}
            voortgang={levelInfo.voortgang}
            compact
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-text-muted text-xs">
              {levelInfo.naam} — {stats.totaalRapporten} rapporten
            </span>
            {stats.streak > 0 && (
              <span className="text-ow-oranje flex items-center gap-1 text-xs">
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" strokeWidth={2}>
                  <path
                    d="M8.5 6.5V2L3 9h4v4.5l5.5-7H8.5z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {stats.streak}w streak
              </span>
            )}
          </div>
        </section>
      </Link>

      {/* Actieve challenges (max 2) */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-text-secondary text-sm font-semibold">Challenges</h2>
          <Link
            href="/profiel"
            className="text-ow-oranje active:text-ow-oranje-light text-xs transition-colors"
          >
            Alle →
          </Link>
        </div>
        <Challenges maxItems={2} />
      </section>

      {/* Leaderboard preview (top 3) */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-text-secondary text-sm font-semibold">Ranglijst</h2>
          <Link
            href="/profiel"
            className="text-ow-oranje active:text-ow-oranje-light text-xs transition-colors"
          >
            Alle →
          </Link>
        </div>
        <Leaderboard compact />
      </section>
    </>
  );
}
