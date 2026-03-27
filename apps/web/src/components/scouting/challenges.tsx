"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { logger } from "@oranje-wit/types";

// ─── Types ───

interface Challenge {
  id: string;
  naam: string;
  beschrijving: string;
  xpBeloning: number;
  startDatum: string;
  eindDatum: string;
  voortgang: number;
  doel: number;
  voltooid: boolean;
}

interface ChallengesProps {
  /** Toon maximaal N challenges (compact modus voor dashboard) */
  maxItems?: number;
}

// ─── Component ───

export function Challenges({ maxItems }: ChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/scouting/scout/challenges");
      const json = await res.json();
      if (json.ok && json.data?.challenges) {
        setChallenges(json.data.challenges);
      }
    } catch (err) {
      logger.warn("[challenges] Fetch fout:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  if (isLoading) {
    return <ChallengesSkeleton count={maxItems ?? 3} />;
  }

  if (challenges.length === 0) {
    return (
      <div className="bg-surface-card rounded-2xl p-5 text-center">
        <div className="bg-surface-elevated mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="text-text-muted h-7 w-7"
            strokeWidth={1.5}
          >
            <path
              d="M13 10V3L4 14h7v7l9-11h-7z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-text-muted text-sm">Geen actieve challenges op dit moment</p>
      </div>
    );
  }

  const zichtbaar = maxItems ? challenges.slice(0, maxItems) : challenges;

  return (
    <div className="flex flex-col gap-3">
      {zichtbaar.map((ch, i) => (
        <ChallengeKaart key={ch.id} challenge={ch} index={i} />
      ))}
    </div>
  );
}

// ─── Challenge kaart ───

function ChallengeKaart({ challenge, index }: { challenge: Challenge; index: number }) {
  const pct =
    challenge.doel > 0
      ? Math.min(100, Math.round((challenge.voortgang / challenge.doel) * 100))
      : 0;

  const restTijd = berekenRestTijd(challenge.eindDatum);

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`rounded-2xl p-4 ${
        challenge.voltooid ? "border border-green-500/20 bg-green-500/10" : "bg-surface-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-text-primary text-sm font-semibold">{challenge.naam}</h3>
            {challenge.voltooid && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-400">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <p className="text-text-secondary mt-0.5 text-xs">{challenge.beschrijving}</p>
        </div>
        <div className="bg-ow-oranje/10 shrink-0 rounded-lg px-2.5 py-1">
          <span className="text-ow-oranje text-xs font-bold">+{challenge.xpBeloning} XP</span>
        </div>
      </div>

      {/* Voortgangsbalk */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-text-muted text-[10px] tabular-nums">
            {challenge.voortgang}/{challenge.doel}
          </span>
          {!challenge.voltooid && restTijd && (
            <span className="text-text-muted text-[10px]">{restTijd}</span>
          )}
        </div>
        <div className="bg-surface-elevated h-2 overflow-hidden rounded-full">
          <motion.div
            className={`h-full rounded-full ${
              challenge.voltooid
                ? "bg-green-400"
                : "from-ow-oranje to-ow-oranje-light bg-gradient-to-r"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Helpers ───

function berekenRestTijd(eindDatumStr: string): string | null {
  const eind = new Date(eindDatumStr);
  const nu = new Date();
  const verschil = eind.getTime() - nu.getTime();

  if (verschil <= 0) return null;

  const dagen = Math.floor(verschil / (24 * 60 * 60 * 1000));
  const uren = Math.floor((verschil % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (dagen > 7) {
    return `${Math.ceil(dagen / 7)} weken`;
  }
  if (dagen > 0) {
    return `${dagen}d ${uren}u`;
  }
  return `${uren}u`;
}

function ChallengesSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-card rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="bg-surface-elevated h-4 w-32 animate-pulse rounded" />
              <div className="bg-surface-elevated mt-2 h-3 w-48 animate-pulse rounded" />
            </div>
            <div className="bg-surface-elevated h-6 w-16 animate-pulse rounded-lg" />
          </div>
          <div className="bg-surface-elevated mt-3 h-2 animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}
