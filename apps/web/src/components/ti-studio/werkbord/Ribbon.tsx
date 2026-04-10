// apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
"use client";
import "./tokens.css";

type ActivePanel = "pool" | "teams" | "werkbord" | "versies" | "kader" | null;

interface RibbonProps {
  activePanel: ActivePanel;
  onTogglePanel: (panel: "pool" | "teams" | "werkbord" | "versies" | "kader") => void;
  gebruikerInitialen: string;
}

export function Ribbon({ activePanel, onTogglePanel, gebruikerInitialen }: RibbonProps) {
  return (
    <nav
      style={{
        gridRow: "1 / 3",
        gridColumn: "1",
        width: "var(--ribbon)",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 0 8px",
        gap: "2px",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 30,
          height: 30,
          background: "linear-gradient(135deg, #FF6B00, #FF8533)",
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 900,
          color: "#fff",
          marginBottom: 12,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(255,107,0,.35)",
          letterSpacing: "-0.5px",
        }}
      >
        OW
      </div>

      {/* Hoofd-groep */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <RibbonBtn
          icon="pool"
          tip="Spelerspool"
          active={activePanel === "pool"}
          onClick={() => onTogglePanel("pool")}
        />
        <RibbonBtn
          icon="werkbord"
          tip="Werkbord"
          active={activePanel === "werkbord"}
          onClick={() => onTogglePanel("werkbord")}
        />
        <RibbonBtn
          icon="teams"
          tip="Teams"
          active={activePanel === "teams"}
          onClick={() => onTogglePanel("teams")}
        />
        <RibbonBtn
          icon="kader"
          tip="Kader"
          active={activePanel === "kader"}
          onClick={() => onTogglePanel("kader")}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ width: 22, height: 1, background: "var(--border-0)", margin: "6px 0" }} />
        <RibbonBtn icon="instellingen" tip="Instellingen" active={false} onClick={() => {}} />
        <div
          title={gebruikerInitialen}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#2a1a0a",
            border: "2px solid rgba(255,107,0,.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          {gebruikerInitialen}
        </div>
      </div>
    </nav>
  );
}

function RibbonBtn({
  icon,
  tip,
  active,
  onClick,
  badge = false,
}: {
  icon: string;
  tip: string;
  active: boolean;
  onClick: () => void;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={tip}
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: active ? "var(--accent-dim)" : "none",
        border: "none",
        color: active ? "var(--accent)" : "var(--text-3)",
        position: "relative",
        flexShrink: 0,
        transition: "background 120ms, color 120ms",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: -1,
            top: 7,
            bottom: 7,
            width: 3,
            background: "var(--accent)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      <RibbonIcon name={icon} />
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--err)",
            border: "2px solid var(--bg-1)",
          }}
        />
      )}
    </button>
  );
}

function RibbonIcon({ name }: { name: string }) {
  const props = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "pool":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "teams":
      return (
        <svg {...props}>
          <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case "kader":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case "werkbord":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "versies":
      return (
        <svg {...props}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "instellingen":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    default:
      return null;
  }
}
