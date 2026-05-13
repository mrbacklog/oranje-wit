"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TeamKaartData } from "./werkbord-types";
import { TeamKaart } from "./TeamKaart";
import { ZoomControls } from "./ZoomControls";

interface WerkbordCanvasProps {
  teams: TeamKaartData[];
  peildatum: Date;
  zoom: "compact" | "detail";
  onZoomChange: (zoom: "compact" | "detail") => void;
  onTeamClick: (teamId: string) => void;
}

export function WerkbordCanvas({
  teams,
  peildatum,
  zoom,
  onZoomChange,
  onTeamClick,
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
        {teams.map((team) => (
          <TeamKaart
            key={team.id}
            team={team}
            zoom={zoom}
            peildatum={peildatum}
            onHeaderClick={onTeamClick}
            onSpelerClick={() => {
              /* fase 2: SpelerDialog openen */
            }}
            onStafClick={() => {
              /* fase 2: StafDialog openen */
            }}
          />
        ))}
      </div>

      <div className="save-indicator" />
    </div>
  );
}
