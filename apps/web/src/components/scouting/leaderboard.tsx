"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { logger } from "@oranje-wit/types";

// ─── Types ───

interface LeaderboardEntry {
  positie: number;
  displayNaam: string;
  xp: number;
  levelInfo: {
    level: number;
    naam: string;
    voortgang: number;
  };
  isEigen: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  eigenPositie: number;
  eigenScout: {
    displayNaam: string;
    xp: number;
    levelInfo: {
      level: number;
      naam: string;
      voortgang: number;
    };
  } | null;
}

interface LeaderboardProps {
  /** Toon alleen de top 3 (compact modus voor dashboard) */
  compact?: boolean;
}

// ─── Medaille kleuren ───

const MEDAILLE_KLEUREN = {
  1: {
    bg: "from-[var(--knkv-geel-400)] to-[var(--knkv-geel-600)]",
    text: "text-[var(--knkv-geel-900)]",
    shadow: "shadow-[var(--knkv-geel-500)]/30",
  },
  2: {
    bg: "from-[var(--tier-zilver-icon)] to-[var(--ow-zwart-500)]",
    text: "text-[var(--ow-zwart-900)]",
    shadow: "shadow-[var(--tier-zilver-icon)]/30",
  },
  3: {
    bg: "from-[var(--tier-brons-icon)] to-[var(--tier-brons-border)]",
    text: "text-[var(--tier-brons-text)]",
    shadow: "shadow-[var(--tier-brons-icon)]/30",
  },
} as const;

// ─── Component ───

export function Leaderboard({ compact = false }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/scouting/scout/leaderboard");
      const json = await res.json();
      if (json.ok && json.data) {
        setData(json.data);
      }
    } catch (err) {
      logger.warn("[leaderboard] Fetch fout:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (isLoading) {
    return <LeaderboardSkeleton compact={compact} />;
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="bg-surface-card rounded-2xl p-5 text-center">
        <p className="text-text-muted text-sm">Nog geen scouts actief. Wees de eerste!</p>
      </div>
    );
  }

  const entries = compact ? data.leaderboard.slice(0, 3) : data.leaderboard;

  // Check of eigen positie al in de lijst staat
  const eigenInLijst = entries.some((e) => e.isEigen);

  return (
    <div className="bg-surface-card overflow-hidden rounded-2xl">
      {/* Podium (top 3) */}
      {!compact && entries.length >= 3 && (
        <div className="bg-surface-elevated/50 flex items-end justify-center gap-3 px-4 pt-6 pb-4">
          {/* Zilver (#2) */}
          <PodiumSpot entry={entries[1]} />
          {/* Goud (#1) */}
          <PodiumSpot entry={entries[0]} isFirst />
          {/* Brons (#3) */}
          <PodiumSpot entry={entries[2]} />
        </div>
      )}

      {/* Lijst */}
      <div className="divide-y divide-white/5">
        {compact
          ? entries.map((entry, i) => <CompactEntry key={i} entry={entry} />)
          : entries.slice(3).map((entry, i) => <ListEntry key={i} entry={entry} />)}
      </div>

      {/* Eigen positie (als niet in top 10) */}
      {!compact && !eigenInLijst && data.eigenScout && (
        <div className="border-t border-white/10 bg-[var(--knkv-paars-500)]/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center text-sm font-bold text-[var(--knkv-paars-400)]">
              #{data.eigenPositie}
            </span>
            <div className="flex-1">
              <p className="text-text-primary text-sm font-semibold">
                {data.eigenScout.displayNaam} (jij)
              </p>
              <p className="text-text-muted text-xs">{data.eigenScout.levelInfo.naam}</p>
            </div>
            <span className="text-sm font-bold text-[var(--knkv-paars-400)] tabular-nums">
              {data.eigenScout.xp} XP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componenten ───

function PodiumSpot({ entry, isFirst = false }: { entry: LeaderboardEntry; isFirst?: boolean }) {
  const medaille = MEDAILLE_KLEUREN[entry.positie as keyof typeof MEDAILLE_KLEUREN];
  if (!medaille) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: entry.positie * 0.1, type: "spring", stiffness: 300, damping: 25 }}
      className={`flex flex-col items-center ${isFirst ? "mb-2" : ""}`}
    >
      <div
        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${medaille.bg} shadow-md ${medaille.shadow} ${
          isFirst ? "h-12 w-12" : ""
        }`}
      >
        <span className={`font-bold ${medaille.text} ${isFirst ? "text-lg" : "text-sm"}`}>
          {entry.positie}
        </span>
      </div>
      <p
        className={`text-text-primary text-center font-semibold ${isFirst ? "text-sm" : "text-xs"}`}
      >
        {entry.displayNaam}
        {entry.isEigen && <span className="ml-1 text-[var(--knkv-paars-400)]">(jij)</span>}
      </p>
      <p className="text-text-muted text-[10px]">{entry.levelInfo.naam}</p>
      <p className="text-text-secondary mt-0.5 text-xs font-bold tabular-nums">{entry.xp} XP</p>
    </motion.div>
  );
}

function CompactEntry({ entry }: { entry: LeaderboardEntry }) {
  const medaille = MEDAILLE_KLEUREN[entry.positie as keyof typeof MEDAILLE_KLEUREN];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${entry.isEigen ? "bg-[var(--knkv-paars-500)]/10" : ""}`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          medaille ? `bg-gradient-to-br ${medaille.bg}` : "bg-surface-elevated"
        }`}
      >
        <span className={`text-xs font-bold ${medaille ? medaille.text : "text-text-muted"}`}>
          {entry.positie}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-text-primary text-sm font-medium">
          {entry.displayNaam}
          {entry.isEigen && (
            <span className="ml-1 text-xs text-[var(--knkv-paars-400)]">(jij)</span>
          )}
        </p>
      </div>
      <span className="text-text-secondary text-xs font-bold tabular-nums">{entry.xp} XP</span>
    </div>
  );
}

function ListEntry({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${entry.isEigen ? "bg-[var(--knkv-paars-500)]/10" : ""}`}
    >
      <span className="text-text-muted w-8 text-center text-sm font-bold">#{entry.positie}</span>
      <div className="flex-1">
        <p className="text-text-primary text-sm font-semibold">
          {entry.displayNaam}
          {entry.isEigen && (
            <span className="ml-1 text-xs text-[var(--knkv-paars-400)]">(jij)</span>
          )}
        </p>
        <p className="text-text-muted text-xs">{entry.levelInfo.naam}</p>
      </div>
      <span className="text-text-secondary text-sm font-bold tabular-nums">{entry.xp} XP</span>
    </div>
  );
}

function LeaderboardSkeleton({ compact }: { compact: boolean }) {
  const count = compact ? 3 : 5;
  return (
    <div className="bg-surface-card overflow-hidden rounded-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="bg-surface-elevated h-7 w-7 animate-pulse rounded-full" />
          <div className="flex-1">
            <div className="bg-surface-elevated h-4 w-24 animate-pulse rounded" />
          </div>
          <div className="bg-surface-elevated h-4 w-12 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
