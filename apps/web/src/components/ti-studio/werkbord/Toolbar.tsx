// apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
"use client";
import "./tokens.css";

interface ToolbarProps {
  naam: string;
  versieNaam: string | null;
  versieNummer: number;
  isWhatIf?: boolean;
  totalSpelers: number;
  ingeplandSpelers: number;
  arCount?: number;
  panelLinks: "pool" | "staf" | null;
  panelRechts: "teams" | "versies" | null;
  onTogglePanelLinks: (panel: "pool" | "staf") => void;
  onTogglePanelRechts: (panel: "teams" | "versies") => void;
  onVersiesOpen: () => void;
}

export function Toolbar({
  naam,
  versieNaam,
  versieNummer,
  isWhatIf = false,
  totalSpelers,
  ingeplandSpelers,
  arCount = 0,
  panelLinks,
  panelRechts,
  onTogglePanelLinks,
  onTogglePanelRechts,
  onVersiesOpen,
}: ToolbarProps) {
  const pct = totalSpelers > 0 ? Math.round((ingeplandSpelers / totalSpelers) * 100) : 0;
  const circumference = 75.4;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <header
      style={{
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

      {/* Links: naam + versie-badge — klikbaar opent versies-drawer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          width: 260,
          cursor: "pointer",
        }}
        onClick={onVersiesOpen}
        title="Versies & What-If openen"
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {naam}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            v{versieNummer}
            {versieNaam ? ` — ${versieNaam}` : ""}
          </div>
        </div>

        {/* Versie-type badge */}
        {isWhatIf ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              background: "rgba(139,92,246,.12)",
              color: "var(--purple, #8b5cf6)",
              border: "1px solid rgba(139,92,246,.2)",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="7" height="7" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="4" fill="currentColor" />
            </svg>
            What-if
          </div>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              background: "rgba(255,107,0,.1)",
              color: "var(--accent)",
              border: "1px solid rgba(255,107,0,.2)",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="7" height="7" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="4" fill="currentColor" />
            </svg>
            Werkversie
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Progress counter — flat */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
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
          <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-1)", zIndex: 1 }}>
            {pct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-3)" }}>Ingedeeld</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{ingeplandSpelers}</span>
            <span style={{ color: "var(--text-3)", fontSize: 10 }}> / {totalSpelers}</span>
            {arCount > 0 && (
              <span style={{ color: "var(--text-3)", fontSize: 9, marginLeft: 4 }}>
                (+{arCount} AR)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Panel-triggers — gecentreerd */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "var(--text-3)",
            opacity: 0.5,
            userSelect: "none",
            paddingRight: 2,
          }}
        >
          ‹
        </span>

        <div style={{ display: "flex", gap: 2, pointerEvents: "auto" }}>
          <PanelBtn
            tip="Spelerspool (links)"
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
            tip="Stafleden (links)"
            active={panelLinks === "staf"}
            onClick={() => onTogglePanelLinks("staf")}
          >
            {/* Persoon met pet/cap */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="9" r="3" />
              {/* Cap brim */}
              <path d="M7.5 6.5h9" />
              {/* Cap crown */}
              <path d="M9.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" />
            </svg>
          </PanelBtn>
        </div>

        <div
          style={{
            width: 1,
            height: 14,
            background: "var(--border-1)",
            margin: "0 4px",
            flexShrink: 0,
          }}
        />

        <div style={{ display: "flex", gap: 2, pointerEvents: "auto" }}>
          <PanelBtn
            tip="Teams (rechts)"
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
            tip="Versies & What-If (rechts)"
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

        <span
          style={{
            fontSize: 9,
            color: "var(--text-3)",
            opacity: 0.5,
            userSelect: "none",
            paddingLeft: 2,
          }}
        >
          ›
        </span>
      </div>
    </header>
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
