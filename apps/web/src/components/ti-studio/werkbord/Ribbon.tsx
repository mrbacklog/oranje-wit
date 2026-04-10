// apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
"use client";

interface RibbonProps {
  gebruikerInitialen: string;
  activeRoute: string;
  onNaarIndeling: () => void;
  onNaarKader: () => void;
  onNaarPersonen: () => void;
}

export function Ribbon({
  gebruikerInitialen,
  activeRoute,
  onNaarIndeling,
  onNaarKader,
  onNaarPersonen,
}: RibbonProps) {
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
        {/* Werkbord */}
        <RibbonBtn
          tip="Werkbord"
          active={activeRoute.includes("/indeling")}
          onClick={onNaarIndeling}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </RibbonBtn>

        {/* Kader */}
        <RibbonBtn tip="Kader" active={activeRoute.includes("/kader")} onClick={onNaarKader}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </RibbonBtn>

        {/* Personen */}
        <RibbonBtn
          tip="Personen"
          active={activeRoute.includes("/personen")}
          onClick={onNaarPersonen}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <polyline points="3 6 4 7 6 5" />
            <polyline points="3 12 4 13 6 11" />
            <polyline points="3 18 4 19 6 17" />
          </svg>
        </RibbonBtn>
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
        <RibbonBtn tip="Instellingen" active={false} onClick={() => {}}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </RibbonBtn>
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
      {children}
    </button>
  );
}
