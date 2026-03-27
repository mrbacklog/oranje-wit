import type { SpelerData, DetailLevel, TeamSpelerData } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";

interface SelectieSpelerGridProps {
  dames: TeamSpelerData[];
  heren: TeamSpelerData[];
  teamId: string;
  detailLevel: DetailLevel;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
}

export default function SelectieSpelerGrid({
  dames,
  heren,
  teamId,
  detailLevel,
  pinnedSpelerIds,
  showRanking,
  onSpelerClick,
}: SelectieSpelerGridProps) {
  const dames1 = dames.slice(0, Math.ceil(dames.length / 2));
  const dames2 = dames.slice(Math.ceil(dames.length / 2));
  const heren1 = heren.slice(0, Math.ceil(heren.length / 2));
  const heren2 = heren.slice(Math.ceil(heren.length / 2));

  return (
    <div className="grid grid-cols-4 gap-x-0.5">
      {/* Dames kolom 1 */}
      <div>
        <div className="flex items-center gap-0.5 px-1 pt-0.5">
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
          <span className="text-[8px] font-medium text-pink-500">{dames.length}</span>
        </div>
        {dames1.map((ts) => (
          <TeamSpelerRij
            key={ts.id}
            teamSpeler={ts}
            teamId={teamId}
            detailLevel={detailLevel}
            isPinned={pinnedSpelerIds?.has(ts.speler.id)}
            showRanking={showRanking}
            onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, teamId) : undefined}
          />
        ))}
      </div>
      {/* Dames kolom 2 */}
      <div>
        <div className="h-4" />
        {dames2.map((ts) => (
          <TeamSpelerRij
            key={ts.id}
            teamSpeler={ts}
            teamId={teamId}
            detailLevel={detailLevel}
            isPinned={pinnedSpelerIds?.has(ts.speler.id)}
            showRanking={showRanking}
            onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, teamId) : undefined}
          />
        ))}
      </div>
      {/* Heren kolom 1 */}
      <div>
        <div className="flex items-center gap-0.5 px-1 pt-0.5">
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
          <span className="text-[8px] font-medium text-blue-500">{heren.length}</span>
        </div>
        {heren1.map((ts) => (
          <TeamSpelerRij
            key={ts.id}
            teamSpeler={ts}
            teamId={teamId}
            detailLevel={detailLevel}
            isPinned={pinnedSpelerIds?.has(ts.speler.id)}
            showRanking={showRanking}
            onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, teamId) : undefined}
          />
        ))}
      </div>
      {/* Heren kolom 2 */}
      <div>
        <div className="h-4" />
        {heren2.map((ts) => (
          <TeamSpelerRij
            key={ts.id}
            teamSpeler={ts}
            teamId={teamId}
            detailLevel={detailLevel}
            isPinned={pinnedSpelerIds?.has(ts.speler.id)}
            showRanking={showRanking}
            onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, teamId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
