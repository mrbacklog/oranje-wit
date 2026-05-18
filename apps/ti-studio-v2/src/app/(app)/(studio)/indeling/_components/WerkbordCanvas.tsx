"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { TeamKaartData, SelectieGroepMeta } from "./werkbord-types";
import { TeamKaart } from "./TeamKaart";
import { SelectieKaart } from "./SelectieKaart";
import { ZoomControls } from "./ZoomControls";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";

// Grid-fallback constanten (zelfde logica als v1 page.tsx:294)
const GRID_KOLOMMEN = 4;
const KOLOM_BREEDTE = 260;
const RIJ_HOOGTE = 300;
const GRID_GAP = 20;
const GRID_OFFSET_X = 40;
const GRID_OFFSET_Y = 60;

function gridFallback(index: number): { x: number; y: number } {
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

interface KaartPositie {
  kaartKey: string;
  x: number;
  y: number;
}

function renderKaarten(
  teams: TeamKaartData[],
  selectieGroepen: SelectieGroepMeta[],
  zoom: "compact" | "detail",
  peildatum: Date,
  posities: Record<string, { x: number; y: number }>,
  onTeamClick: (teamId: string) => void,
  onDropSpelerOpTeam: ((data: WerkbordDragData, naarTeamId: string) => void) | undefined,
  onKaartMouseDown: (e: React.MouseEvent, kaartKey: string) => void,
  sleepbareKaarten: Set<string>
): { nodes: React.ReactNode[]; gridIndex: number } {
  // Bouw map: teamId → selectieGroep (voor alle groepen, gebundeld én niet)
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
      // Render één SelectieKaart voor de hele groep (gebundeld OF niet-gebundeld)
      const groepTeams = sg.teamIds
        .map((id) => teams.find((t) => t.id === id))
        .filter((t): t is TeamKaartData => t !== undefined);

      for (const ft of groepTeams) gerendered.add(ft.id);

      const kaartKey = `sg-${sg.id}`;
      const opgeslagen = posities[kaartKey];
      const pos: KaartPositie = opgeslagen
        ? { kaartKey, x: opgeslagen.x, y: opgeslagen.y }
        : { kaartKey, ...gridFallback(gridIndex) };
      gridIndex++;

      const isSleepbaar = sleepbareKaarten.has(kaartKey);

      nodes.push(
        <div
          key={`selectie-wrap-${sg.id}`}
          data-kaart-key={kaartKey}
          data-testid={`kaart-wrap-sg-${sg.id}`}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            cursor: isSleepbaar ? "grabbing" : "grab",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            // Alleen de header is sleepbaar — niet de speler-interacties daarbinnen
            const target = e.target as HTMLElement;
            if (target.closest(".sk-header,.sk-naam,.sel-badge")) {
              onKaartMouseDown(e, kaartKey);
            }
          }}
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
        </div>
      );
    } else {
      gerendered.add(team.id);

      const kaartKey = `team-${team.id}`;
      const opgeslagen = posities[kaartKey];
      const pos: KaartPositie = opgeslagen
        ? { kaartKey, x: opgeslagen.x, y: opgeslagen.y }
        : { kaartKey, ...gridFallback(gridIndex) };
      gridIndex++;

      const isSleepbaar = sleepbareKaarten.has(kaartKey);

      nodes.push(
        <div
          key={`team-wrap-${team.id}`}
          data-kaart-key={kaartKey}
          data-testid={`kaart-wrap-${team.id}`}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            cursor: isSleepbaar ? "grabbing" : "grab",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            // Sleepbaar via tk-header (niet via speler-kaarten)
            if (target.closest(".tk-header")) {
              onKaartMouseDown(e, kaartKey);
            }
          }}
        >
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
        </div>
      );
    }
  }

  return { nodes, gridIndex };
}

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

  // ── Kaart-sleep state ─────────────────────────────────────────────────────
  const kaartSleepRef = useRef<{
    actief: boolean;
    kaartKey: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const [sleepPosities, setSleepPosities] = useState<Record<string, { x: number; y: number }>>({});
  const [sleepbareKaarten, setSleepbareKaarten] = useState<Set<string>>(new Set());

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

  // Kaart-sleep starten (vanuit kaart-header mousedown)
  const handleKaartMouseDown = useCallback(
    (e: React.MouseEvent, kaartKey: string) => {
      e.stopPropagation(); // voorkomt canvas-pan

      // Huidige positie van de kaart
      const huidigePos = sleepPosities[kaartKey] ?? posities[kaartKey];

      // Bereken grid-fallback als er nog geen positie is
      const allKeys = [
        ...selectieGroepen.map((sg) => `sg-${sg.id}`),
        ...teams
          .filter((t) => !selectieGroepen.some((sg) => sg.teamIds.includes(t.id)))
          .map((t) => `team-${t.id}`),
      ];
      const gridIdx = allKeys.indexOf(kaartKey);
      const fallback = gridIdx >= 0 ? gridFallback(gridIdx) : { x: 40, y: 60 };
      const startPos = huidigePos ?? fallback;

      kaartSleepRef.current = {
        actief: true,
        kaartKey,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPosX: startPos.x,
        startPosY: startPos.y,
      };

      setSleepbareKaarten((prev) => new Set([...prev, kaartKey]));
    },
    [sleepPosities, posities, selectieGroepen, teams]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const ks = kaartSleepRef.current;
      if (ks?.actief) {
        // Pas muis-delta aan voor zoom-schaal
        const dx = (e.clientX - ks.startMouseX) / scale;
        const dy = (e.clientY - ks.startMouseY) / scale;
        const newX = Math.max(0, ks.startPosX + dx);
        const newY = Math.max(0, ks.startPosY + dy);
        setSleepPosities((prev) => ({
          ...prev,
          [ks.kaartKey]: { x: newX, y: newY },
        }));
        return; // geen canvas-pan tijdens kaart-sleep
      }

      if (!panRef.current.isPanning) return;
      panRef.current.x = e.clientX - panRef.current.sx;
      panRef.current.y = e.clientY - panRef.current.sy;
      setPanPos({ x: panRef.current.x, y: panRef.current.y });
    };

    const onUp = (e: MouseEvent) => {
      const ks = kaartSleepRef.current;
      if (ks?.actief) {
        ks.actief = false;
        const pos = sleepPosities[ks.kaartKey];
        if (pos && onKaartDrop) {
          onKaartDrop(ks.kaartKey, Math.round(pos.x), Math.round(pos.y));
        }
        setSleepbareKaarten((prev) => {
          const next = new Set(prev);
          next.delete(ks.kaartKey);
          return next;
        });
        kaartSleepRef.current = null;
        return;
      }

      panRef.current.isPanning = false;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [scale, sleepPosities, onKaartDrop]);

  function handleReset() {
    panRef.current.x = 0;
    panRef.current.y = 0;
    setPanPos({ x: 0, y: 0 });
  }

  // Samengevoegde posities: sleep-posities overschrijven opgeslagen posities
  const effectievePosities = { ...posities, ...sleepPosities };

  const { nodes } = renderKaarten(
    teams,
    selectieGroepen,
    zoom,
    peildatum,
    effectievePosities,
    onTeamClick,
    onDropSpelerOpTeam,
    handleKaartMouseDown,
    sleepbareKaarten
  );

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
