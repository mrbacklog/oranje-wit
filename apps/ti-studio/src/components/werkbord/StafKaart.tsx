// apps/web/src/components/ti-studio/werkbord/StafKaart.tsx
"use client";

import { useCallback } from "react";
import type { WerkbordStaf } from "./types";
import { useHoverStafKaart } from "./HoverStafKaart";
import { toonRol } from "@/components/staf/staf-koppel-types";

const KLEUR_DOT: Record<string, string> = {
  blauw: "#6b7cf6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

interface StafKaartProps {
  staf: WerkbordStaf;
  /** Toont een [+]-knop in de kaart om aan een team/selectie te koppelen. */
  onPlusClick?: (rect: DOMRect) => void;
  plusActief?: boolean;
}

export function StafKaart({ staf, onPlusClick, plusActief = false }: StafKaartProps) {
  const { registerHover, cancelHover, updatePos } = useHoverStafKaart();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      registerHover(staf, e.clientX, e.clientY);
    },
    [staf, registerHover]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updatePos(e.clientX, e.clientY);
    },
    [updatePos]
  );

  const initialen = staf.naam
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={cancelHover}
      style={{
        position: "relative",
        background: "var(--bg-2)",
        border: "1px solid var(--border-0)",
        borderRadius: 8,
        padding: onPlusClick ? "10px 38px 10px 12px" : "10px 12px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        cursor: "default",
      }}
    >
      {onPlusClick && (
        <button
          type="button"
          title="Koppel aan team of selectie"
          aria-label={`Koppel ${staf.naam} aan team of selectie`}
          onMouseEnter={cancelHover}
          onClick={(e) => {
            e.stopPropagation();
            onPlusClick(e.currentTarget.getBoundingClientRect());
          }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 2,
            width: 24,
            height: 24,
            borderRadius: 6,
            border: `1px solid ${plusActief ? "var(--accent)" : "var(--border-1)"}`,
            background: plusActief ? "var(--accent-dim)" : "var(--bg-1)",
            color: plusActief ? "var(--accent)" : "var(--text-3)",
            cursor: "pointer",
            fontSize: 15,
            lineHeight: 1,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      )}

      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255,107,0,.15)",
          border: "1.5px solid rgba(255,107,0,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--accent)",
          flexShrink: 0,
        }}
      >
        {initialen}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Naam */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {staf.naam}
        </div>

        {/* Globale rollen */}
        {staf.rollen.length > 0 && (
          <div
            style={{
              fontSize: 10,
              color: "var(--text-3)",
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {staf.rollen.join(" · ")}
          </div>
        )}

        {/* Teams */}
        {staf.teams.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
            {staf.teams.map((t) => (
              <div key={t.teamId} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: KLEUR_DOT[t.kleur] ?? "#94a3b8",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-2)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                  }}
                >
                  {t.teamNaam}
                </span>
                {toonRol({ rol: t.rol, rolLabel: t.rolLabel }) && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-3)",
                      background: "var(--bg-1)",
                      border: "1px solid var(--border-0)",
                      borderRadius: 4,
                      padding: "1px 5px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {toonRol({ rol: t.rol, rolLabel: t.rolLabel })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {staf.teams.length === 0 && (
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, fontStyle: "italic" }}>
            Niet ingedeeld
          </div>
        )}
      </div>
    </div>
  );
}
