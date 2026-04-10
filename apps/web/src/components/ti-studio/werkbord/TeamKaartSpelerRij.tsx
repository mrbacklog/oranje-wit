// apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
"use client";
import { useRef } from "react";
import { PEILJAAR } from "@oranje-wit/types";
import "./tokens.css";
import { SpelerKaart } from "./SpelerKaart";
import type { WerkbordSpelerInTeam, WerkbordSpeler, ZoomLevel } from "./types";

// Vaste rijhoogte — altijd 40px voor alle zoomniveaus.
// De CSS canvas-scale regelt de visuele grootte; afmetingen zijn fixed.
export const SPELER_RIJ_HOOGTE = 40;

// ── Schaalprincipe ──────────────────────────────────────────────────────────
//
// compact  (scale 0.4–0.8): GROTE fonts/iconen, WEINIG data
//   → fysiek groot zodat bij kleine CSS-zoom nog leesbaar
//
// normaal  (scale 0.8–1.2): middelgrote fonts, NORMALE data (2 regels)
//
// detail   (scale 1.2–1.5): KLEINE fonts/iconen, VEEL data
//   → identiek aan de pool-SpelerKaart; CSS-zoom maakt ze groter

interface TeamKaartSpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  selectieGroepId?: string | null;
  zoomLevel: ZoomLevel;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}

export function TeamKaartSpelerRij({
  spelerInTeam,
  teamId,
  selectieGroepId,
  zoomLevel,
  onSpelerClick,
}: TeamKaartSpelerRijProps) {
  if (zoomLevel === "detail") {
    return (
      <SpelerKaart
        speler={spelerInTeam.speler}
        vanTeamId={teamId}
        vanSelectieGroepId={selectieGroepId ?? null}
        seizoenEindjaar={PEILJAAR}
        onClick={onSpelerClick ? () => onSpelerClick(spelerInTeam.speler.id, teamId) : undefined}
      />
    );
  }

  if (zoomLevel === "normaal") {
    return (
      <NormaalSpelerRij
        speler={spelerInTeam.speler}
        teamId={teamId}
        selectieGroepId={selectieGroepId}
      />
    );
  }

  return (
    <CompactSpelerRij
      speler={spelerInTeam.speler}
      teamId={teamId}
      selectieGroepId={selectieGroepId}
    />
  );
}

// ── Gedeelde helpers ────────────────────────────────────────────────────────

function berekenLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  seizoenEindjaar: number
): number {
  if (geboortedatum) {
    const peildatum = new Date(seizoenEindjaar, 0, 1);
    const geboorte = new Date(geboortedatum);
    return (
      Math.floor(((peildatum.getTime() - geboorte.getTime()) / (365.25 * 24 * 3600 * 1000)) * 100) /
      100
    );
  }
  return seizoenEindjaar - geboortejaar;
}

// ── Compact rij — zoomlevel "compact" (scale 0.4–0.8) ──────────────────────
// GROTE elementen, WEINIG data: avatar-cirkel (26px) + naam (14px).
// Fysiek groot → bij kleine CSS-zoom nog zichtbaar.

function CompactSpelerRij({
  speler,
  teamId,
  selectieGroepId,
}: {
  speler: WerkbordSpeler;
  teamId: string;
  selectieGroepId?: string | null;
}) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
  const naam = `${speler.roepnaam} ${speler.achternaam.charAt(0)}.`;

  return (
    <>
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
        <SpelerKaart speler={speler} vanTeamId={teamId} seizoenEindjaar={PEILJAAR} asGhost />
      </div>
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData(
            "speler",
            JSON.stringify({
              speler,
              vanTeamId: teamId,
              vanSelectieGroepId: selectieGroepId ?? null,
            })
          );
          e.dataTransfer.effectAllowed = "move";
          if (ghostRef.current) e.dataTransfer.setDragImage(ghostRef.current, 20, 24);
        }}
        style={{
          height: SPELER_RIJ_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          flexShrink: 0,
          cursor: "grab",
          borderBottom: "1px solid rgba(255,255,255,.05)",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            background: geslachtBg,
            color: geslachtKleur,
            border: `1.5px solid ${geslachtKleur}`,
            boxSizing: "border-box",
          }}
        >
          {initialen}
        </div>
        <div
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--text-1)",
          }}
        >
          {naam}
        </div>
      </div>
    </>
  );
}

// ── Normaal rij — zoomlevel "normaal" (scale 0.8–1.2) ──────────────────────
// Middelgrote elementen, normale data: avatar (20px) + naam + leeftijd/status.

function NormaalSpelerRij({
  speler,
  teamId,
  selectieGroepId,
}: {
  speler: WerkbordSpeler;
  teamId: string;
  selectieGroepId?: string | null;
}) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
  const naam = `${speler.roepnaam} ${speler.achternaam.charAt(0)}.`;
  const leeftijd = berekenLeeftijd(speler.geboortedatum, speler.geboortejaar, PEILJAAR);
  const stopGezet = speler.status === "GAAT_STOPPEN";

  return (
    <>
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
        <SpelerKaart speler={speler} vanTeamId={teamId} seizoenEindjaar={PEILJAAR} asGhost />
      </div>
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData(
            "speler",
            JSON.stringify({
              speler,
              vanTeamId: teamId,
              vanSelectieGroepId: selectieGroepId ?? null,
            })
          );
          e.dataTransfer.effectAllowed = "move";
          if (ghostRef.current) e.dataTransfer.setDragImage(ghostRef.current, 20, 24);
        }}
        style={{
          height: SPELER_RIJ_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 8px",
          flexShrink: 0,
          cursor: "grab",
          borderBottom: "1px solid rgba(255,255,255,.05)",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            fontWeight: 700,
            background: geslachtBg,
            color: geslachtKleur,
            border: `1.5px solid ${geslachtKleur}`,
            boxSizing: "border-box",
          }}
        >
          {initialen}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
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
            {naam}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9.5, color: "var(--text-3)" }}>{leeftijd.toFixed(1)}</span>
            {speler.isNieuw && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--ok)" }}>N</span>
            )}
            {speler.status === "TWIJFELT" && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--warn)" }}>?</span>
            )}
            {speler.status === "AFGEMELD" && (
              <span style={{ fontSize: 9, color: "var(--err)" }}>⚠</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
