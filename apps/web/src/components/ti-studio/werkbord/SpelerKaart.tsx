// apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx
"use client";
import { useRef, useState } from "react";
import "./tokens.css";
import type { WerkbordSpeler } from "./types";

interface SpelerKaartProps {
  speler: WerkbordSpeler;
  vanTeamId: string | null; // null = komt uit pool
  vanSelectieGroepId?: string | null; // meegeven vanuit team-context voor correcte drag-data
  seizoenEindjaar: number; // bijv. 2026
  asGhost?: boolean; // true = niet-draggable, gebruikt als drag-image bron
  smal?: boolean; // true = compacte variant voor teamkaart-kolommen (~130px)
  onClick?: () => void;
}

function berekenKorfbalLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  seizoenEindjaar: number
): number {
  if (geboortedatum) {
    const peildatum = new Date(seizoenEindjaar, 0, 1); // 1 jan eindjaar
    const geboorte = new Date(geboortedatum);
    return (
      Math.floor(((peildatum.getTime() - geboorte.getTime()) / (365.25 * 24 * 3600 * 1000)) * 100) /
      100
    );
  }
  return seizoenEindjaar - geboortejaar;
}

export function SpelerKaart({
  speler,
  vanTeamId,
  vanSelectieGroepId = null,
  seizoenEindjaar,
  asGhost = false,
  smal = false,
  onClick,
}: SpelerKaartProps) {
  const kaartRef = useRef<HTMLDivElement>(null);
  const [isHeld, setIsHeld] = useState(false);

  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";

  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();

  const leeftijd = berekenKorfbalLeeftijd(
    speler.geboortedatum,
    speler.geboortejaar,
    seizoenEindjaar
  );

  const stopGezet = speler.status === "GAAT_STOPPEN";
  const isAR = speler.status === "ALGEMEEN_RESERVE";

  return (
    <div
      ref={kaartRef}
      draggable={!asGhost && !isAR}
      onPointerDown={
        asGhost || isAR
          ? undefined
          : (e) => {
              document.body.style.cursor = "grabbing";
              e.currentTarget.setPointerCapture(e.pointerId);
              setIsHeld(true);
            }
      }
      onPointerUp={
        asGhost || isAR
          ? undefined
          : () => {
              document.body.style.cursor = "";
              setIsHeld(false);
            }
      }
      onPointerCancel={
        asGhost || isAR
          ? undefined
          : () => {
              document.body.style.cursor = "";
              setIsHeld(false);
            }
      }
      onDragStart={
        asGhost || isAR
          ? undefined
          : (e) => {
              e.stopPropagation();
              e.dataTransfer.setData(
                "speler",
                JSON.stringify({ speler, vanTeamId, vanSelectieGroepId })
              );
              e.dataTransfer.effectAllowed = "move";
              if (kaartRef.current) {
                e.dataTransfer.setDragImage(kaartRef.current, 20, 24);
              }
            }
      }
      onDragEnd={
        asGhost || isAR
          ? undefined
          : () => {
              document.body.style.cursor = "";
              setIsHeld(false);
            }
      }
      onClick={asGhost || isAR ? undefined : onClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        height: smal ? 21 : 40,
        borderLeft: "none",
        borderBottom: "1px solid var(--border-0)",
        opacity: stopGezet ? 0.5 : isHeld ? 0.6 : 1,
        cursor: isAR ? "default" : isHeld ? "grabbing" : "grab",
        background: isHeld ? "rgba(255,107,0,.10)" : "transparent",
        outline: isHeld ? "1.5px solid var(--accent)" : "none",
        transition: "opacity 100ms ease, background 100ms ease",
        padding: smal ? "0 4px 0 6px" : "0 6px 0 6px",
        gap: smal ? 4 : 6,
        flexShrink: 0,
        minWidth: 0,
        position: "relative",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: smal ? 14 : 22,
          height: smal ? 14 : 22,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: smal ? 7 : 9,
          fontWeight: 700,
          background: geslachtBg,
          color: geslachtKleur,
          border: `${smal ? 1 : 1.5}px solid ${geslachtKleur}`,
          boxSizing: "border-box",
        }}
      >
        {initialen}
      </div>

      {/* Naam + meta — smal: 2-regels compact kolom */}
      {smal ? (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {/* Rij 1: naam + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
            <div
              style={{
                flex: 1,
                fontSize: 9,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "var(--text-1)",
                textDecoration: stopGezet ? "line-through" : "none",
                lineHeight: 1.1,
              }}
            >
              {speler.roepnaam} {speler.achternaam.charAt(0)}.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
              {isAR && (
                <span style={{ fontSize: 7, fontWeight: 700, color: "var(--text-3)" }}>AR</span>
              )}
              {speler.isNieuw && (
                <span style={{ fontSize: 7, fontWeight: 700, color: "var(--ok)" }}>N</span>
              )}
              {speler.status === "TWIJFELT" && (
                <span style={{ fontSize: 8, fontWeight: 700, color: "var(--warn)" }}>?</span>
              )}
              {speler.status === "AFGEMELD" && (
                <span style={{ fontSize: 8, color: "var(--err)" }}>⚠</span>
              )}
              {speler.gepind && <span style={{ fontSize: 8, color: "var(--accent)" }}>·</span>}
            </div>
          </div>
          {/* Rij 2: team badge + leeftijd */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
            {speler.huidigTeam && (
              <span
                style={{
                  fontSize: 8,
                  color: "var(--text-3)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {speler.huidigTeam}
              </span>
            )}
            <span
              style={{ fontSize: 8, color: "var(--text-3)", flexShrink: 0, marginLeft: "auto" }}
            >
              {leeftijd.toFixed(1)}
            </span>
          </div>
        </div>
      ) : (
        /* Naam + meta — normaal: kolom layout */
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "var(--text-1)",
              textDecoration: stopGezet ? "line-through" : "none",
              lineHeight: 1.2,
            }}
          >
            {speler.roepnaam} {speler.achternaam}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: 0,
              gap: 4,
              marginTop: 2,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              {speler.huidigTeam && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--text-2)",
                    border: "1px solid var(--border-1)",
                    borderRadius: 3,
                    padding: "0 4px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {speler.huidigTeam}
                </span>
              )}
              {speler.ingedeeldTeamNaam ? (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--accent)",
                    border: "1px solid rgba(255,107,0,.4)",
                    borderRadius: 3,
                    padding: "0 4px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    background: "var(--accent-dim)",
                  }}
                >
                  {speler.ingedeeldTeamNaam}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--text-3)",
                    border: "1px dashed var(--border-1)",
                    borderRadius: 3,
                    padding: "0 4px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  —
                </span>
              )}
            </div>
            <span style={{ fontSize: 9, color: "var(--text-3)", flexShrink: 0 }}>
              {leeftijd.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Badges — normaal variant (rechtsboven) */}
      {!smal && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          {isAR && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--text-2)",
                background: "var(--bg-2)",
                border: "1px solid var(--border-1)",
                borderRadius: 3,
                padding: "1px 4px",
              }}
            >
              AR
            </span>
          )}
          {speler.isNieuw && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--ok)",
                background: "rgba(34,197,94,.12)",
                borderRadius: 3,
                padding: "1px 4px",
              }}
            >
              N
            </span>
          )}
          {speler.status === "TWIJFELT" && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)" }}>?</span>
          )}
          {speler.status === "AFGEMELD" && (
            <span style={{ fontSize: 10, color: "var(--err)" }}>⚠</span>
          )}
          {speler.gepind && <span style={{ fontSize: 10, color: "var(--accent)" }}>📌</span>}
        </div>
      )}
    </div>
  );
}
