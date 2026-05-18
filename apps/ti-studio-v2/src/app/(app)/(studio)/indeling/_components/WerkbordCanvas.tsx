"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { TeamKaartData, SelectieGroepMeta } from "./werkbord-types";
import { TeamKaart } from "./TeamKaart";
import { SelectieKaart } from "./SelectieKaart";
import { ZoomControls } from "./ZoomControls";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";
import { useKaartDraggable } from "./hooks/useKaartDraggable";

// Grid-fallback constanten (zelfde logica als v1 page.tsx:294)
const GRID_KOLOMMEN = 4;
const KOLOM_BREEDTE = 260;
const RIJ_HOOGTE = 300;
const GRID_GAP = 20;
const GRID_OFFSET_X = 40;
const GRID_OFFSET_Y = 60;

export function gridFallback(index: number): { x: number; y: number } {
  const col = index % GRID_KOLOMMEN;
  const rij = Math.floor(index / GRID_KOLOMMEN);
  return {
    x: GRID_OFFSET_X + col * (KOLOM_BREEDTE + GRID_GAP),
    y: GRID_OFFSET_Y + rij * (RIJ_HOOGTE + GRID_GAP),
  };
}

interface WerkbordCanvasProps {
  teams: TeamKaartData[];
  selectieGroepen: SelectieGroepMeta[];
  peildatum: Date;
  zoom: "compact" | "detail";
  onZoomChange: (zoom: "compact" | "detail") => void;
  onTeamClick: (teamId: string) => void;
  onDropSpelerOpTeam?: (data: WerkbordDragData, naarTeamId: string) => void;
  /** Opgeslagen canvas-posities per kaartKey */
  posities: Record<string, { x: number; y: number }>;
  /** Callback bij kaart-drop: kaartKey + nieuwe X/Y op canvas */
  onKaartDrop?: (kaartKey: string, x: number, y: number) => void;
}

// ── KaartWrapper — individu wrapping per visuele kaart ───────────────────────

interface KaartWrapperProps {
  kaartKey: string;
  gridIndex: number;
  posities: Record<string, { x: number; y: number }>;
  schaal: number;
  onKaartDrop?: (kaartKey: string, x: number, y: number) => void;
  headerSelector: string; // CSS selector waarop het slepen wordt geactiveerd
  children: React.ReactNode;
  testId?: string;
}

function KaartWrapper({
  kaartKey,
  gridIndex,
  posities,
  schaal,
  onKaartDrop,
  headerSelector,
  children,
  testId,
}: KaartWrapperProps) {
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);

  // Effectieve positie: sleep-positie > opgeslagen > grid-fallback
  const opgeslagen = posities[kaartKey];
  const basePos = opgeslagen ?? gridFallback(gridIndex);
  const effectief = localPos ?? basePos;

  const { handleMouseDown, isDragging } = useKaartDraggable({
    kaartKey,
    huidigePos: effectief,
    schaal,
    onMove: (_key, x, y) => setLocalPos({ x, y }),
    onDrop: (key, x, y) => {
      setLocalPos({ x, y });
      onKaartDrop?.(key, x, y);
    },
  });

  const handleWrapperMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(headerSelector)) {
        handleMouseDown(e);
      }
    },
    [handleMouseDown, headerSelector]
  );

  return (
    <div
      data-kaart-key={kaartKey}
      data-testid={testId}
      style={{
        position: "absolute",
        left: effectief.x,
        top: effectief.y,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        zIndex: isDragging ? 10 : 1,
      }}
      onMouseDown={handleWrapperMouseDown}
    >
      {children}
    </div>
  );
}

// ── WerkbordCanvas ────────────────────────────────────────────────────────────

export function WerkbordCanvas({
  teams,
  selectieGroepen,
  peildatum,
  zoom,
  onZoomChange,
  onTeamClick,
  onDropSpelerOpTeam,
  posities,
  onKaartDrop,
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
    if (target.closest(".zoom-controls,.team-kaart,.selectie-kaart,.save-indicator")) return;
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

  // ── Kaarten renderen ───────────────────────────────────────────────────────

  const teamInSelectie = new Map<string, SelectieGroepMeta>();
  for (const sg of selectieGroepen) {
    for (const teamId of sg.teamIds) {
      teamInSelectie.set(teamId, sg);
    }
  }

  const gerendered = new Set<string>();
  const nodes: React.ReactNode[] = [];
  let gridIndex = 0;

  for (const team of teams) {
    if (gerendered.has(team.id)) continue;

    const sg = teamInSelectie.get(team.id);

    if (sg) {
      const groepTeams = sg.teamIds
        .map((id) => teams.find((t) => t.id === id))
        .filter((t): t is TeamKaartData => t !== undefined);

      for (const ft of groepTeams) gerendered.add(ft.id);

      const kaartKey = `sg-${sg.id}`;
      const idx = gridIndex++;

      nodes.push(
        <KaartWrapper
          key={kaartKey}
          kaartKey={kaartKey}
          gridIndex={idx}
          posities={posities}
          schaal={scale}
          onKaartDrop={onKaartDrop}
          // Sleep activeren via de header van de selectie-kaart
          headerSelector=".sk-header"
          testId={`kaart-wrap-sg-${sg.id}`}
        >
          <SelectieKaart
            groep={sg}
            teams={groepTeams}
            zoom={zoom}
            peildatum={peildatum}
            onHeaderClick={() => {
              /* fase 2: open selectie-drawer */
            }}
            onTeamHeaderClick={onTeamClick}
            onSpelerClick={() => {
              /* fase 2 */
            }}
            onStafClick={() => {
              /* fase 2 */
            }}
            onDropSpeler={onDropSpelerOpTeam}
          />
        </KaartWrapper>
      );
    } else {
      gerendered.add(team.id);

      const kaartKey = `team-${team.id}`;
      const idx = gridIndex++;

      nodes.push(
        <KaartWrapper
          key={kaartKey}
          kaartKey={kaartKey}
          gridIndex={idx}
          posities={posities}
          schaal={scale}
          onKaartDrop={onKaartDrop}
          // Sleep activeren via de header van de team-kaart
          headerSelector=".tk-header"
          testId={`kaart-wrap-${team.id}`}
        >
          <TeamKaart
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
        </KaartWrapper>
      );
    }
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
          position: "relative",
          minWidth: 2400,
          minHeight: 1600,
          transform: `translate(${panPos.x}px,${panPos.y}px) scale(${scale})`,
          transition: "none",
        }}
      >
        {nodes}
      </div>

      <div className="save-indicator" />
    </div>
  );
}
