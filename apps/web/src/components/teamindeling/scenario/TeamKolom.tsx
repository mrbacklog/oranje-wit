"use client";

import type { TeamSpelerData, SpelerData, DetailLevel } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";

interface TeamKolomProps {
  spelers: TeamSpelerData[];
  teamId: string;
  geslacht: "M" | "V";
  detailLevel: DetailLevel;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  onSpelerClick?: (speler: SpelerData) => void;
}

const GENDER_ICON = {
  V: (
    <svg
      className="h-2 w-2 text-pink-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="10" r="6" />
      <path d="M12 16v6M9 20h6" />
    </svg>
  ),
  M: (
    <svg
      className="h-2 w-2 text-blue-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="10" cy="14" r="6" />
      <path d="M21 3l-6.5 6.5M21 3h-5M21 3v5" />
    </svg>
  ),
};

const GENDER_COUNT_CLASS = {
  V: "text-pink-500",
  M: "text-blue-500",
};

export default function TeamKolom({
  spelers,
  teamId,
  geslacht,
  detailLevel,
  pinnedSpelerIds,
  showRanking,
  onSpelerClick,
}: TeamKolomProps) {
  return (
    <div>
      <div className="flex items-center gap-0.5 px-1 pt-0.5">
        {GENDER_ICON[geslacht]}
        <span className={`text-[8px] font-medium ${GENDER_COUNT_CLASS[geslacht]}`}>
          {spelers.length}
        </span>
      </div>
      {spelers.map((ts) => (
        <TeamSpelerRij
          key={ts.id}
          teamSpeler={ts}
          teamId={teamId}
          detailLevel={detailLevel}
          isPinned={pinnedSpelerIds?.has(ts.speler.id)}
          showRanking={showRanking}
          onSpelerClick={onSpelerClick}
        />
      ))}
    </div>
  );
}
