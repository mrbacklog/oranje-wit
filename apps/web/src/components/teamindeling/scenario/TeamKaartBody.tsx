"use client";

import type { TeamSpelerData, SpelerData, DetailLevel } from "./types";
import TeamKolom from "./TeamKolom";

interface TeamKaartBodyProps {
  teamId: string;
  detailLevel: DetailLevel;
  heren: TeamSpelerData[];
  dames: TeamSpelerData[];
  aantalV: number;
  aantalM: number;
  gemLeeftijd: string;
  isDouble: boolean;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  teamSterkte?: number;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function TeamKaartBody({
  teamId,
  detailLevel: dl,
  heren,
  dames,
  aantalV,
  aantalM,
  gemLeeftijd,
  isDouble,
  pinnedSpelerIds,
  showRanking,
  teamSterkte,
  onSpelerClick,
}: TeamKaartBodyProps) {
  if (dl === "compact") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        {/* V/M tellers groot */}
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-pink-400">♀ {aantalV}</span>
          <span className="text-sm text-[var(--border-default)]">|</span>
          <span className="text-lg font-bold text-blue-400">♂ {aantalM}</span>
        </div>
        {/* Gemiddelde leeftijd */}
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          gem. {gemLeeftijd} j
        </span>
        {/* USS score — alleen als showRanking aan staat */}
        {showRanking && teamSterkte != null && (
          <span
            className="rounded px-2 py-0.5 text-xs font-bold"
            style={{ background: "rgba(255,107,0,0.12)", color: "var(--ow-oranje-500)" }}
          >
            USS {teamSterkte.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  const totaal = heren.length + dames.length;

  if (totaal === 0) {
    return (
      <div className="min-h-6 flex-1 overflow-hidden px-0.5">
        <p className="text-text-secondary py-2 text-center text-[9px]">Sleep spelers hierheen</p>
      </div>
    );
  }

  return (
    <div className="min-h-6 flex-1 overflow-hidden px-0.5">
      {!isDouble ? (
        /* Viertal: gestapeld */
        <>
          {dames.length > 0 && (
            <TeamKolom
              spelers={dames}
              teamId={teamId}
              geslacht="V"
              detailLevel={dl}
              pinnedSpelerIds={pinnedSpelerIds}
              showRanking={showRanking}
              onSpelerClick={onSpelerClick}
            />
          )}
          {heren.length > 0 && (
            <TeamKolom
              spelers={heren}
              teamId={teamId}
              geslacht="M"
              detailLevel={dl}
              pinnedSpelerIds={pinnedSpelerIds}
              showRanking={showRanking}
              onSpelerClick={onSpelerClick}
            />
          )}
        </>
      ) : (
        /* Achtal: side-by-side kolommen */
        <div className="grid grid-cols-2 gap-x-0.5">
          <TeamKolom
            spelers={dames}
            teamId={teamId}
            geslacht="V"
            detailLevel={dl}
            pinnedSpelerIds={pinnedSpelerIds}
            showRanking={showRanking}
            onSpelerClick={onSpelerClick}
          />
          <TeamKolom
            spelers={heren}
            teamId={teamId}
            geslacht="M"
            detailLevel={dl}
            pinnedSpelerIds={pinnedSpelerIds}
            showRanking={showRanking}
            onSpelerClick={onSpelerClick}
          />
        </div>
      )}
    </div>
  );
}
