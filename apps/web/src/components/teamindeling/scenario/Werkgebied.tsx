"use client";

import { useState, useMemo, useCallback } from "react";
import type { TeamData, SpelerData, SelectieGroepData } from "./types";
import { berekenJIndicaties, berekenTeamSterktes } from "./types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";
import type { SelectieValidatie } from "@/lib/teamindeling/validatie/selectie-regels";
import type { PositionMap } from "./hooks/useCardPositions";
import GestureCanvas from "./editor/GestureCanvas";
import GestureCard from "./editor/GestureCard";
import TeamKaart from "./TeamKaart";
import SelectieBlok from "./SelectieBlok";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./editor/cardSizes";

export type WhatIfZone = "actief" | "impact" | "ongeraakt";

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
  /** What-if zone per teamId — als ingesteld wordt de zone-overlay getoond */
  whatIfZones?: Map<string, WhatIfZone>;
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
  whatIfZones,
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

  const zoneStijl = useCallback(
    (teamId: string): React.CSSProperties => {
      if (!whatIfZones) return {};
      const zone = whatIfZones.get(teamId);
      if (zone === "actief") return { outline: "2px solid #f97316", borderRadius: 8 };
      if (zone === "impact")
        return { outline: "2px dashed #eab308", borderRadius: 8, opacity: 0.85 };
      if (zone === "ongeraakt") return { opacity: 0.4, pointerEvents: "none" as const };
      return {};
    },
    [whatIfZones]
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
    <div
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
      style={{ background: "var(--surface-page)" }}
    >
      {/* Zwevende selectiebalk — alleen zichtbaar bij selectie */}
      {geselecteerd.size > 0 && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {geselecteerd.size} geselecteerd
            </span>
            <button
              onClick={() => setGeselecteerd(new Set())}
              className="text-xs transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Deselecteer
            </button>
            <button
              onClick={handleKoppel}
              disabled={!kanKoppelen}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={
                kanKoppelen
                  ? { background: "var(--ow-oranje-500)", color: "#fff" }
                  : {
                      background: "var(--surface-sunken)",
                      color: "var(--text-tertiary)",
                      cursor: "not-allowed",
                    }
              }
            >
              Koppel selectie
            </button>
          </div>
        </div>
      )}

      {/* Zoomable grid */}
      <GestureCanvas>
        {(zoomDetailLevel) => {
          const detailLevel = compactMode ? ("compact" as const) : zoomDetailLevel;
          return zichtbareTeams.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Selecteer teams in de navigator om ze hier te tonen.
              </p>
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                border: "1px dashed var(--border-default)",
              }}
            >
              {/* Selectie-groepen */}
              {Array.from(selectieGroepen.entries()).map(([groepId, groepTeams]) => {
                const dragId = `selectie-${groepId}`;
                const pos = positions[dragId] ?? { x: 0, y: 0 };
                // Zone bepalen op basis van eerste team in selectie
                const eersteTeamId = groepTeams[0]?.id ?? "";
                const stijl = zoneStijl(eersteTeamId);
                return (
                  <GestureCard
                    key={dragId}
                    cardId={dragId}
                    position={pos}
                    onDragEnd={onRepositionCard}
                  >
                    <div style={stijl}>
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
                    </div>
                  </GestureCard>
                );
              })}
              {/* Losse teams */}
              {losseTeams.map((team) => {
                const pos = positions[team.id] ?? { x: 0, y: 0 };
                const teamStijl = zoneStijl(team.id);
                return (
                  <GestureCard
                    key={team.id}
                    cardId={team.id}
                    position={pos}
                    onDragEnd={onRepositionCard}
                  >
                    <div style={teamStijl}>
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
                    </div>
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
