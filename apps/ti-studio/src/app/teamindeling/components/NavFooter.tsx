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

function getVisibleRange(
  total: number,
  active: number,
  max: number = 7
): { start: number; end: number } {
  if (total <= max) return { start: 0, end: total };
  const half = Math.floor(max / 2);
  let start = Math.max(0, active - half);
  let end = start + max;
  if (end > total) {
    end = total;
    start = total - max;
  }
  return { start, end };
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
  borderRadius: 4,
  padding: "8px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
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
  const { start, end } = getVisibleRange(teams.length, teamIdx);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(8,8,8,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      {/* Vorig */}
      <button
        onClick={onVorig}
        disabled={teamIdx === 0}
        style={{ ...baseBtn, ...(teamIdx === 0 ? disabledBtn : activeBtn) }}
      >
        ←
      </button>

      {/* Windowed dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, flex: 1 }}>
        {teams.slice(start, end).map((t, offset) => {
          const i = start + offset;
          return (
            <button
              key={i}
              title={t.naam}
              onClick={() => onKiesTeam(i)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            >
              <Dot active={i === teamIdx} isSelectie={t.soort === "selectie"} />
            </button>
          );
        })}
      </div>

      {/* Volgend */}
      <button
        onClick={onVolgend}
        disabled={teamIdx === teams.length - 1}
        style={{ ...baseBtn, ...(teamIdx === teams.length - 1 ? disabledBtn : activeBtn) }}
      >
        →
      </button>
    </div>
  );
}
