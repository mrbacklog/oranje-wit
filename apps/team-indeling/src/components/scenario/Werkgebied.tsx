"use client";

import { useState, useMemo, useCallback } from "react";
import type { TeamData, SpelerData, SelectieGroepData } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import type { PositionMap } from "./hooks/useCardPositions";
import GestureCanvas from "./editor/GestureCanvas";
import GestureCard from "./editor/GestureCard";
import TeamKaart from "./TeamKaart";
import SelectieBlok from "./SelectieBlok";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./editor/cardSizes";

interface WerkgebiedProps {
  teams: TeamData[];
  zichtbareTeamIds: Set<string>;
  validatieMap?: Map<string, TeamValidatie>;
  onDeleteTeam: (teamId: string) => void;
  onKoppelSelectie: (teamIds: string[]) => void;
  onOntkoppelSelectie: (groepId: string) => void;
  selectieGroepMap?: Map<string, SelectieGroepData>;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
  onEditTeam?: (teamId: string) => void;
  positions: PositionMap;
  onRepositionCard: (cardId: string, deltaX: number, deltaY: number) => void;
}

export default function Werkgebied({
  teams,
  zichtbareTeamIds,
  validatieMap,
  onDeleteTeam,
  onKoppelSelectie,
  onOntkoppelSelectie,
  selectieGroepMap,
  onSpelerClick,
  onEditTeam,
  positions,
  onRepositionCard,
}: WerkgebiedProps) {
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set());

  const zichtbareTeams = teams.filter((t) => zichtbareTeamIds.has(t.id));

  // Groepeer teams op selectie
  const { selectieGroepen, losseTeams } = useMemo(() => {
    const groepen = new Map<string, TeamData[]>();
    const los: TeamData[] = [];

    for (const team of zichtbareTeams) {
      if (team.selectieGroepId) {
        const groep = groepen.get(team.selectieGroepId) ?? [];
        groep.push(team);
        groepen.set(team.selectieGroepId, groep);
      } else {
        los.push(team);
      }
    }

    return { selectieGroepen: groepen, losseTeams: los };
  }, [zichtbareTeams]);

  const handleKoppel = useCallback(() => {
    if (geselecteerd.size < 2) return;
    onKoppelSelectie(Array.from(geselecteerd));
    setGeselecteerd(new Set());
  }, [geselecteerd, onKoppelSelectie]);

  const kanKoppelen = geselecteerd.size >= 2;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Zwevende selectiebalk — alleen zichtbaar bij selectie */}
      {geselecteerd.size > 0 && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg">
            <span className="text-xs text-gray-500">{geselecteerd.size} geselecteerd</span>
            <button
              onClick={() => setGeselecteerd(new Set())}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Deselecteer
            </button>
            <button
              onClick={handleKoppel}
              disabled={!kanKoppelen}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                kanKoppelen
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              Koppel als selectie
            </button>
          </div>
        </div>
      )}

      {/* Zoomable grid */}
      <GestureCanvas>
        {(detailLevel) =>
          zichtbareTeams.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-sm text-gray-400">
                Selecteer teams in de navigator om ze hier te tonen.
              </p>
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
                    <SelectieBlok
                      teams={groepTeams}
                      selectieGroep={selectieGroepMap?.get(groepId)}
                      validatieMap={validatieMap}
                      detailLevel={detailLevel}
                      onOntkoppel={onOntkoppelSelectie}
                      onDelete={onDeleteTeam}
                      onSpelerClick={onSpelerClick}
                      onEditTeam={onEditTeam}
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
                    <TeamKaart
                      team={team}
                      validatie={validatieMap?.get(team.id)}
                      detailLevel={detailLevel}
                      onDelete={onDeleteTeam}
                      onSpelerClick={
                        onSpelerClick ? (speler) => onSpelerClick(speler, team.id) : undefined
                      }
                      onEditTeam={onEditTeam}
                    />
                  </GestureCard>
                );
              })}
            </div>
          )
        }
      </GestureCanvas>
    </div>
  );
}
