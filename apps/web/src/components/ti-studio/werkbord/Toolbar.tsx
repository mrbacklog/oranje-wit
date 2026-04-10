// apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
"use client";
import "./tokens.css";

interface ToolbarProps {
  naam: string;
  versieNaam: string | null;
  versieNummer: number;
  status: "concept" | "definitief";
  totalSpelers: number;
  ingeplandSpelers: number;
  panelLinks: "pool" | null;
  panelRechts: "teams" | "versies" | null;
  onTogglePanelLinks: (panel: "pool") => void;
  onTogglePanelRechts: (panel: "teams" | "versies") => void;
  onNieuwTeam: () => void;
  onTerug: () => void;
}

export function Toolbar({
  naam,
  versieNaam,
  versieNummer,
  status,
  totalSpelers,
  ingeplandSpelers,
  panelLinks,
  panelRechts,
  onTogglePanelLinks,
  onTogglePanelRechts,
  onNieuwTeam,
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

      {/* Panel-triggers */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <PanelBtn
          tip="Spelerspool"
          active={panelLinks === "pool"}
          onClick={() => onTogglePanelLinks("pool")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </PanelBtn>
        <PanelBtn
          tip="Teams"
          active={panelRechts === "teams"}
          onClick={() => onTogglePanelRechts("teams")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </PanelBtn>
        <PanelBtn
          tip="Versies & What-If"
          active={panelRechts === "versies"}
          onClick={() => onTogglePanelRechts("versies")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
        </PanelBtn>
      </div>

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

function PanelBtn({
  tip,
  active,
  onClick,
  children,
}: {
  tip: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={tip}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: active ? "var(--accent-dim)" : "var(--bg-2)",
        border: active ? "1px solid rgba(255,107,0,.3)" : "1px solid var(--border-1)",
        color: active ? "var(--accent)" : "var(--text-3)",
        transition: "background 120ms, color 120ms, border-color 120ms",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
