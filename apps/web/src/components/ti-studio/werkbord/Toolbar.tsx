// apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
"use client";
import "./tokens.css";
import type { ZoomLevel } from "./types";

interface ToolbarProps {
  naam: string;
  versieNaam: string | null;
  versieNummer: number;
  status: "concept" | "definitief";
  totalSpelers: number;
  ingeplandSpelers: number;
  zoomLevel: ZoomLevel;
  zoomPercent: number;
  showScores: boolean;
  onToggleScores: () => void;
  onNieuwTeam: () => void;
  onPreview: () => void;
  onTerug: () => void;
}

export function Toolbar({
  naam,
  versieNaam,
  versieNummer,
  status,
  totalSpelers,
  ingeplandSpelers,
  zoomLevel,
  zoomPercent,
  showScores,
  onToggleScores,
  onNieuwTeam,
  onPreview,
  onTerug,
}: ToolbarProps) {
  const pct = totalSpelers > 0 ? Math.round((ingeplandSpelers / totalSpelers) * 100) : 0;
  const circumference = 75.4;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <header
      style={{
        gridColumn: "2",
        gridRow: "1",
        height: "var(--toolbar)",
        background: "var(--bg-1)",
        borderBottom: "1px solid var(--border-0)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 14px",
        position: "relative",
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Blauwe gradient-lijn onderaan */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, var(--info) 0%, transparent 40%)",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Terug knop */}
      <button
        onClick={onTerug}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: "none",
          color: "var(--text-3)",
          fontSize: 12,
          fontFamily: "inherit",
          cursor: "pointer",
          padding: "4px 6px",
          borderRadius: 6,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        TI Studio
      </button>

      <div style={{ width: 1, height: 20, background: "var(--border-0)", flexShrink: 0 }} />

      {/* Scenario naam */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{naam}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          v{versieNummer}
          {versieNaam ? ` — ${versieNaam}` : ""}
        </div>
      </div>

      {/* Status badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: status === "concept" ? "rgba(234,179,8,.12)" : "rgba(34,197,94,.12)",
          color: status === "concept" ? "var(--warn)" : "var(--ok)",
          border: `1px solid ${status === "concept" ? "rgba(234,179,8,.2)" : "rgba(34,197,94,.2)"}`,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="4" fill="currentColor" />
        </svg>
        {status === "concept" ? "Concept" : "Definitief"}
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border-0)", flexShrink: 0 }} />

      <div style={{ flex: 1 }} />

      {/* Progress counter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          borderRadius: 9,
          fontSize: 12,
        }}
      >
        {/* Progress ring */}
        <div
          style={{
            position: "relative",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "rotate(-90deg)",
            }}
          >
            <circle cx="16" cy="16" r="12" fill="none" stroke="var(--border-1)" strokeWidth="2.5" />
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-1)",
              zIndex: 1,
            }}
          >
            {pct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Ingedeeld</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{ingeplandSpelers}</span>
            <span style={{ color: "var(--text-3)", fontSize: 11 }}> / {totalSpelers}</span>
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border-0)", flexShrink: 0 }} />

      {/* Zoom level badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 600,
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          color: "var(--text-2)",
          whiteSpace: "nowrap",
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
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {zoomPercent}% · {zoomLevel.charAt(0).toUpperCase() + zoomLevel.slice(1)}
      </div>

      {/* Werkversie context */}
      <span
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          whiteSpace: "nowrap",
          padding: "4px 8px",
        }}
      >
        ⭐ v{versieNummer} — werkversie
      </span>

      {/* Score toggle */}
      <TbBtn onClick={onToggleScores} variant={showScores ? "sec-active" : "sec"}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Score
      </TbBtn>

      {/* Nieuw team */}
      <TbBtn onClick={onNieuwTeam} variant="sec">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Team
      </TbBtn>

      {/* Preview */}
      <TbBtn onClick={onPreview} variant="pri">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Preview
      </TbBtn>
    </header>
  );
}

function TbBtn({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "pri" | "sec" | "sec-active" | "ghost";
  children: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    pri: { background: "var(--accent)", color: "#fff", border: "none" },
    sec: {
      background: "var(--bg-2)",
      color: "var(--text-1)",
      border: "1px solid var(--border-1)",
    },
    "sec-active": {
      background: "var(--accent-dim)",
      color: "var(--accent)",
      border: "1px solid rgba(255,107,0,.3)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-2)",
      border: "1px solid var(--border-0)",
    },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 7,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}
