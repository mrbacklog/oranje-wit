"use client";

import { useState, useMemo, useCallback } from "react";
import type { TeamData, SpelerData, SelectieGroepData } from "./types";
import { berekenJIndicaties, berekenTeamSterktes } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import type { SelectieValidatie } from "@/lib/validatie/selectie-regels";
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
  selectieValidatieMap?: Map<string, SelectieValidatie>;
  onDeleteTeam: (teamId: string) => void;
  onKoppelSelectie: (teamIds: string[]) => void;
  onOntkoppelSelectie: (groepId: string) => void;
  onUpdateSelectieNaam?: (groepId: string, naam: string | null) => void;
  selectieGroepMap?: Map<string, SelectieGroepData>;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
  onEditTeam?: (teamId: string) => void;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  compactMode?: boolean;
  positions: PositionMap;
  onRepositionCard: (cardId: string, deltaX: number, deltaY: number) => void;
}

export default function Werkgebied({
  teams,
  zichtbareTeamIds,
  validatieMap,
  selectieValidatieMap,
  onDeleteTeam,
  onKoppelSelectie,
  onOntkoppelSelectie,
  onUpdateSelectieNaam,
  selectieGroepMap,
  onSpelerClick,
  onEditTeam,
  pinnedSpelerIds,
  showRanking,
  compactMode,
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

  const selectieGroepenArray = useMemo(
    () => (selectieGroepMap ? Array.from(selectieGroepMap.values()) : []),
    [selectieGroepMap]
  );
  const jIndicatieMap = useMemo(
    () => berekenJIndicaties(teams, selectieGroepenArray),
    [teams, selectieGroepenArray]
  );
  const teamSterkteMap = useMemo(
    () => berekenTeamSterktes(teams, selectieGroepenArray),
    [teams, selectieGroepenArray]
  );

  const handleKoppel = useCallback(() => {
    if (geselecteerd.size < 2) return;
    onKoppelSelectie(Array.from(geselecteerd));
    setGeselecteerd(new Set());
  }, [geselecteerd, onKoppelSelectie]);

  // Selectie = altijd precies 2 achtallen
  const geselecteerdeTeams = useMemo(
    () => zichtbareTeams.filter((t) => geselecteerd.has(t.id)),
    [zichtbareTeams, geselecteerd]
  );
  const alleAchtallen = geselecteerdeTeams.every((t) => !t.teamType || t.teamType === "ACHTAL");
  const kanKoppelen = geselecteerd.size === 2 && alleAchtallen;

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
              Koppel selectie
            </button>
          </div>
        </div>
      )}

      {/* Zoomable grid */}
      <GestureCanvas>
        {(zoomDetailLevel) => {
          const detailLevel = compactMode ? ("overzicht" as const) : zoomDetailLevel;
          return zichtbareTeams.length === 0 ? (
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
                      selectieValidatie={selectieValidatieMap?.get(groepId)}
                      detailLevel={detailLevel}
                      pinnedSpelerIds={pinnedSpelerIds}
                      showRanking={showRanking}
                      jIndicatie={jIndicatieMap.get(dragId)}
                      teamSterkte={teamSterkteMap.get(dragId)}
                      onOntkoppel={onOntkoppelSelectie}
                      onUpdateNaam={onUpdateSelectieNaam}
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
                      pinnedSpelerIds={pinnedSpelerIds}
                      showRanking={showRanking}
                      jIndicatie={jIndicatieMap.get(team.id)}
                      teamSterkte={teamSterkteMap.get(team.id)}
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
          );
        }}
      </GestureCanvas>
    </div>
  );
}
