// apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
"use client";
import { useRef } from "react";
import "./tokens.css";
import { TeamKaart } from "./TeamKaart";
import { DaisyPanel } from "./DaisyPanel";
import type { WerkbordTeam, ZoomLevel } from "./types";

interface WerkbordCanvasProps {
  teams: WerkbordTeam[];
  zoomLevel: ZoomLevel;
  zoom: number;
  zoomPercent: number;
  showScores: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomChange: (value: number) => void;
  onBewerkenTeam: (teamId: string) => void;
}

const CANVAS_W = 1400;
const CANVAS_H = 900;
const HUIDIGE_JAAR = new Date().getFullYear();

const zoomBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-2)",
  fontSize: 14,
  fontWeight: 700,
};

export function WerkbordCanvas({
  teams,
  zoomLevel,
  zoom,
  zoomPercent,
  showScores,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
  onBewerkenTeam,
}: WerkbordCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(255,107,0,.02) 0%, transparent 60%), var(--bg-0)",
      }}
    >
      {/* Dot-patroon achtergrond */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* Canvas — schaalbaar, teamkaarten erin */}
      <div
        ref={canvasRef}
        data-zoom-level={zoomLevel}
        style={{
          position: "absolute",
          width: CANVAS_W,
          height: CANVAS_H,
          transformOrigin: "0 0",
          transform: `scale(${zoom})`,
          transition: "transform 80ms ease-out",
        }}
      >
        {teams.map((team) => (
          <TeamKaart
            key={team.id}
            team={team}
            zoomLevel={zoomLevel}
            showScores={showScores}
            huidigeJaar={HUIDIGE_JAAR}
            onBewerken={onBewerkenTeam}
            onDragMove={() => {}}
          />
        ))}
      </div>

      {/* Zoom controls (linksonder) */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          borderRadius: 10,
          padding: "6px 10px",
          boxShadow: "var(--sh-card)",
          zIndex: 10,
        }}
      >
        <button onClick={onZoomOut} style={zoomBtnStyle}>
          −
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-2)",
            minWidth: 36,
            textAlign: "center",
          }}
        >
          {zoomPercent}%
        </span>
        <button onClick={onZoomIn} style={zoomBtnStyle}>
          +
        </button>
        <div style={{ width: 1, height: 16, background: "var(--border-0)" }} />
        <input
          type="range"
          min={40}
          max={150}
          value={zoomPercent}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
          style={{
            width: 90,
            height: 4,
            accentColor: "var(--accent)",
            cursor: "pointer",
          }}
        />
        <div style={{ width: 1, height: 16, background: "var(--border-0)" }} />
        <button
          onClick={onZoomReset}
          style={{
            padding: "4px 8px",
            background: "none",
            border: "1px solid var(--border-1)",
            borderRadius: 6,
            color: "var(--text-2)",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Fit
        </button>
      </div>

      {/* Minimap (rechtsonder) */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 140,
          height: 96,
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "var(--sh-card)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 12,
            width: 60,
            height: 45,
            border: "1px solid rgba(255,107,0,.4)",
            background: "rgba(255,107,0,.06)",
            borderRadius: 3,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 6,
            fontSize: 9,
            color: "var(--text-3)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: ".4px",
          }}
        >
          Minimap
        </div>
      </div>

      {/* Daisy Panel */}
      <DaisyPanel />
    </div>
  );
}
