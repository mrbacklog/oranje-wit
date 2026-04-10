// apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
"use client";
import { useRef } from "react";
import "./tokens.css";
import { SpelerKaart } from "./SpelerKaart";
import type { WerkbordSpelerInTeam, WerkbordSpeler, ZoomLevel } from "./types";

const HUIDIG_SEIZOEN_EINDJAAR = 2026;

interface TeamKaartSpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  zoomLevel: ZoomLevel;
}

export function TeamKaartSpelerRij({ spelerInTeam, teamId, zoomLevel }: TeamKaartSpelerRijProps) {
  if (zoomLevel === "detail") {
    return (
      <SpelerKaart
        speler={spelerInTeam.speler}
        vanTeamId={teamId}
        seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
      />
    );
  }

  if (zoomLevel === "normaal") {
    return <NormaalSpelerRij speler={spelerInTeam.speler} teamId={teamId} />;
  }

  return <CompactSpelerRij speler={spelerInTeam.speler} teamId={teamId} />;
}

// Normaal rij — 1 regel hoog (21px): sekse-stip · naam · korfballeeftijd
function berekenKorfbalLeeftijdNormaal(geboortejaar: number, seizoenEindjaar: number): number {
  return seizoenEindjaar - geboortejaar;
}

function NormaalSpelerRij({ speler, teamId }: { speler: WerkbordSpeler; teamId: string }) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const stipKleur = geslacht === "v" ? "rgba(236,72,153,.7)" : "rgba(96,165,250,.7)";
  const naam = `${speler.roepnaam} ${speler.achternaam.charAt(0)}.`;
  const leeftijd = berekenKorfbalLeeftijdNormaal(speler.geboortejaar, HUIDIG_SEIZOEN_EINDJAAR);
  const leeftijdTekst = String(leeftijd);

  return (
    <>
      {/* Verborgen SpelerKaart — alleen als drag-image bron */}
      <div
        ref={ghostRef}
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: 220,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <SpelerKaart
          speler={speler}
          vanTeamId={teamId}
          seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
          asGhost
        />
      </div>

      {/* Normaal rij */}
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("speler", JSON.stringify({ speler, vanTeamId: teamId }));
          e.dataTransfer.effectAllowed = "move";
          if (ghostRef.current) {
            e.dataTransfer.setDragImage(ghostRef.current, 20, 24);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 6px 0 8px",
          height: 21,
          flexShrink: 0,
          cursor: "grab",
          borderBottom: "1px solid rgba(255,255,255,.04)",
        }}
      >
        {/* Sekse-stip */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: stipKleur,
            flexShrink: 0,
          }}
        />
        {/* Naam */}
        <div
          style={{
            flex: 1,
            fontSize: 10.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--text-1)",
          }}
        >
          {naam}
        </div>
        {/* Korfballeeftijd */}
        <div
          style={{
            fontSize: 9,
            color: "var(--text-3)",
            flexShrink: 0,
            minWidth: 28,
            textAlign: "right",
          }}
        >
          {leeftijdTekst}
        </div>
      </div>
    </>
  );
}

// Compacte rij voor compact zoomlevel.
// Gebruikt een verborgen SpelerKaart als drag-ghost.
function CompactSpelerRij({ speler, teamId }: { speler: WerkbordSpeler; teamId: string }) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
  const stopGezet = speler.status === "GAAT_STOPPEN";

  return (
    <>
      {/* Verborgen SpelerKaart — alleen als drag-image bron */}
      <div
        ref={ghostRef}
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: 220,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <SpelerKaart
          speler={speler}
          vanTeamId={teamId}
          seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
          asGhost
        />
      </div>

      {/* Compacte rij */}
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("speler", JSON.stringify({ speler, vanTeamId: teamId }));
          e.dataTransfer.effectAllowed = "move";
          if (ghostRef.current) {
            e.dataTransfer.setDragImage(ghostRef.current, 20, 24);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "0 8px",
          borderLeft: `2px solid ${geslachtKleur}`,
          minHeight: 22,
          flexShrink: 0,
          opacity: stopGezet ? 0.5 : 1,
          cursor: "grab",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 7,
            fontWeight: 700,
            flexShrink: 0,
            background: geslacht === "v" ? "rgba(236,72,153,.15)" : "rgba(96,165,250,.15)",
            color: geslachtKleur,
          }}
        >
          {initialen}
        </div>

        {/* Naam */}
        <div
          style={{
            fontSize: 11,
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: 500,
            textDecoration: stopGezet ? "line-through" : "none",
          }}
        >
          {speler.roepnaam} {speler.achternaam.charAt(0)}.
        </div>

        {/* Status-iconen */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {speler.gepind && <span style={{ fontSize: 8, color: "var(--accent)" }}>📌</span>}
          {speler.status === "AFGEMELD" && (
            <span style={{ fontSize: 9, color: "var(--err)" }}>⚠</span>
          )}
          {speler.status === "TWIJFELT" && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--warn)" }}>?</span>
          )}
          {speler.isNieuw && (
            <span
              style={{
                fontSize: 8,
                color: "var(--ok)",
                background: "rgba(34,197,94,.1)",
                borderRadius: 3,
                padding: "1px 3px",
                fontWeight: 700,
              }}
            >
              N
            </span>
          )}
        </div>
      </div>
    </>
  );
}
