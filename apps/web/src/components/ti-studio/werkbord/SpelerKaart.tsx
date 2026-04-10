// apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx
"use client";
import { useRef, useState } from "react";
import "./tokens.css";
import type { WerkbordSpeler } from "./types";

interface SpelerKaartProps {
  speler: WerkbordSpeler;
  vanTeamId: string | null; // null = komt uit pool
  seizoenEindjaar: number; // bijv. 2026
  asGhost?: boolean; // true = niet-draggable, gebruikt als drag-image bron
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
  seizoenEindjaar,
  asGhost = false,
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

  return (
    <div
      ref={kaartRef}
      draggable={!asGhost}
      onPointerDown={
        asGhost
          ? undefined
          : (e) => {
              document.body.style.cursor = "grabbing";
              e.currentTarget.setPointerCapture(e.pointerId);
              setIsHeld(true);
            }
      }
      onPointerUp={
        asGhost
          ? undefined
          : () => {
              document.body.style.cursor = "";
              setIsHeld(false);
            }
      }
      onPointerCancel={
        asGhost
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
              e.stopPropagation();
              e.dataTransfer.setData("speler", JSON.stringify({ speler, vanTeamId }));
              e.dataTransfer.effectAllowed = "move";
              if (kaartRef.current) {
                e.dataTransfer.setDragImage(kaartRef.current, 20, 24);
              }
            }
      }
      onDragEnd={
        asGhost
          ? undefined
          : () => {
              document.body.style.cursor = "";
              setIsHeld(false);
            }
      }
      style={{
        display: "flex",
        flexDirection: "column",
        height: 48,
        borderLeft: `2px solid ${geslachtKleur}`,
        opacity: stopGezet ? 0.5 : isHeld ? 0.6 : 1,
        cursor: isHeld ? "grabbing" : "grab",
        background: isHeld ? "rgba(255,107,0,.10)" : "transparent",
        outline: isHeld ? "1.5px solid var(--accent)" : "none",
        transition: "opacity 100ms ease, background 100ms ease",
        padding: "0 8px 0 6px",
        flexShrink: 0,
      }}
    >
      {/* Regel 1: avatar + naam + badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            background: geslachtBg,
            color: geslachtKleur,
            border: `2px solid ${geslachtKleur}`,
            boxSizing: "border-box",
          }}
        >
          {initialen}
        </div>

        {/* Naam */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--text-1)",
            textDecoration: stopGezet ? "line-through" : "none",
          }}
        >
          {speler.roepnaam} {speler.achternaam}
        </div>

        {/* Badges rechts */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
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
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--warn)",
              }}
            >
              ?
            </span>
          )}
          {speler.status === "AFGEMELD" && (
            <span style={{ fontSize: 10, color: "var(--err)" }}>⚠</span>
          )}
          {speler.gepind && <span style={{ fontSize: 10, color: "var(--accent)" }}>📌</span>}
        </div>
      </div>

      {/* Regel 2: chips links + leeftijd rechts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
          minWidth: 0,
          gap: 4,
          paddingLeft: 34, // inspringen zodat chips uitgelijnd zijn na avatar
        }}
      >
        {/* Chips links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* Huidig team chip — neutraal grijs */}
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

          {/* Ingedeeld team chip — oranje accent of grijs gestippeld */}
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

        {/* Korfballeeftijd rechts */}
        <span
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            flexShrink: 0,
          }}
        >
          {leeftijd.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
