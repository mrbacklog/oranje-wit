"use client";

import type { PubliekTeam } from "@/lib/teamindeling/publieke-presentatie";

function Dot({ active, isSelectie }: { active: boolean; isSelectie: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: active ? 18 : 5,
        height: 5,
        borderRadius: active ? 3 : "50%",
        background: active
          ? isSelectie
            ? "rgba(255,255,255,0.6)"
            : "#FF6600"
          : "rgba(255,255,255,0.12)",
        boxShadow: active && !isSelectie ? "0 0 6px rgba(255,102,0,0.4)" : "none",
        transition: "width 0.25s ease, background 0.25s ease",
        flexShrink: 0,
      }}
    />
  );
}

const activeBtn: React.CSSProperties = {
  background: "#FF6600",
  color: "#fff",
  boxShadow: "0 2px 12px rgba(255,102,0,0.3)",
};
const disabledBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.2)",
  cursor: "default",
  boxShadow: "none",
};
const baseBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 6,
  padding: "9px 16px",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export function NavFooter({
  teams,
  teamIdx,
  onVorig,
  onVolgend,
  onKiesTeam,
}: {
  teams: PubliekTeam[];
  teamIdx: number;
  onVorig: () => void;
  onVolgend: () => void;
  onKiesTeam: (idx: number) => void;
}) {
  const huidig = teams[teamIdx];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(8,8,8,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "11px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      {/* Vorig */}
      <button
        onClick={onVorig}
        disabled={teamIdx === 0}
        style={{ ...baseBtn, ...(teamIdx === 0 ? disabledBtn : activeBtn) }}
      >
        ← Vorig
      </button>

      {/* Midden */}
      <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.65)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 5,
          }}
        >
          {huidig?.naam ?? ""}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
          {teams.map((t, i) => (
            <button
              key={i}
              title={t.naam}
              onClick={() => onKiesTeam(i)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            >
              <Dot active={i === teamIdx} isSelectie={t.soort === "selectie"} />
            </button>
          ))}
        </div>
      </div>

      {/* Volgend */}
      <button
        onClick={onVolgend}
        disabled={teamIdx === teams.length - 1}
        style={{ ...baseBtn, ...(teamIdx === teams.length - 1 ? disabledBtn : activeBtn) }}
      >
        Volgend →
      </button>
    </div>
  );
}
