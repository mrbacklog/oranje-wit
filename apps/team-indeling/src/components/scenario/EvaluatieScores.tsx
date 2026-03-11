"use client";

import type { EvaluatieScore } from "@oranje-wit/types";

interface EvaluatieScoresProps {
  scores: EvaluatieScore;
  compact?: boolean;
}

const SCORE_CONFIG = {
  niveau: { max: 5, label: "Niveau" },
  inzet: { max: 3, label: "Inzet" },
  groei: { max: 4, label: "Groei" },
} as const;

function ScoreBalk({
  label,
  waarde,
  maxScore,
}: {
  label: string;
  waarde: number | undefined;
  maxScore: number;
}) {
  if (waarde == null) return null;
  const pct = (waarde / maxScore) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-right text-[11px] text-gray-500">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-[11px] text-gray-500 tabular-nums">
        {waarde}/{maxScore}
      </span>
    </div>
  );
}

function CompactScore({
  label,
  waarde,
  max,
}: {
  label: string;
  waarde: number | undefined;
  max: number;
}) {
  if (waarde == null) return null;
  const pct = (waarde / max) * 100;

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
      <div className="relative h-2 w-12 overflow-hidden rounded-full bg-gray-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 tabular-nums">{waarde}</span>
    </div>
  );
}

export default function EvaluatieScores({ scores, compact = false }: EvaluatieScoresProps) {
  const heeftSpelerScores = scores.niveau != null || scores.inzet != null || scores.groei != null;

  if (!heeftSpelerScores) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <CompactScore label="N" waarde={scores.niveau} max={5} />
        <CompactScore label="I" waarde={scores.inzet} max={3} />
        <CompactScore label="G" waarde={scores.groei} max={4} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ScoreBalk
        label={SCORE_CONFIG.niveau.label}
        waarde={scores.niveau}
        maxScore={SCORE_CONFIG.niveau.max}
      />
      <ScoreBalk
        label={SCORE_CONFIG.inzet.label}
        waarde={scores.inzet}
        maxScore={SCORE_CONFIG.inzet.max}
      />
      <ScoreBalk
        label={SCORE_CONFIG.groei.label}
        waarde={scores.groei}
        maxScore={SCORE_CONFIG.groei.max}
      />
    </div>
  );
}
