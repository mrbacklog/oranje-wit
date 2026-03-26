"use client";

/**
 * Scout-profielpagina.
 *
 * Toont het persoonlijke scout-profiel met XP-voortgang, stats,
 * streak, badges en een leaderboard-preview.
 */

import { useEffect, useState, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import { XPBar } from "@/components/xp-bar";
import { BadgeGrid } from "@/components/badge-grid";
import { Leaderboard } from "@/components/leaderboard";

// ─── Types ───

interface LevelInfo {
  level: number;
  naam: string;
  xpVoorVolgend: number;
  voortgang: number;
}

interface BadgeData {
  id: string;
  naam: string | null;
  beschrijving: string | null;
  unlockedAt: string;
}

interface ProfielData {
  scout: {
    id: string;
    naam: string;
    xp: number;
    level: number;
  } | null;
  levelInfo: LevelInfo;
  badges: BadgeData[];
  stats: {
    totaalRapporten: number;
    dezeMaand: number;
    gemiddeldPerWeek: number;
    uniekeSpelers: number;
    streak: number;
  };
}

// ─── Component ───

export default function ProfielPage() {
  const [data, setData] = useState<ProfielData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiel = useCallback(async () => {
    try {
      const res = await fetch("/api/scout/profiel");
      const json = await res.json();
      if (json.ok && json.data) {
        setData(json.data);
      } else {
        setError("Kon profiel niet laden");
      }
    } catch (err) {
      logger.warn("[profiel] Fetch fout:", err);
      setError("Verbindingsfout");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiel();
  }, [fetchProfiel]);

  if (isLoading) return <ProfielSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20">
        <p className="text-text-muted">{error ?? "Geen data"}</p>
      </div>
    );
  }

  const { scout, levelInfo, badges, stats } = data;
  const naam = scout?.naam ?? "Scout";
  const xp = scout?.xp ?? 0;

  // Bereken XP voor volgend level (absoluut)
  const levelXP = levelInfo.xpVoorVolgend > 0 ? Math.round(xp + levelInfo.xpVoorVolgend) : xp;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-24">
      {/* Hero-sectie */}
      <section className="bg-surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#818cf8] shadow-lg shadow-[#6366f1]/30">
            <span className="text-xl font-black text-white">{levelInfo.level}</span>
          </div>
          <div>
            <h1 className="text-text-primary text-xl font-bold">{naam}</h1>
            <p className="text-text-secondary text-sm">{levelInfo.naam}</p>
          </div>
        </div>
        <XPBar
          currentXP={xp}
          levelXP={levelXP}
          level={levelInfo.level}
          levelNaam={levelInfo.naam}
          voortgang={levelInfo.voortgang}
        />
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3">
        <StatKaart
          label="Totaal rapporten"
          waarde={String(stats.totaalRapporten)}
          icoon="clipboard"
        />
        <StatKaart label="Deze maand" waarde={String(stats.dezeMaand)} icoon="calendar" />
        <StatKaart label="Per week" waarde={String(stats.gemiddeldPerWeek)} icoon="trending" />
        <StatKaart label="Unieke spelers" waarde={String(stats.uniekeSpelers)} icoon="users" />
      </section>

      {/* Streak */}
      {stats.streak > 0 && (
        <section className="from-ow-oranje/20 to-ow-oranje/5 rounded-2xl bg-gradient-to-r p-4">
          <div className="flex items-center gap-3">
            <div className="bg-ow-oranje/20 flex h-10 w-10 items-center justify-center rounded-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="text-ow-oranje h-5 w-5"
                strokeWidth={2}
              >
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-text-primary text-sm font-semibold">
                {stats.streak} {stats.streak === 1 ? "week" : "weken"} streak
              </p>
              <p className="text-text-secondary text-xs">Blijf scouten om je streak te behouden!</p>
            </div>
          </div>
        </section>
      )}

      {/* Badges */}
      <section>
        <h2 className="text-text-primary mb-3 text-lg font-semibold">Badges</h2>
        <BadgeGrid unlockedBadges={badges} />
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-text-primary mb-3 text-lg font-semibold">Ranglijst</h2>
        <Leaderboard />
      </section>

      {/* Uitloggen */}
      <section className="pt-4">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/signout";
          }}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 active:scale-[0.98]"
        >
          Uitloggen
        </button>
      </section>
    </div>
  );
}

// ─── Sub-componenten ───

function StatKaart({
  label,
  waarde,
  icoon,
}: {
  label: string;
  waarde: string;
  icoon: "clipboard" | "calendar" | "trending" | "users";
}) {
  return (
    <div className="bg-surface-card rounded-2xl p-4">
      <div className="bg-surface-elevated mb-2 flex h-8 w-8 items-center justify-center rounded-lg">
        <StatIcoon icoon={icoon} />
      </div>
      <p className="text-text-primary text-2xl font-bold tabular-nums">{waarde}</p>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
  );
}

function StatIcoon({ icoon }: { icoon: string }) {
  const cls = "h-4 w-4 text-text-secondary";

  switch (icoon) {
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
          <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "trending":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <path
            d="M23 6l-9.5 9.5-5-5L1 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17 6h6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <path
            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <circle cx="9" cy="7" r="4" stroke="currentColor" />
          <path
            d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function ProfielSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-24">
      {/* Hero skeleton */}
      <div className="bg-surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-surface-elevated h-14 w-14 animate-pulse rounded-full" />
          <div>
            <div className="bg-surface-elevated h-5 w-32 animate-pulse rounded" />
            <div className="bg-surface-elevated mt-2 h-3 w-20 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-surface-elevated h-3 animate-pulse rounded-full" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-card rounded-2xl p-4">
            <div className="bg-surface-elevated mb-2 h-8 w-8 animate-pulse rounded-lg" />
            <div className="bg-surface-elevated h-7 w-12 animate-pulse rounded" />
            <div className="bg-surface-elevated mt-1 h-3 w-20 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Badges skeleton */}
      <div>
        <div className="bg-surface-elevated mb-3 h-5 w-20 animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-card/50 flex flex-col items-center gap-1.5 rounded-2xl p-3"
            >
              <div className="bg-surface-elevated h-12 w-12 animate-pulse rounded-full" />
              <div className="bg-surface-elevated h-3 w-12 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
