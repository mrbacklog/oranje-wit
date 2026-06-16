"use client";

import { ChevronLeft, ChevronRight, FileText, Megaphone, HelpCircle } from "lucide-react";
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

const iconBtnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "rgba(255,255,255,0.4)",
  padding: "4px 12px",
};

const iconLabelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "rgba(255,255,255,0.35)",
};

export function NavFooter({
  teams,
  teamIdx,
  onVorig,
  onVolgend,
  onKiesTeam,
  onToelichting,
  onTcOproep,
  onVragen,
}: {
  teams: PubliekTeam[];
  teamIdx: number;
  onVorig: () => void;
  onVolgend: () => void;
  onKiesTeam: (idx: number) => void;
  onToelichting: () => void;
  onTcOproep: () => void;
  onVragen: () => void;
}) {
  const { start, end } = getVisibleRange(teams.length, teamIdx);
  const huidigTeam = teams[teamIdx];
  const isVorigDisabled = teamIdx === 0;
  const isVolgendDisabled = teamIdx === teams.length - 1;

  const baseBtn: React.CSSProperties = {
    borderRadius: 6,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const activeBtn: React.CSSProperties = {
    border: "1px solid rgba(255,102,0,0.4)",
    background: "rgba(255,102,0,0.12)",
    color: "#FF6600",
    cursor: "pointer",
  };
  const disabledBtn: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.05)",
    background: "transparent",
    color: "rgba(255,255,255,0.12)",
    cursor: "default",
  };

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
      {/* Bovenste rij — navigatie */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <button
          onClick={onVorig}
          disabled={isVorigDisabled}
          style={{ ...baseBtn, ...(isVorigDisabled ? disabledBtn : activeBtn) }}
        >
          <ChevronLeft size={18} />
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

        <button
          onClick={onVolgend}
          disabled={isVolgendDisabled}
          style={{ ...baseBtn, ...(isVolgendDisabled ? disabledBtn : activeBtn) }}
        >
          <ChevronRight size={18} />
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
            paddingBottom: 4,
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

      {/* Onderste rij — actieknoppen */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 8,
          marginTop: 6,
        }}
      >
        <button onClick={onToelichting} style={iconBtnStyle}>
          <FileText size={16} />
          <span style={iconLabelStyle}>Toelichting</span>
        </button>
        <button onClick={onTcOproep} style={iconBtnStyle}>
          <Megaphone size={16} />
          <span style={iconLabelStyle}>TC Oproep</span>
        </button>
        <button onClick={onVragen} style={iconBtnStyle}>
          <HelpCircle size={16} />
          <span style={iconLabelStyle}>Vragen</span>
        </button>
      </div>
    </div>
  );
}
