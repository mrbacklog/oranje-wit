"use client";

import { useMemo } from "react";
import type { TeamData, SpelerData, SelectieGroepData } from "../types";
import { berekenJIndicaties, berekenTeamSterktes } from "../types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import type { PositionMap } from "../hooks/useCardPositions";
import GestureCanvas from "../editor/GestureCanvas";
import GestureCard from "../editor/GestureCard";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../editor/cardSizes";
import ViewTeamKaart from "./ViewTeamKaart";
import ViewSelectieBlok from "./ViewSelectieBlok";

interface ViewWerkgebiedProps {
  teams: TeamData[];
  selectieGroepMap?: Map<string, SelectieGroepData>;
  validatieMap?: Map<string, TeamValidatie>;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  positions: PositionMap;
  onRepositionCard: (cardId: string, deltaX: number, deltaY: number) => void;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function ViewWerkgebied({
  teams,
  selectieGroepMap,
  validatieMap,
  pinnedSpelerIds,
  showRanking,
  positions,
  onRepositionCard,
  onSpelerClick,
}: ViewWerkgebiedProps) {
  const { selectieGroepen, losseTeams } = useMemo(() => {
    const groepen = new Map<string, TeamData[]>();
    const los: TeamData[] = [];

    for (const team of teams) {
      if (team.selectieGroepId) {
        const groep = groepen.get(team.selectieGroepId) ?? [];
        groep.push(team);
        groepen.set(team.selectieGroepId, groep);
      } else {
        los.push(team);
      }
    }

    return { selectieGroepen: groepen, losseTeams: los };
  }, [teams]);

  const jIndicatieMap = useMemo(() => berekenJIndicaties(teams), [teams]);
  const teamSterkteMap = useMemo(() => berekenTeamSterktes(teams), [teams]);

  return (
    <GestureCanvas>
      {(detailLevel) =>
        teams.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-sm text-gray-400">Dit scenario heeft nog geen teams.</p>
          </div>
        ) : (
          <div
            className="border border-dashed border-gray-200"
            style={{ position: "relative", width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            {/* Selectie-groepen */}
            {Array.from(selectieGroepen.entries()).map(([groepId, groepTeams]) => {
              const dragId = `selectie-${groepId}`;
              const pos = positions[dragId] ?? { x: 0, y: 0 };
              return (
                <GestureCard
                  key={dragId}
                  cardId={dragId}
                  position={pos}
                  onDragEnd={onRepositionCard}
                >
                  <ViewSelectieBlok
                    teams={groepTeams}
                    selectieGroep={selectieGroepMap?.get(groepId)}
                    validatieMap={validatieMap}
                    detailLevel={detailLevel}
                    pinnedSpelerIds={pinnedSpelerIds}
                    onSpelerClick={onSpelerClick}
                  />
                </GestureCard>
              );
            })}
            {/* Losse teams */}
            {losseTeams.map((team) => {
              const pos = positions[team.id] ?? { x: 0, y: 0 };
              return (
                <GestureCard
                  key={team.id}
                  cardId={team.id}
                  position={pos}
                  onDragEnd={onRepositionCard}
                >
                  <ViewTeamKaart
                    team={team}
                    validatie={validatieMap?.get(team.id)}
                    detailLevel={detailLevel}
                    pinnedSpelerIds={pinnedSpelerIds}
                    showRanking={showRanking}
                    jIndicatie={jIndicatieMap.get(team.id)}
                    teamSterkte={teamSterkteMap.get(team.id)}
                    onSpelerClick={onSpelerClick}
                  />
                </GestureCard>
              );
            })}
          </div>
        )
      }
    </GestureCanvas>
  );
}
