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
  onSpelerClick,
}: TeamKaartBodyProps) {
  if (dl === "compact") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
        <div className="flex items-center gap-3 text-base">
          <span className="font-semibold text-pink-500">♀ {aantalV}</span>
          <span className="font-semibold text-blue-500">♂ {aantalM}</span>
        </div>
        <span className="text-text-secondary text-sm">gem. {gemLeeftijd}</span>
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
