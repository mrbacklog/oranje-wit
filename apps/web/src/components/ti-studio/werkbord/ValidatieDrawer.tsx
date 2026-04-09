// apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import type { WerkbordTeam, WerkbordValidatieItem } from "./types";

interface ValidatieDrawerProps {
  open: boolean;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  onClose: () => void;
}

export function ValidatieDrawer({ open, teams, validatie, onClose }: ValidatieDrawerProps) {
  const [actieveTab, setActieveTab] = useState(teams[0]?.id ?? "");

  const teamValidatie = validatie.filter((v) => v.teamId === actieveTab);
  const actieveTeam = teams.find((t) => t.id === actieveTab);

  const ICOON = { ok: "✓", warn: "⚠", err: "✕" };
  const VAL_KLEUR = {
    ok: {
      bg: "rgba(34,197,94,.06)",
      border: "rgba(34,197,94,.1)",
      icon: "var(--ok)",
    },
    warn: {
      bg: "rgba(234,179,8,.06)",
      border: "rgba(234,179,8,.1)",
      icon: "var(--warn)",
    },
    err: {
      bg: "rgba(239,68,68,.06)",
      border: "rgba(239,68,68,.1)",
      icon: "var(--err)",
    },
  };

  return (
    <aside
      style={{
        width: open ? "var(--val-w)" : 0,
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease, opacity 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* Header met sluit-knop */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {/* Team tabs */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            flex: 1,
          }}
        >
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setActieveTab(team.id)}
              style={{
                padding: "9px 10px 8px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: "none",
                color: actieveTab === team.id ? "var(--text-1)" : "var(--text-3)",
                borderBottom: `2px solid ${actieveTab === team.id ? "var(--accent)" : "transparent"}`,
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {team.naam}
              {team.validatieStatus !== "ok" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: team.validatieStatus === "err" ? "var(--err)" : "var(--warn)",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          title="Sluiten"
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-3)",
            flexShrink: 0,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {/* Stats grid */}
        {actieveTeam && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <StatCard label="Dames" value={actieveTeam.dames.length.toString()} />
            <StatCard label="Heren" value={actieveTeam.heren.length.toString()} />
            <StatCard
              label="Gem. leeftijd"
              value={
                actieveTeam.gemiddeldeLeeftijd
                  ? `${actieveTeam.gemiddeldeLeeftijd.toFixed(1)}j`
                  : "—"
              }
            />
            <StatCard
              label="USS score"
              value={actieveTeam.ussScore ? actieveTeam.ussScore.toFixed(2) : "—"}
            />
          </div>
        )}

        {/* Validatie items */}
        {teamValidatie.length === 0 ? (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(34,197,94,.06)",
              border: "1px solid rgba(34,197,94,.1)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>
              ✓ Voldoet aan alle regels
            </div>
          </div>
        ) : (
          teamValidatie.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                marginBottom: 4,
                background: VAL_KLEUR[item.type].bg,
                border: `1px solid ${VAL_KLEUR[item.type].border}`,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  flexShrink: 0,
                  color: VAL_KLEUR[item.type].icon,
                  marginTop: 1,
                }}
              >
                {ICOON[item.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{item.regel}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    lineHeight: 1.4,
                  }}
                >
                  {item.beschrijving}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border-0)",
        borderRadius: 8,
        padding: "8px 10px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: ".4px",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
