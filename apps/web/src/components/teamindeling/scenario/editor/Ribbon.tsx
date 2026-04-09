"use client";

interface RibbonProps {
  activeTab?: string;
  gebruikerInitialen?: string;
  onOpenPool: () => void;
  onOpenValidatie: () => void;
  onOpenWerkbord: () => void;
  onOpenWhatIf: () => void;
  onOpenVersies: () => void;
}

interface RibbonButtonProps {
  label: string;
  tip: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function RibbonButton({ label: _label, tip, isActive, onClick, children }: RibbonButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tip}
      aria-label={tip}
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "none",
        fontFamily: "inherit",
        flexShrink: 0,
        position: "relative",
        background: isActive ? "rgba(255,107,0,0.12)" : "none",
        color: isActive ? "var(--ow-oranje-500)" : "var(--text-muted)",
        transition: "background 120ms, color 120ms",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-raised)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
        }
      }}
    >
      {/* Active indicator — 3px oranje lijn links */}
      {isActive && (
        <span
          style={{
            position: "absolute",
            left: -1,
            top: 7,
            bottom: 7,
            width: 3,
            background: "var(--ow-oranje-500)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      {children}
    </button>
  );
}

export default function Ribbon({
  activeTab,
  gebruikerInitialen = "TC",
  onOpenPool,
  onOpenValidatie,
  onOpenWerkbord,
  onOpenWhatIf,
  onOpenVersies,
}: RibbonProps) {
  return (
    <div
      style={{
        width: 48,
        height: "100%",
        background: "var(--surface-card)",
        borderRight: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 0 8px",
        gap: 2,
        zIndex: 40,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 30,
          height: 30,
          background: "linear-gradient(135deg, var(--ow-oranje-500), #FF8533)",
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 900,
          color: "#fff",
          marginBottom: 12,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(255,107,0,0.35)",
          letterSpacing: "-0.5px",
          userSelect: "none",
        }}
      >
        OW
      </div>

      {/* Knoppen groep */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {/* Spelerspool */}
        <RibbonButton
          label="Pool"
          tip="Spelerspool"
          isActive={activeTab === "pool"}
          onClick={onOpenPool}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </RibbonButton>

        {/* Validatie */}
        <RibbonButton
          label="Validatie"
          tip="Validatie"
          isActive={activeTab === "validatie"}
          onClick={onOpenValidatie}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </RibbonButton>
      </div>

      {/* Scheidingslijn */}
      <div
        style={{
          width: 22,
          height: 1,
          background: "var(--border-default)",
          margin: "6px 0",
          flexShrink: 0,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {/* Werkbord */}
        <RibbonButton
          label="Werkbord"
          tip="Werkbord"
          isActive={activeTab === "werkbord"}
          onClick={onOpenWerkbord}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </RibbonButton>

        {/* What-If */}
        <RibbonButton
          label="What-If"
          tip="What-If scenario"
          isActive={activeTab === "whatif"}
          onClick={onOpenWhatIf}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </RibbonButton>

        {/* Versies */}
        <RibbonButton
          label="Versies"
          tip="Versiegeschiedenis"
          isActive={activeTab === "versies"}
          onClick={onOpenVersies}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </RibbonButton>
      </div>

      {/* Footer: gebruiker avatar */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          title="Mijn profiel"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#2a1a0a",
            border: "2px solid rgba(255,107,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--ow-oranje-500)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {gebruikerInitialen.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
