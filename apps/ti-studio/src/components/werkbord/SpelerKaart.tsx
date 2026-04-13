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
    const peildatum = new Date(seizoenEindjaar, 11, 31); // 31 dec eindjaar
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
  const [isDragging, setIsDragging] = useState(false);
  const [isLanding, setIsLanding] = useState(false);

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
  const isStopt =
    speler.status === "GAAT_STOPPEN" || speler.status === "GESTOPT" || speler.status === "AFGEMELD";

  const waasAchtergrond = speler.isNieuw
    ? "rgba(34,197,94,.07)"
    : speler.status === "TWIJFELT"
      ? "rgba(249,115,22,.08)"
      : speler.status === "GEBLESSEERD"
        ? "rgba(249,115,22,.10)"
        : isStopt
          ? "rgba(239,68,68,.07)"
          : "transparent";

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
        asGhost
          ? undefined
          : (e) => {
              setIsDragging(true);
              setIsLanding(false);
              e.stopPropagation();
              e.dataTransfer.setData(
                "speler",
                JSON.stringify({ speler, vanTeamId, vanSelectieGroepId })
              );
              e.dataTransfer.effectAllowed = "move";
              if (kaartRef.current) {
                kaartRef.current.style.background = "var(--bg-2)";
                kaartRef.current.style.border = "1.5px solid rgba(255,107,0,.6)";
                kaartRef.current.style.borderRadius = "var(--card-radius)";
                kaartRef.current.style.boxShadow =
                  "0 10px 28px rgba(0,0,0,.65), 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.2)";
                kaartRef.current.style.padding = "4px";
                e.dataTransfer.setDragImage(kaartRef.current, 24, 28);
                requestAnimationFrame(() => {
                  if (kaartRef.current) {
                    kaartRef.current.style.background = "";
                    kaartRef.current.style.border = "";
                    kaartRef.current.style.borderRadius = "";
                    kaartRef.current.style.boxShadow = "";
                    kaartRef.current.style.padding = "";
                  }
                });
              }
            }
      }
      onDragEnd={
        asGhost
          ? undefined
          : () => {
              document.body.style.cursor = "";
              setIsHeld(false);
              setIsDragging(false);
              setIsLanding(true);
              setTimeout(() => setIsLanding(false), 650);
            }
      }
      onClick={asGhost || isAR ? undefined : onClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        height: smal ? 21 : 40,
        border: isDragging
          ? "1px solid rgba(255,107,0,.5)"
          : isHeld
            ? "1px solid var(--accent)"
            : "1px solid rgba(255,255,255,.07)",
        borderRadius: 4,
        marginBottom: smal ? 1 : 2,
        opacity: stopGezet ? 0.5 : isHeld || isDragging ? 0.6 : 1,
        cursor: isHeld || isDragging ? "grabbing" : "grab",
        background: isDragging || isHeld ? "rgba(255,107,0,.10)" : waasAchtergrond,
        outline: "none",
        boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
        transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
        transition: isDragging
          ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease"
          : "opacity 100ms ease, background 100ms ease",
        animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
        padding: smal ? "0 4px 0 6px" : "0 6px 0 6px",
        gap: smal ? 4 : 6,
        flexShrink: 0,
        minWidth: 0,
        position: "relative",
        zIndex: isDragging ? 50 : undefined,
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
              {speler.status === "GEBLESSEERD" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 10,
                    height: 10,
                    border: "1.5px solid rgba(255,255,255,0.8)",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                    <rect x="2.5" y="0" width="1" height="6" fill="#ff2d2d" />
                    <rect x="0" y="2.5" width="6" height="1" fill="#ff2d2d" />
                  </svg>
                </span>
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
              {vanTeamId === null &&
                (speler.ingedeeldTeamNaam ? (
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
                ))}
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
      <style>{`
        @keyframes dropLandSpeler {
          from {
            transform: scale(1.04) translateY(-4px);
            box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,107,0,.45);
            outline: 1.5px solid rgba(255,107,0,.5);
          }
          to {
            transform: scale(1) translateY(0);
            box-shadow: none;
            outline: none;
          }
        }
      `}</style>
    </div>
  );
}
