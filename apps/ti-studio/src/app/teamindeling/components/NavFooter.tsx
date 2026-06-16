"use client";

import type { PubliekTeam } from "@/lib/teamindeling/publieke-presentatie";

function Dot({
  active,
  isSelectie,
  onClick,
  naam,
}: {
  active: boolean;
  isSelectie: boolean;
  onClick: () => void;
  naam: string;
}) {
  return (
    <button
      title={naam}
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 4px",
        minWidth: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: active ? 22 : 6,
          height: active ? 6 : 6,
          borderRadius: active ? 4 : "50%",
          background: active
            ? isSelectie
              ? "rgba(255,255,255,0.6)"
              : "#FF6600"
            : "rgba(255,255,255,0.2)",
          boxShadow: active && !isSelectie ? "0 0 10px rgba(255,102,0,0.6)" : "none",
          transition: "width 0.25s ease, background 0.25s ease",
          flexShrink: 0,
        }}
      />
    </button>
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
  const huidigTeam = teams[teamIdx];
  const isVorigDisabled = teamIdx === 0;
  const isVolgendDisabled = teamIdx === teams.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "#080808",
        borderTop: "1px solid rgba(255,102,0,0.25)",
        padding: "6px 14px 0",
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Navigatierij */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Vorig */}
        <button
          onClick={onVorig}
          disabled={isVorigDisabled}
          style={{
            border: isVorigDisabled
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid rgba(255,102,0,0.4)",
            background: isVorigDisabled ? "transparent" : "rgba(255,102,0,0.12)",
            color: isVorigDisabled ? "rgba(255,255,255,0.12)" : "#FF6600",
            padding: "10px 18px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 800,
            cursor: isVorigDisabled ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Windowed dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, flex: 1 }}>
          {teams.slice(start, end).map((t, offset) => {
            const i = start + offset;
            return (
              <Dot
                key={i}
                naam={t.naam}
                active={i === teamIdx}
                isSelectie={t.soort === "selectie"}
                onClick={() => onKiesTeam(i)}
              />
            );
          })}
        </div>

        {/* Volgend */}
        <button
          onClick={onVolgend}
          disabled={isVolgendDisabled}
          style={{
            border: isVolgendDisabled
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid rgba(255,102,0,0.4)",
            background: isVolgendDisabled ? "transparent" : "rgba(255,102,0,0.12)",
            color: isVolgendDisabled ? "rgba(255,255,255,0.12)" : "#FF6600",
            padding: "10px 18px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 800,
            cursor: isVolgendDisabled ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>

      {/* Context-balk */}
      {huidigTeam && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            marginTop: 4,
            paddingBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#FF6600",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {huidigTeam.naam}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {teamIdx + 1} / {teams.length}
          </span>
        </div>
      )}
    </div>
  );
}
