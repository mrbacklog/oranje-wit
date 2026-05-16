"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { TeamKaartData, SelectieGroepMeta } from "./werkbord-types";
import { TeamKaart } from "./TeamKaart";
import { ZoomControls } from "./ZoomControls";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";

interface WerkbordCanvasProps {
  teams: TeamKaartData[];
  selectieGroepen: SelectieGroepMeta[];
  peildatum: Date;
  zoom: "compact" | "detail";
  onZoomChange: (zoom: "compact" | "detail") => void;
  onTeamClick: (teamId: string) => void;
  onDropSpelerOpTeam?: (data: WerkbordDragData, naarTeamId: string) => void;
}

// Bepaal selectie-frame kleur-variant obv de naam van de selectiegroep
function selectieFrameKlasse(naam: string | null): string {
  const n = naam?.toUpperCase() ?? "";
  if (n.includes("U15") || n.includes("U13")) return "sel-oranje";
  if (n.includes("U17")) return "sel-oranje-rood";
  if (n.includes("U19") || n.includes("U18")) return "sel-rood";
  return "sel-zilver";
}

function renderTeamsMetSelectieFrames(
  teams: TeamKaartData[],
  selectieGroepen: SelectieGroepMeta[],
  zoom: "compact" | "detail",
  peildatum: Date,
  onTeamClick: (teamId: string) => void,
  onDropSpelerOpTeam: ((data: WerkbordDragData, naarTeamId: string) => void) | undefined
): React.ReactNode {
  // Bouw een map: teamId → selectieGroep (voor gebundelde frames)
  const teamInSelectie = new Map<string, SelectieGroepMeta>();
  const gebundeldFrames = new Set<string>(); // selectieGroep.id

  for (const sg of selectieGroepen) {
    if (sg.gebundeld) {
      for (const teamId of sg.teamIds) {
        teamInSelectie.set(teamId, sg);
        gebundeldFrames.add(sg.id);
      }
    }
  }

  const gerendered = new Set<string>();
  const nodes: React.ReactNode[] = [];

  for (const team of teams) {
    if (gerendered.has(team.id)) continue;

    const sg = teamInSelectie.get(team.id);

    if (sg && sg.gebundeld) {
      // Render alle teams van deze selectiegroep samen in een selectie-frame
      const frameTeams = sg.teamIds
        .map((id) => teams.find((t) => t.id === id))
        .filter((t): t is TeamKaartData => t !== undefined);

      for (const ft of frameTeams) gerendered.add(ft.id);

      nodes.push(
        <div
          key={`selectie-frame-${sg.id}`}
          className={`selectie-frame ${selectieFrameKlasse(sg.naam)} gebundeld`}
          data-naam={sg.naam ?? "Selectie"}
        >
          <span className="sel-badge">Gebundeld</span>
          {frameTeams.map((t) => (
            <TeamKaart
              key={t.id}
              team={t}
              zoom={zoom}
              peildatum={peildatum}
              onHeaderClick={onTeamClick}
              onSpelerClick={() => {
                /* fase 2 */
              }}
              onStafClick={() => {
                /* fase 2 */
              }}
              onDropSpeler={onDropSpelerOpTeam}
            />
          ))}
        </div>
      );
    } else {
      gerendered.add(team.id);
      nodes.push(
        <TeamKaart
          key={team.id}
          team={team}
          zoom={zoom}
          peildatum={peildatum}
          onHeaderClick={onTeamClick}
          onSpelerClick={() => {
            /* fase 2 */
          }}
          onStafClick={() => {
            /* fase 2 */
          }}
          onDropSpeler={onDropSpelerOpTeam}
        />
      );
    }
  }

  return nodes;
}

export function WerkbordCanvas({
  teams,
  selectieGroepen,
  peildatum,
  zoom,
  onZoomChange,
  onTeamClick,
  onDropSpelerOpTeam,
}: WerkbordCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0, isPanning: false, sx: 0, sy: 0 });
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const scale = zoom === "compact" ? 0.6 : 1.0;

  // Sync panPos to transform
  useEffect(() => {
    if (!surfaceRef.current) return;
    surfaceRef.current.style.transform = `translate(${panPos.x}px,${panPos.y}px) scale(${scale})`;
  }, [panPos, scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".zoom-controls,.team-kaart,.save-indicator")) return;
    panRef.current.isPanning = true;
    panRef.current.sx = e.clientX - panRef.current.x;
    panRef.current.sy = e.clientY - panRef.current.y;
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!panRef.current.isPanning) return;
      panRef.current.x = e.clientX - panRef.current.sx;
      panRef.current.y = e.clientY - panRef.current.sy;
      setPanPos({ x: panRef.current.x, y: panRef.current.y });
    };
    const onUp = () => {
      panRef.current.isPanning = false;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  function handleReset() {
    panRef.current.x = 0;
    panRef.current.y = 0;
    setPanPos({ x: 0, y: 0 });
  }

  return (
    <div
      ref={canvasRef}
      className="werkbord-canvas"
      onMouseDown={handleMouseDown}
      style={{ cursor: "grab" }}
    >
      <ZoomControls zoom={zoom} onZoomChange={onZoomChange} onReset={handleReset} />

      <div
        ref={surfaceRef}
        className={`map-surface zoom-${zoom}`}
        style={{
          transform: `translate(${panPos.x}px,${panPos.y}px) scale(${scale})`,
          transition: "none",
        }}
      >
        {renderTeamsMetSelectieFrames(
          teams,
          selectieGroepen,
          zoom,
          peildatum,
          onTeamClick,
          onDropSpelerOpTeam
        )}
      </div>

      <div className="save-indicator" />
    </div>
  );
}
