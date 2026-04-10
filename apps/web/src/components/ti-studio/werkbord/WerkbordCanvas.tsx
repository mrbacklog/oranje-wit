// apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import "./tokens.css";
import { TeamKaart } from "./TeamKaart";
import { DaisyPanel } from "./DaisyPanel";
import type { WerkbordTeam, WerkbordSpeler, ZoomLevel, KaartFormaat } from "./types";

interface WerkbordCanvasProps {
  teams: WerkbordTeam[];
  zoomLevel: ZoomLevel;
  zoom: number;
  zoomPercent: number;
  showScores: boolean;
  onToggleScores: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomChange: (value: number) => void;
  onOpenTeamDrawer: (teamId: string) => void;
  onDropSpelerOpTeam: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarTeamId: string,
    naarGeslacht: "V" | "M"
  ) => void;
  onTeamPositionChange: (teamId: string, x: number, y: number) => void;
  onTeamDragEnd: (teamId: string, x: number, y: number) => void;
  onReturneerNaarPool: (spelerData: WerkbordSpeler, vanTeamId: string) => void;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  onDropSpelerOpSelectie: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    vanSelectieGroepId: string | null,
    naarSelectieGroepId: string,
    geslacht: "V" | "M"
  ) => void;
  onToggleBundeling: (selectieGroepId: string, gebundeld: boolean) => void;
  onTitelKlik?: (teamId: string) => void;
}

interface TeamDragState {
  teamId: string;
  startMouseX: number;
  startMouseY: number;
  startCanvasX: number;
  startCanvasY: number;
}

interface PanState {
  startMouseX: number;
  startMouseY: number;
  startPanX: number;
  startPanY: number;
}

const CANVAS_W = 1400;
const CANVAS_H = 900;
const MINIMAP_W = 160;
const MINIMAP_H = 110;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const KAART_BREEDTE: Record<KaartFormaat, number> = { viertal: 160, achtal: 320, selectie: 640 };
const RIJ_HOOGTE = 40; // SPELER_RIJ_HOOGTE — vaste rijhoogte alle zoomniveaus
const MIN_DROPZONE = 8 * RIJ_HOOGTE; // 320px

function schatKaartHoogte(team: WerkbordTeam, zoomLevel?: ZoomLevel): number {
  // In compact modus: geen label boven de dropzone (14px minder), maar verder identiek.
  const aantalStaf = team.staf.length;
  const headerHoogte = 85; // 2,5× vergroot
  const footerHoogte = 65; // 2,5× vergroot
  const stafHoogte = aantalStaf > 0 ? aantalStaf * 20 + 1 : 0;
  const labelHoogte = zoomLevel === "compact" ? 0 : 14;
  if (team.formaat === "viertal") {
    // Viertal: dames + heren gestapeld in 1 kolom
    const kolomHoogte = Math.max(
      (team.dames.length + team.heren.length) * RIJ_HOOGTE,
      MIN_DROPZONE * 2 // 2 secties elk min 320px
    );
    return headerHoogte + 2 * labelHoogte + kolomHoogte + stafHoogte + footerHoogte;
  }
  const kolomHoogte = Math.max(
    team.dames.length * RIJ_HOOGTE,
    team.heren.length * RIJ_HOOGTE,
    MIN_DROPZONE
  );
  return headerHoogte + labelHoogte + kolomHoogte + stafHoogte + footerHoogte;
}

