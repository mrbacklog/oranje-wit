"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Handshake,
  HelpCircle,
  Info,
  Megaphone,
  Users,
} from "lucide-react";
import type { PubliekTeam } from "@/lib/teamindeling/publieke-presentatie";

export type AppPagina =
  | "toelichting"
  | "indeling"
  | "kennismaking"
  | "kalender"
  | "tcoproep"
  | "vragen";

export const MAX_WIDTH = 720;

const TABS: {
  id: AppPagina;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  label: string;
}[] = [
  { id: "toelichting", Icon: Info, label: "Info" },
  { id: "indeling", Icon: Users, label: "Teams" },
  { id: "kennismaking", Icon: Handshake, label: "Kennismaking" },
  { id: "kalender", Icon: Calendar, label: "Kalender" },
  { id: "tcoproep", Icon: Megaphone, label: "Oproep" },
  { id: "vragen", Icon: HelpCircle, label: "Vragen" },
];

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
          height: 6,
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

export function AppFooter({
  pagina,
  onNavigeer,
  teams,
  teamIdx,
  onVorig,
  onVolgend,
  onKiesTeam,
}: {
  pagina: AppPagina;
  onNavigeer: (p: AppPagina) => void;
  teams?: PubliekTeam[];
  teamIdx?: number;
  onVorig?: () => void;
  onVolgend?: () => void;
  onKiesTeam?: (idx: number) => void;
}) {
  const toonNavRow = pagina === "indeling" && teams && teams.length > 0;
  const idx = teamIdx ?? 0;
  const huidigTeam = toonNavRow ? teams![idx] : null;
  const isVorigDisabled = idx === 0;
  const isVolgendDisabled = !teams || idx >= teams.length - 1;
  const { start, end } = toonNavRow ? getVisibleRange(teams!.length, idx) : { start: 0, end: 0 };

  return (
    <div
      style={{
        background: "#080808",
        borderTop: "1px solid rgba(255,102,0,0.25)",
      }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          margin: "0 auto",
          padding: "6px 14px 0",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Nav row — alleen op indeling pagina */}
        {toonNavRow && (
          <>
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

              <div style={{ display: "flex", justifyContent: "center", gap: 0, flex: 1 }}>
                {teams!.slice(start, end).map((t, offset) => {
                  const i = start + offset;
                  return (
                    <Dot
                      key={i}
                      naam={t.naam}
                      active={i === idx}
                      isSelectie={t.soort === "selectie"}
                      onClick={() => onKiesTeam?.(i)}
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
                  {idx + 1} / {teams!.length}
                </span>
              </div>
            )}
          </>
        )}

        {/* Tab rij — altijd zichtbaar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            borderTop: toonNavRow ? "1px solid rgba(255,255,255,0.06)" : "none",
            paddingTop: toonNavRow ? 8 : 6,
            marginTop: toonNavRow ? 6 : 0,
          }}
        >
          {TABS.map(({ id, Icon, label }) => {
            const isActief = pagina === id;
            return (
              <button
                key={id}
                onClick={() => onNavigeer(id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 4px",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  color={isActief ? "#FF6600" : "rgba(255,255,255,0.35)"}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: isActief ? "#FF6600" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
