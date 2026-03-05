"use client";

import type { EvaluatieScore, TeamGemiddelde } from "@oranje-wit/types";

interface EvaluatieScoresProps {
  scores: EvaluatieScore;
  teamGem?: TeamGemiddelde | null;
  toonTeamVergelijking?: boolean;
}

const SCORE_CONFIG = {
  niveau: { max: 5, label: "Niveau" },
  inzet: { max: 3, label: "Inzet" },
  groei: { max: 4, label: "Groei" },
  team_plezier: { max: 5, label: "Plezier" },
  team_ontwikkeling: { max: 5, label: "Ontwikkeling" },
  team_prestatie: { max: 5, label: "Prestatie" },
} as const;

function ScoreBalk({
  label,
  waarde,
  maxScore,
  teamGem,
  toonGem,
}: {
  label: string;
  waarde: number | undefined;
  maxScore: number;
  teamGem?: number;
  toonGem?: boolean;
}) {
  if (waarde == null) return null;
  const pct = (waarde / maxScore) * 100;
  const gemPct = teamGem != null ? (teamGem / maxScore) * 100 : null;

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-right text-[11px] text-gray-500">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-400 transition-all"
          style={{ width: `${pct}%` }}
        />
        {toonGem && gemPct != null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-600"
            style={{ left: `${gemPct}%` }}
            title={`Team gem: ${teamGem!.toFixed(1)}`}
          />
        )}
      </div>
      <span className="w-8 shrink-0 text-[11px] text-gray-500 tabular-nums">
        {waarde}/{maxScore}
      </span>
    </div>
  );
}

export default function EvaluatieScores({
  scores,
  teamGem,
  toonTeamVergelijking = false,
}: EvaluatieScoresProps) {
  const heeftSpelerScores = scores.niveau != null || scores.inzet != null || scores.groei != null;

  const heeftOranjeDraad =
    scores.team_plezier != null ||
    scores.team_ontwikkeling != null ||
    scores.team_prestatie != null;

  if (!heeftSpelerScores && !heeftOranjeDraad) return null;

  return (
    <div className="space-y-2">
      {/* Individuele scores */}
      {heeftSpelerScores && (
        <div className="space-y-1">
          <ScoreBalk
            label={SCORE_CONFIG.niveau.label}
            waarde={scores.niveau}
            maxScore={SCORE_CONFIG.niveau.max}
            teamGem={teamGem?.niveau}
            toonGem={toonTeamVergelijking}
          />
          <ScoreBalk
            label={SCORE_CONFIG.inzet.label}
            waarde={scores.inzet}
            maxScore={SCORE_CONFIG.inzet.max}
            teamGem={teamGem?.inzet}
            toonGem={toonTeamVergelijking}
          />
          <ScoreBalk
            label={SCORE_CONFIG.groei.label}
            waarde={scores.groei}
            maxScore={SCORE_CONFIG.groei.max}
            teamGem={teamGem?.groei}
            toonGem={toonTeamVergelijking}
          />
        </div>
      )}

      {/* Oranje Draad scores */}
      {heeftOranjeDraad && (
        <div className="rounded-lg bg-orange-50 px-3 py-2">
          <span className="mb-1 block text-[10px] font-medium tracking-wide text-orange-600 uppercase">
            Oranje Draad
          </span>
          <div className="space-y-1">
            {scores.team_plezier != null && (
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-600">{SCORE_CONFIG.team_plezier.label}</span>
                <span className="text-[11px] font-medium text-orange-700 tabular-nums">
                  {scores.team_plezier}/{SCORE_CONFIG.team_plezier.max}
                </span>
              </div>
            )}
            {scores.team_ontwikkeling != null && (
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-600">
                  {SCORE_CONFIG.team_ontwikkeling.label}
                </span>
                <span className="text-[11px] font-medium text-orange-700 tabular-nums">
                  {scores.team_ontwikkeling}/{SCORE_CONFIG.team_ontwikkeling.max}
                </span>
              </div>
            )}
            {scores.team_prestatie != null && (
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-600">
                  {SCORE_CONFIG.team_prestatie.label}
                </span>
                <span className="text-[11px] font-medium text-orange-700 tabular-nums">
                  {scores.team_prestatie}/{SCORE_CONFIG.team_prestatie.max}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