export function WerkbordCanvas({
  teams,
  zoomLevel,
  zoom,
  zoomPercent,
  showScores,
  onToggleScores,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
  onOpenTeamDrawer,
  onDropSpelerOpTeam,
  onReturneerNaarPool,
  onTeamPositionChange,
  onTeamDragEnd,
  onSpelerClick,
  onDropSpelerOpSelectie,
  onToggleBundeling,
  onTitelKlik,
}: WerkbordCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [draggingTeam, setDraggingTeam] = useState<TeamDragState | null>(null);
  const dragHasMovedRef = useRef(false);
  const [panState, setPanState] = useState<PanState | null>(null);
  const [minimapDragging, setMinimapDragging] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Refs zodat wheel-handler altijd verse waarden heeft
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panXRef.current = panX;
  }, [panX]);
  useEffect(() => {
    panYRef.current = panY;
  }, [panY]);
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  // Scroll-zoom naar cursor — passive: false vereist
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const currentZoom = zoomRef.current;
      const factor = Math.abs(e.deltaY) < 50 ? 0.04 : 0.08;
      const delta = e.deltaY > 0 ? -factor : factor;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + delta));
      const canvasPtX = (cursorX - panXRef.current) / currentZoom;
      const canvasPtY = (cursorY - panYRef.current) / currentZoom;
      setPanX(cursorX - canvasPtX * newZoom);
      setPanY(cursorY - canvasPtY * newZoom);
      onZoomChangeRef.current(newZoom);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Fit: zoom + pan zodat alle kaarten zichtbaar zijn
  const handleFit = useCallback(() => {
    if (!containerRef.current) return;
    const margin = 40;
    if (teams.length === 0) {
      onZoomReset();
      setPanX(0);
      setPanY(0);
      return;
    }
    const minX = Math.min(...teams.map((t) => t.canvasX)) - margin;
    const minY = Math.min(...teams.map((t) => t.canvasY)) - margin;
    const maxX = Math.max(...teams.map((t) => t.canvasX + KAART_BREEDTE[t.formaat])) + margin;
    const maxY = Math.max(...teams.map((t) => t.canvasY + schatKaartHoogte(t, zoomLevel))) + margin;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const cw = containerRef.current.offsetWidth;
    const ch = containerRef.current.offsetHeight;
    const fitZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(cw / contentW, ch / contentH)));
    onZoomChange(fitZoom);
    setPanX(cw / 2 - (minX + contentW / 2) * fitZoom);
    setPanY(ch / 2 - (minY + contentH / 2) * fitZoom);
  }, [teams, onZoomChange, onZoomReset]);

  // ─── Canvas event handlers ─────────────────────────────────────────────────

  function handleBgMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    setPanState({
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPanX: panX,
      startPanY: panY,
    });
  }

  function handleTeamHeaderMouseDown(e: React.MouseEvent, teamId: string) {
    e.preventDefault();
    e.stopPropagation();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    // Globale cursor direct — browser update wacht anders op muisbeweging
    document.body.style.cursor = "grabbing";
    dragHasMovedRef.current = false;
    setDraggingTeam({
      teamId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startCanvasX: team.canvasX,
      startCanvasY: team.canvasY,
    });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (draggingTeam) {
      const rawDx = e.clientX - draggingTeam.startMouseX;
      const rawDy = e.clientY - draggingTeam.startMouseY;
      if (Math.abs(rawDx) > 4 || Math.abs(rawDy) > 4) dragHasMovedRef.current = true;
      const dx = rawDx / zoom;
      const dy = rawDy / zoom;
      const newX = draggingTeam.startCanvasX + dx;
      const newY = draggingTeam.startCanvasY + dy;
      onTeamPositionChange(draggingTeam.teamId, newX, newY);
      // Selectie-partner meeslepen
      const draggend = teams.find((t) => t.id === draggingTeam.teamId);
      if (draggend?.selectieGroepId) {
        const partner = teams.find(
          (t) => t.selectieGroepId === draggend.selectieGroepId && t.id !== draggend.id
        );
        if (partner) onTeamPositionChange(partner.id, newX, newY);
      }
    } else if (panState) {
      setPanX(panState.startPanX + (e.clientX - panState.startMouseX));
      setPanY(panState.startPanY + (e.clientY - panState.startMouseY));
    } else if (minimapDragging && minimapRef.current) {
      const rect = minimapRef.current.getBoundingClientRect();
      const mx = Math.max(0, Math.min(MINIMAP_W, e.clientX - rect.left));
      const my = Math.max(0, Math.min(MINIMAP_H, e.clientY - rect.top));
      const { x, y } = minimapToPan(mx, my);
      setPanX(x);
      setPanY(y);
    }
  }

  function handleMouseUp() {
    document.body.style.cursor = ""; // globale cursor terugzetten
    if (draggingTeam) {
      const team = teams.find((t) => t.id === draggingTeam.teamId);
      if (team) {
        onTeamDragEnd(draggingTeam.teamId, team.canvasX, team.canvasY);
        // Selectie-partner positie ook opslaan
        if (team.selectieGroepId) {
          const partner = teams.find(
            (t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id
          );
          if (partner) onTeamDragEnd(partner.id, team.canvasX, team.canvasY);
        }
      }
      setDraggingTeam(null);
    }
    setPanState(null);
    setMinimapDragging(false);
  }

  // ─── Minimap ────────────────────────────────────────────────────────────────

  function minimapToPan(mx: number, my: number): { x: number; y: number } {
    const cw = containerRef.current?.offsetWidth ?? 800;
    const ch = containerRef.current?.offsetHeight ?? 600;
    const cx = (mx / MINIMAP_W) * CANVAS_W;
    const cy = (my / MINIMAP_H) * CANVAS_H;
    return { x: cw / 2 - cx * zoom, y: ch / 2 - cy * zoom };
  }

  function handleMinimapMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = minimapToPan(e.clientX - rect.left, e.clientY - rect.top);
    setPanX(x);
    setPanY(y);
    setMinimapDragging(true);
  }

  // Viewport indicator berekening
  const cw = containerRef.current?.offsetWidth ?? 800;
  const ch = containerRef.current?.offsetHeight ?? 600;
  const vpW = Math.min(MINIMAP_W, (cw / zoom / CANVAS_W) * MINIMAP_W);
  const vpH = Math.min(MINIMAP_H, (ch / zoom / CANVAS_H) * MINIMAP_H);
  const vpX = Math.max(0, (-panX / zoom / CANVAS_W) * MINIMAP_W);
  const vpY = Math.max(0, (-panY / zoom / CANVAS_H) * MINIMAP_H);

  const isBusy = !!draggingTeam || !!panState;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        cursor: panState ? "grabbing" : draggingTeam ? "grabbing" : "default",
        background:
          "radial-gradient(circle at 50% 50%, rgba(255,107,0,.02) 0%, transparent 60%), var(--bg-0)",
      }}
    >
      {/* Achtergrond dot-patroon — pan-zone */}
      <div
        onMouseDown={handleBgMouseDown}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("speler")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData("speler");
          if (!raw) return;
          const data = JSON.parse(raw) as { speler: WerkbordSpeler; vanTeamId: string | null };
          if (!data.vanTeamId) return; // al in pool
          onReturneerNaarPool(data.speler, data.vanTeamId);
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          cursor: panState ? "grabbing" : "grab",
          zIndex: 0,
        }}
      />

      {/* Canvas — geschaald + getransleerd */}
      <div
        data-zoom-level={zoomLevel}
        style={{
          position: "absolute",
          width: CANVAS_W,
          height: CANVAS_H,
          transformOrigin: "0 0",
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transition: isBusy ? "none" : "transform 80ms ease-out",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {teams.map((team) => {
          const partner = team.selectieGroepId
            ? (teams.find((t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id) ??
              null)
            : null;
          // Toon alleen één kaart per selectiegroep: de primaire (laagste index)
          if (partner && teams.indexOf(team) > teams.indexOf(partner)) return null;
          return (
            <TeamKaart
              key={team.id}
              team={team}
              zoomLevel={zoomLevel}
              showScores={showScores}
              onOpenTeamDrawer={onOpenTeamDrawer}
              onDropSpeler={(spelerData, vanTeamId, naarGeslacht) =>
                onDropSpelerOpTeam(spelerData, vanTeamId, team.id, naarGeslacht)
              }
              onHeaderMouseDown={handleTeamHeaderMouseDown}
              onSpelerClick={onSpelerClick}
              partnerTeam={partner}
              onDropSpelerOpSelectie={(spelerData, vanTeamId, vanSelectieGroepId, geslacht) =>
                onDropSpelerOpSelectie(
                  spelerData,
                  vanTeamId,
                  vanSelectieGroepId,
                  team.selectieGroepId!,
                  geslacht
                )
              }
              onToggleBundeling={onToggleBundeling}
              onTitelKlik={
                onTitelKlik
                  ? (id) => {
                      if (!dragHasMovedRef.current) onTitelKlik(id);
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* ─── Score-knop rechtsonder, boven zoom ─────────────────────────────── */}
      <button
        onClick={onToggleScores}
        title={showScores ? "Scores verbergen" : "Scores tonen"}
        style={{
          position: "absolute",
          bottom: 16,
          right: 196,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          background: showScores ? "var(--accent-dim)" : "var(--bg-2)",
          border: showScores ? "1px solid rgba(255,107,0,.3)" : "1px solid var(--border-1)",
          color: showScores ? "var(--accent)" : "var(--text-2)",
          boxShadow: "var(--sh-card)",
          transition: "background 120ms, color 120ms, border-color 120ms",
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Score
      </button>

      {/* ─── Zoom + Minimap panel rechtsonder ─────────────────────────────── */}
      <div
        onMouseEnter={() => setPanelOpen(true)}
        onMouseLeave={() => {
          if (!minimapDragging) setPanelOpen(false);
        }}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        {/* Uitklapbaar gedeelte — minimap + zoom controls */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: panelOpen ? 260 : 0,
            opacity: panelOpen ? 1 : 0,
            transform: panelOpen ? "translateY(0)" : "translateY(6px)",
            transition: "max-height 220ms ease, opacity 160ms ease, transform 160ms ease",
            pointerEvents: panelOpen ? "auto" : "none",
            background: "var(--bg-2)",
            border: "1px solid var(--border-1)",
            borderRadius: "10px 10px 0 0",
            borderBottom: "none",
            boxShadow: "var(--sh-card)",
          }}
        >
          {/* Minimap */}
          <div
            ref={minimapRef}
            onMouseDown={handleMinimapMouseDown}
            onMouseUp={(e) => {
              e.stopPropagation();
              setMinimapDragging(false);
            }}
            style={{
              width: MINIMAP_W,
              height: MINIMAP_H,
              position: "relative",
              overflow: "hidden",
              cursor: minimapDragging ? "grabbing" : "grab",
              borderBottom: "1px solid var(--border-0)",
            }}
          >
            {/* Achtergrond dot-patroon */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)",
                backgroundSize: "6px 6px",
                pointerEvents: "none",
              }}
            />
            {/* Teamkaarten als mini-rechthoeken */}
            {teams.map((team) => {
              const partnerIdx = team.selectieGroepId
                ? teams.findIndex(
                    (t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id
                  )
                : -1;
              if (partnerIdx !== -1 && teams.indexOf(team) > partnerIdx) return null;
              return (
                <div
                  key={team.id}
                  style={{
                    position: "absolute",
                    left: (team.canvasX / CANVAS_W) * MINIMAP_W,
                    top: (team.canvasY / CANVAS_H) * MINIMAP_H,
                    width: Math.max(3, (KAART_BREEDTE[team.formaat] / CANVAS_W) * MINIMAP_W),
                    height: Math.max(2, (schatKaartHoogte(team, zoomLevel) / CANVAS_H) * MINIMAP_H),
                    background: "rgba(255,107,0,.5)",
                    borderRadius: 1,
                    pointerEvents: "none",
                  }}
                />
              );
            })}
            {/* Viewport indicator — dit is wat je vastgrijpt */}
            <div
              style={{
                position: "absolute",
                left: vpX,
                top: vpY,
                width: vpW,
                height: vpH,
                border: "1.5px solid rgba(255,107,0,.9)",
                background: "rgba(255,107,0,.08)",
                borderRadius: 2,
                pointerEvents: "none",
                boxShadow: "0 0 0 1px rgba(0,0,0,.3)",
              }}
            />
          </div>

          {/* Zoom controls */}
          <div
            style={{
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <button
              onClick={onZoomOut}
              title="Zoom uit"
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-2)",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              −
            </button>
            <input
              type="range"
              min={40}
              max={150}
              value={zoomPercent}
              onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
              style={{
                flex: 1,
                height: 4,
                accentColor: "var(--accent)",
                cursor: "pointer",
              }}
            />
            <button
              onClick={onZoomIn}
              title="Zoom in"
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-2)",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              +
            </button>
            <div style={{ width: 1, height: 14, background: "var(--border-0)" }} />
            <button
              onClick={handleFit}
              title="Alle kaarten in beeld"
              style={{
                padding: "3px 7px",
                background: "none",
                border: "1px solid var(--border-1)",
                borderRadius: 5,
                color: "var(--text-2)",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              Fit
            </button>
          </div>
        </div>

        {/* Trigger pill — altijd zichtbaar */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border-1)",
            borderRadius: panelOpen ? "0 0 8px 8px" : 8,
            padding: "5px 10px",
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "default",
            boxShadow: panelOpen ? "none" : "var(--sh-card)",
            transition: "border-radius 220ms ease",
            userSelect: "none",
          }}
        >
          {/* Zoom icoon */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-2)",
              minWidth: 28,
              textAlign: "right",
            }}
          >
            {zoomPercent}%
          </span>
          {/* Zoom level indicator */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-3)",
              borderLeft: "1px solid var(--border-0)",
              paddingLeft: 7,
            }}
          >
            {zoomLevel === "compact" ? "Compact" : zoomLevel === "normaal" ? "Normaal" : "Detail"}
          </span>
        </div>
      </div>

      {/* Daisy Panel */}
      <DaisyPanel />
    </div>
  );
}
