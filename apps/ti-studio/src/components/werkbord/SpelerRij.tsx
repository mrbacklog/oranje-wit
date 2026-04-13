// apps/web/src/components/ti-studio/werkbord/SpelerRij.tsx
"use client";

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  SpelerRij — design contract                                                ║
 * ║  Versie: 1.0  (goedgekeurd ontwerp 2026-04-12)                             ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                             ║
 * ║  DRIE VARIANTEN                                                             ║
 * ║  ──────────────                                                             ║
 * ║  compact  — wrappende badge-chips in de dropzone (CSS scale 0.4–0.8)       ║
 * ║             Chip: 26px hoog, auto breedte, border-radius 5px               ║
 * ║             Inhoud: [● gender-stip 5px] [roepnaam] [✦ of kruis]            ║
 * ║             Geen leeftijd, geen memo, geen avatar-cirkel                    ║
 * ║                                                                             ║
 * ║  normaal  — volledige breedte rij, 40px hoog (CSS scale 0.8–1.2)           ║
 * ║             [avatar 20px] [naam + badges flex-1] [▲ 14px] [leeftijd]       ║
 * ║             Naam: "Freek vd L." (roepnaam + tvs-kort + achternaam afk.)    ║
 * ║                                                                             ║
 * ║  pool     — 2-regelige rij, 40px hoog (spelerspool drawer)                 ║
 * ║             [pin-slot 14px] [avatar 22px] [naam-kolom flex]                ║
 * ║             Regel 1: [naam + badges] [spacer]                              ║
 * ║             Regel 2: [team-badge] [spacer] [▲ 14px] [leeftijd #ddd]        ║
 * ║             Naam: "Freek van der Laban" (volledig, of afg. bij >22 tekens) ║
 * ║                                                                             ║
 * ║  STATUSSYSTEEM — WAAS (geen aparte stip)                                   ║
 * ║  ─────────────────────────────────────────                                  ║
 * ║  BESCHIKBAAR   → transparant (standaard, geen klasse)                      ║
 * ║  isNieuw=true  → groen waas rgba(34,197,94,.07)                            ║
 * ║  TWIJFELT      → oranje waas rgba(249,115,22,.08)                          ║
 * ║  GEBLESSEERD   → oranje waas rgba(249,115,22,.10)                          ║
 * ║  GAAT_STOPPEN / GESTOPT / AFGEMELD                                         ║
 * ║                → rood waas rgba(239,68,68,.07), naam doorgestreept,        ║
 * ║                   opacity 0.52 op de gehele rij                            ║
 * ║  ALGEMEEN_RESERVE → geen waas, NIET draggable                              ║
 * ║                                                                             ║
 * ║  BADGE-VOLGORDE (direct na naam, inline, krimpt nooit)                     ║
 * ║  ──────────────────────────────────────────────────────                     ║
 * ║  1. ✦  nieuw-ster — groen, 10px (alleen als isNieuw=true)                 ║
 * ║  2. kruis-vierkantje — witte achtergrond, rood kruis                       ║
 * ║     (alleen als status=GEBLESSEERD)                                         ║
 * ║  Memo ▲ staat ALTIJD als laatste, RECHTS uitgevuld (niet inline na naam)   ║
 * ║                                                                             ║
 * ║  NAAMFORMATTERING                                                           ║
 * ║  ────────────────                                                           ║
 * ║  compact  → roepnaam alleen                                                 ║
 * ║  normaal  → "roepnaam [tvs-kort] [A.]"   bijv. "Freek vd L."               ║
 * ║  pool     → "roepnaam [tussenvoegsel] achternaam"  bijv. "Freek vd Laban"  ║
 * ║             Als totaal > 22 tekens → val terug op afgekorte tussenvoegsel  ║
 * ║                                                                             ║
 * ║  TUSSENVOEGSEL-AFKORTREGELS                                                 ║
 * ║  ───────────────────────────                                                ║
 * ║  "van der" → "vd"   "van de" → "vd"   "van" → "v"                        ║
 * ║  "de" → "d"         "den" → "d"        "ter" → "t"   "te" → "t"           ║
 * ║                                                                             ║
 * ║  PIN (alleen pool-variant)                                                  ║
 * ║  ─────────────────────────                                                  ║
 * ║  Gepind: 📌 (11px)                                                         ║
 * ║  Niet gepind: kleine lege cirkel (8px, border 1px #2a2a2a)                 ║
 * ║  Pin-slot is altijd 14px breed, links in de rij                            ║
 * ║                                                                             ║
 * ║  MEMO (▲ indicator)                                                         ║
 * ║  ──────────────────                                                         ║
 * ║  normaal: vaste 14px slot rechts van naam, voor leeftijd                   ║
 * ║  pool:    regel 2, vaste 14px slot, voor leeftijd                          ║
 * ║  compact: geen memo indicator                                               ║
 * ║  Kleur: var(--accent), font-weight 700, 9px                                ║
 * ║                                                                             ║
 * ║  DRAG GEDRAG                                                                ║
 * ║  ──────────                                                                 ║
 * ║  Alle varianten zijn draggable, BEHALVE status=ALGEMEEN_RESERVE            ║
 * ║  Drag-image: hidden SpelerKaart (FIFA-stijl, position fixed left -9999px)  ║
 * ║  DataTransfer: "speler" JSON met { speler, vanTeamId, vanSelectieGroepId } ║
 * ║                                                                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useRef, useState, useCallback } from "react";
import { PEILJAAR } from "@oranje-wit/types";
import "./tokens.css";
import { SpelerKaart } from "./SpelerKaart";
import type { WerkbordSpelerInTeam } from "./types";
import { useHoverKaart } from "./HoverSpelersKaart";

// ── Constanten ──────────────────────────────────────────────────────────────

export const SPELER_RIJ_HOOGTE = 40;

// Waas-kleuren per status (definitief design contract)
const WAAS_BESCHIKBAAR = "rgba(34,197,94,.06)";
const WAAS_NIEUW = "rgba(34,197,94,.10)";
const WAAS_TWIJFELT = "rgba(249,115,22,.08)";
const WAAS_GEBLESSEERD = "rgba(249,115,22,.10)";
const WAAS_STOPT = "rgba(239,68,68,.07)";

// Hover-versterkingen
const WAAS_BESCHIKBAAR_H = "rgba(34,197,94,.10)";
const WAAS_NIEUW_H = "rgba(34,197,94,.15)";
const WAAS_TWIJFELT_H = "rgba(249,115,22,.13)";
const WAAS_GEBLESSEERD_H = "rgba(249,115,22,.15)";
const WAAS_STOPT_H = "rgba(239,68,68,.11)";

// ── Props interface ─────────────────────────────────────────────────────────

interface SpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  selectieGroepId?: string | null;
  variant: "compact" | "normaal" | "pool";
  openMemoCount?: number;
  showScores?: boolean;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}

// ── Hulpfuncties ────────────────────────────────────────────────────────────

/** Bereken korfballeeftijd op peildatum 31 december van het seizoeneindjaar */
function berekenLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  seizoenEindjaar: number
): number {
  if (geboortedatum) {
    const peildatum = new Date(seizoenEindjaar, 11, 31);
    const geboorte = new Date(geboortedatum);
    return (
      Math.floor(((peildatum.getTime() - geboorte.getTime()) / (365.25 * 24 * 3600 * 1000)) * 100) /
      100
    );
  }
  return seizoenEindjaar - geboortejaar;
}

/** Afkortmap voor tussenvoegsels */
const TVS_AFKORT: Record<string, string> = {
  "van der": "vd",
  "van de": "vd",
  van: "v",
  de: "d",
  den: "d",
  ter: "t",
  te: "t",
};

/** Kort een tussenvoegsel af volgens het design contract */
function kortTussenvoegsel(tvs: string): string {
  const lager = tvs.toLowerCase().trim();
  return TVS_AFKORT[lager] ?? tvs;
}

/**
 * Geeft het achternaam-deel zonder tussenvoegsel-prefix.
 * Sommige records in de DB slaan achternaam op als "van Rooij" i.p.v. "Rooij".
 * Dan moet de initiaal "R." zijn, niet "V.".
 */
function achternaamKern(achternaam: string, tussenvoegsel: string | null): string {
  if (!tussenvoegsel || !achternaam) return achternaam;
  const prefix = tussenvoegsel.toLowerCase().trim() + " ";
  if (achternaam.toLowerCase().startsWith(prefix)) return achternaam.slice(prefix.length);
  return achternaam;
}

/**
 * Formatteert naam voor de normaal-variant:
 * "roepnaam [tvs-kort] [achternaam-initial.]"
 * Voorbeeld: "Freek" + "van der" + "Laban" → "Freek vd L."
 */
function naamNormaal(roepnaam: string, tussenvoegsel: string | null, achternaam: string): string {
  const tvsKort = tussenvoegsel ? ` ${kortTussenvoegsel(tussenvoegsel)}` : "";
  const an = achternaamKern(achternaam, tussenvoegsel);
  const achternaamInitiaal = an ? ` ${an.charAt(0).toUpperCase()}.` : "";
  return `${roepnaam}${tvsKort}${achternaamInitiaal}`;
}

/**
 * Formatteert naam voor de pool-variant:
 * Volledig: "roepnaam [tussenvoegsel] achternaam"
 * Als > 22 tekens: val terug op afgekort tussenvoegsel
 */
function naamPool(roepnaam: string, tussenvoegsel: string | null, achternaam: string): string {
  const volledig = [roepnaam, tussenvoegsel, achternaam].filter(Boolean).join(" ");
  if (volledig.length <= 22) return volledig;
  // Val terug op afgekort tussenvoegsel
  const tvsKort = tussenvoegsel ? kortTussenvoegsel(tussenvoegsel) : null;
  return [roepnaam, tvsKort, achternaam].filter(Boolean).join(" ");
}

/** Geeft de waas-kleur terug op basis van status en isNieuw */
function waasKleur(status: string, isNieuw: boolean): { normaal: string; hover: string } | null {
  if (status === "GAAT_STOPPEN" || status === "GESTOPT" || status === "AFGEMELD") {
    return { normaal: WAAS_STOPT, hover: WAAS_STOPT_H };
  }
  if (status === "GEBLESSEERD") return { normaal: WAAS_GEBLESSEERD, hover: WAAS_GEBLESSEERD_H };
  if (status === "TWIJFELT") return { normaal: WAAS_TWIJFELT, hover: WAAS_TWIJFELT_H };
  if (isNieuw) return { normaal: WAAS_NIEUW, hover: WAAS_NIEUW_H };
  if (status === "BESCHIKBAAR") return { normaal: WAAS_BESCHIKBAAR, hover: WAAS_BESCHIKBAAR_H };
  return null;
}

/** Inline nieuw-ster badge */
function NieuwSter() {
  return (
    <span
      aria-label="Nieuw lid"
      style={{ fontSize: 10, color: "var(--ok)", flexShrink: 0, lineHeight: 1 }}
    >
      ✦
    </span>
  );
}

/** Inline kruis-badge (geblesseerd) */
function KruisBadge() {
  return (
    <span
      aria-label="Geblesseerd"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 11,
        height: 11,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 2,
        flexShrink: 0,
      }}
    >
      <svg width="7" height="7" viewBox="0 0 6 6" fill="none">
        <rect x="2.5" y="0" width="1" height="6" fill="#e00" />
        <rect x="0" y="2.5" width="6" height="1" fill="#e00" />
      </svg>
    </span>
  );
}

// ── Drag-logica (gedeeld) ───────────────────────────────────────────────────

function useDragState() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLanding, setIsLanding] = useState(false);
  return { isDragging, isLanding, setIsDragging, setIsLanding };
}

function dragImageStyle(): React.CSSProperties {
  return {
    position: "fixed",
    left: -9999,
    top: 0,
    width: 220,
    pointerEvents: "none",
    zIndex: -1,
  };
}

function bouwDragHandlers(
  ghostRef: React.RefObject<HTMLDivElement | null>,
  dragData: {
    speler: WerkbordSpelerInTeam["speler"];
    vanTeamId: string | null;
    vanSelectieGroepId: string | null;
  },
  setIsDragging: (v: boolean) => void,
  setIsLanding: (v: boolean) => void
) {
  return {
    onDragStart(e: React.DragEvent) {
      setIsDragging(true);
      setIsLanding(false);
      e.stopPropagation();
      e.dataTransfer.setData("speler", JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = "move";
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.style.background = "var(--bg-2)";
        ghost.style.border = "1.5px solid rgba(255,107,0,.6)";
        ghost.style.borderRadius = "var(--card-radius)";
        ghost.style.boxShadow =
          "0 10px 28px rgba(0,0,0,.65), 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.2)";
        ghost.style.padding = "4px";
        e.dataTransfer.setDragImage(ghost, 24, 28);
        requestAnimationFrame(() => {
          if (ghost) {
            ghost.style.background = "";
            ghost.style.border = "";
            ghost.style.borderRadius = "";
            ghost.style.boxShadow = "";
            ghost.style.padding = "";
          }
        });
      }
    },
    onDragEnd() {
      setIsDragging(false);
      setIsLanding(true);
      setTimeout(() => setIsLanding(false), 650);
    },
  };
}

// ── SpelerRij (dispatcher) ──────────────────────────────────────────────────

export function SpelerRij({
  spelerInTeam,
  teamId,
  selectieGroepId,
  variant,
  openMemoCount = 0,
  showScores = false,
  onSpelerClick,
}: SpelerRijProps) {
  if (variant === "compact") {
    return (
      <CompactChip
        spelerInTeam={spelerInTeam}
        teamId={teamId}
        selectieGroepId={selectieGroepId}
        onSpelerClick={onSpelerClick}
      />
    );
  }
  if (variant === "normaal") {
    return (
      <NormaalRij
        spelerInTeam={spelerInTeam}
        teamId={teamId}
        selectieGroepId={selectieGroepId}
        openMemoCount={openMemoCount}
        showScores={showScores}
        onSpelerClick={onSpelerClick}
      />
    );
  }
  return (
    <PoolRij
      spelerInTeam={spelerInTeam}
      teamId={teamId}
      selectieGroepId={selectieGroepId}
      openMemoCount={openMemoCount}
      showScores={showScores}
      onSpelerClick={onSpelerClick}
    />
  );
}

// ── Compact chip ────────────────────────────────────────────────────────────
// Badge-chip die wrappt in de dropzone. 26px hoog, auto breedte.
// Inhoud: [● gender-stip 5px] [roepnaam] [✦ of kruis]

function CompactChip({
  spelerInTeam,
  teamId,
  selectieGroepId,
  onSpelerClick,
}: {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  selectieGroepId?: string | null;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}) {
  const { speler } = spelerInTeam;
  const ghostRef = useRef<HTMLDivElement>(null);
  const { isDragging, isLanding, setIsDragging, setIsLanding } = useDragState();
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const isStopt =
    speler.status === "GAAT_STOPPEN" || speler.status === "GESTOPT" || speler.status === "AFGEMELD";
  const waas = waasKleur(speler.status, speler.isNieuw);
  const [isHovered, setIsHovered] = useState(false);

  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const stipKleur = geslacht === "v" ? "rgba(236,72,153,.85)" : "rgba(96,165,250,.85)";

  const dragHandlers = isAR
    ? {}
    : bouwDragHandlers(
        ghostRef,
        { speler, vanTeamId: teamId, vanSelectieGroepId: selectieGroepId ?? null },
        setIsDragging,
        setIsLanding
      );

  const achtergrond = isDragging
    ? "rgba(255,107,0,.10)"
    : waas
      ? isHovered
        ? waas.hover
        : waas.normaal
      : isHovered
        ? "rgba(255,255,255,.06)"
        : "rgba(255,255,255,.04)";

  return (
    <>
      {/* Drag-image ghost */}
      {!isAR && (
        <div ref={ghostRef} style={dragImageStyle()}>
          <SpelerKaart speler={speler} vanTeamId={teamId} seizoenEindjaar={PEILJAAR} asGhost />
        </div>
      )}

      {/* De chip zelf */}
      <div
        draggable={!isAR}
        {...dragHandlers}
        onClick={onSpelerClick ? () => onSpelerClick(speler.id, teamId) : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 32,
          padding: "0 9px",
          minWidth: 80,
          maxWidth: 180,
          borderRadius: 6,
          border: isDragging
            ? "1px solid rgba(255,107,0,.5)"
            : speler.isNieuw
              ? "1px solid rgba(34,197,94,.55)"
              : speler.status === "TWIJFELT" || speler.status === "GEBLESSEERD"
                ? "1px solid rgba(249,115,22,.45)"
                : isStopt
                  ? "1px solid rgba(239,68,68,.4)"
                  : speler.status === "BESCHIKBAAR"
                    ? "1px solid rgba(34,197,94,.30)"
                    : "1px solid rgba(255,255,255,.06)",
          background: achtergrond,
          cursor: isAR ? "default" : isDragging ? "grabbing" : "grab",
          overflow: "hidden",
          opacity: isStopt ? 0.5 : isDragging ? 0.6 : 1,
          transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
          boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
          transition: isDragging
            ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1)"
            : "background 100ms",
          animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
          position: "relative",
          zIndex: isDragging ? 50 : undefined,
        }}
      >
        {/* Gender-stip */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: stipKleur,
            flexShrink: 0,
          }}
        />

        {/* Naam: roepnaam + afgekorte tvs + achternaam-initiaal */}
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--text-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
            textDecoration: isStopt ? "line-through" : "none",
          }}
        >
          {naamNormaal(speler.roepnaam, speler.tussenvoegsel, speler.achternaam)}
        </span>

        {/* Badges */}
        {speler.isNieuw && (
          <span style={{ fontSize: 10, color: "var(--ok)", flexShrink: 0, lineHeight: 1 }}>✦</span>
        )}
        {speler.status === "GEBLESSEERD" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 13,
              height: 13,
              background: "rgba(255,255,255,.88)",
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 6 6" fill="none">
              <rect x="2.5" y="0" width="1" height="6" fill="#e00" />
              <rect x="0" y="2.5" width="6" height="1" fill="#e00" />
            </svg>
          </span>
        )}
      </div>

      <style>{`
        @keyframes dropLandSpeler {
          from {
            transform: scale(1.04) translateY(-4px);
            box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,107,0,.45);
          }
          to {
            transform: scale(1) translateY(0);
            box-shadow: none;
          }
        }
      `}</style>
    </>
  );
}

// ── Normaal rij ─────────────────────────────────────────────────────────────
// Volledige breedte rij, 40px hoog.
// [avatar 20px] [naam + badges flex-1] [▲ 14px] [leeftijd]

function NormaalRij({
  spelerInTeam,
  teamId,
  selectieGroepId,
  openMemoCount = 0,
  showScores = false,
  onSpelerClick,
}: {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  selectieGroepId?: string | null;
  openMemoCount?: number;
  showScores?: boolean;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}) {
  const { speler } = spelerInTeam;
  const ghostRef = useRef<HTMLDivElement>(null);
  const { isDragging, isLanding, setIsDragging, setIsLanding } = useDragState();
  const [isHovered, setIsHovered] = useState(false);
  const { registerHover, cancelHover, updatePos } = useHoverKaart();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      setIsHovered(true);
      registerHover(speler, e.clientX, e.clientY);
    },
    [speler, registerHover]
  );
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    cancelHover();
  }, [cancelHover]);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updatePos(e.clientX, e.clientY);
    },
    [updatePos]
  );
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const isStopt =
    speler.status === "GAAT_STOPPEN" || speler.status === "GESTOPT" || speler.status === "AFGEMELD";
  const waas = waasKleur(speler.status, speler.isNieuw);

  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";
  const initialen =
    `${speler.roepnaam.charAt(0)}${achternaamKern(speler.achternaam, speler.tussenvoegsel).charAt(0)}`.toUpperCase();
  const naam = naamNormaal(speler.roepnaam, speler.tussenvoegsel, speler.achternaam);
  const leeftijd = berekenLeeftijd(speler.geboortedatum, speler.geboortejaar, PEILJAAR);

  const dragHandlers = isAR
    ? {}
    : bouwDragHandlers(
        ghostRef,
        { speler, vanTeamId: teamId, vanSelectieGroepId: selectieGroepId ?? null },
        setIsDragging,
        setIsLanding
      );

  const achtergrond = isDragging
    ? "rgba(255,107,0,.10)"
    : waas
      ? isHovered
        ? waas.hover
        : waas.normaal
      : isHovered
        ? "rgba(255,255,255,.02)"
        : "transparent";

  return (
    <>
      {/* Drag-image ghost */}
      {!isAR && (
        <div ref={ghostRef} style={dragImageStyle()}>
          <SpelerKaart speler={speler} vanTeamId={teamId} seizoenEindjaar={PEILJAAR} asGhost />
        </div>
      )}

      <div
        draggable={!isAR}
        {...dragHandlers}
        onClick={onSpelerClick ? () => onSpelerClick(speler.id, teamId) : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{
          height: SPELER_RIJ_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 8px",
          flexShrink: 0,
          cursor: isAR ? "default" : isDragging ? "grabbing" : "grab",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          background: achtergrond,
          opacity: isStopt ? 0.52 : isDragging ? 0.6 : 1,
          outline: isDragging ? "1.5px solid rgba(255,107,0,.5)" : "none",
          boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
          transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
          transition: isDragging
            ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease"
            : "background 100ms",
          animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
          zIndex: isDragging ? 50 : undefined,
          position: "relative",
        }}
      >
        {/* Avatar */}
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

        {/* Naam-blok: naam + badges (krimpt, badges krimpen nooit) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-1)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flexShrink: 1,
              minWidth: 0,
              textDecoration: isStopt ? "line-through" : "none",
            }}
          >
            {naam}
          </div>

          {/* Badges direct na naam, krimpen nooit */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            {speler.isNieuw && <NieuwSter />}
            {speler.status === "GEBLESSEERD" && <KruisBadge />}
          </div>
        </div>

        {/* Memo-slot — vaste 14px, altijd aanwezig zodat leeftijd uitgelijnd blijft */}
        <div
          style={{
            width: 14,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {openMemoCount > 0 && (
            <span
              style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}
              title={`${openMemoCount} open memo${openMemoCount !== 1 ? "'s" : ""}`}
            >
              ▲
            </span>
          )}
        </div>

        {/* Leeftijd */}
        <span style={{ fontSize: 9.5, color: "var(--text-3)", flexShrink: 0 }}>
          {leeftijd.toFixed(1)}
        </span>

        {/* USS score — octagon badge, alleen als showScores=true en score beschikbaar */}
        {showScores && speler.ussScore !== null && (
          <span
            title={`USS score: ${speler.ussScore}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              flexShrink: 0,
              clipPath:
                "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
              background: "rgba(255,107,0,.18)",
              fontSize: 8,
              fontWeight: 700,
              color: "var(--accent)",
              lineHeight: 1,
            }}
          >
            {speler.ussScore.toFixed(1)}
          </span>
        )}
      </div>

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
    </>
  );
}

// ── Pool rij ─────────────────────────────────────────────────────────────────
// 2-regelige rij, 40px hoog. Gebruikt in SpelersPoolDrawer.
// [pin-slot 14px] [avatar 22px] [naam-kolom flex]

function PoolRij({
  spelerInTeam,
  teamId,
  selectieGroepId,
  openMemoCount = 0,
  showScores = false,
  onSpelerClick,
}: {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  selectieGroepId?: string | null;
  openMemoCount?: number;
  showScores?: boolean;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}) {
  const { speler } = spelerInTeam;
  const ghostRef = useRef<HTMLDivElement>(null);
  const { isDragging, isLanding, setIsDragging, setIsLanding } = useDragState();
  const [isHovered, setIsHovered] = useState(false);
  const { registerHover, cancelHover, updatePos } = useHoverKaart();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      setIsHovered(true);
      registerHover(speler, e.clientX, e.clientY);
    },
    [speler, registerHover]
  );
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    cancelHover();
  }, [cancelHover]);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updatePos(e.clientX, e.clientY);
    },
    [updatePos]
  );
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const isStopt =
    speler.status === "GAAT_STOPPEN" || speler.status === "GESTOPT" || speler.status === "AFGEMELD";
  const waas = waasKleur(speler.status, speler.isNieuw);

  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";
  const initialen =
    `${speler.roepnaam.charAt(0)}${achternaamKern(speler.achternaam, speler.tussenvoegsel).charAt(0)}`.toUpperCase();
  const naam = naamPool(speler.roepnaam, speler.tussenvoegsel, speler.achternaam);
  const leeftijd = berekenLeeftijd(speler.geboortedatum, speler.geboortejaar, PEILJAAR);

  // Pool: vanTeamId is de huidige teamId (null als de speler geen team heeft)
  const vanTeamId = speler.teamId ?? null;

  const dragHandlers = isAR
    ? {}
    : bouwDragHandlers(
        ghostRef,
        { speler, vanTeamId: vanTeamId, vanSelectieGroepId: selectieGroepId ?? null },
        setIsDragging,
        setIsLanding
      );

  const achtergrond = isDragging
    ? "rgba(255,107,0,.10)"
    : waas
      ? isHovered
        ? waas.hover
        : waas.normaal
      : isHovered
        ? "rgba(255,255,255,.02)"
        : "transparent";

  return (
    <>
      {/* Drag-image ghost */}
      {!isAR && (
        <div ref={ghostRef} style={dragImageStyle()}>
          <SpelerKaart speler={speler} vanTeamId={vanTeamId} seizoenEindjaar={PEILJAAR} asGhost />
        </div>
      )}

      <div
        draggable={!isAR}
        {...dragHandlers}
        onClick={onSpelerClick ? () => onSpelerClick(speler.id, vanTeamId) : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{
          height: SPELER_RIJ_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 8px 0 6px",
          flexShrink: 0,
          cursor: isAR ? "default" : isDragging ? "grabbing" : "grab",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          background: achtergrond,
          opacity: isStopt ? 0.52 : isDragging ? 0.6 : 1,
          outline: isDragging ? "1.5px solid rgba(255,107,0,.5)" : "none",
          boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
          transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
          transition: isDragging
            ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease"
            : "background 100ms",
          animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
          zIndex: isDragging ? 50 : undefined,
          position: "relative",
        }}
      >
        {/* Pin-slot */}
        <div
          style={{
            width: 14,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {speler.gepind ? (
            <span style={{ fontSize: 11, lineHeight: 1 }}>📌</span>
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "1px solid #2a2a2a",
                background: "transparent",
                display: "inline-block",
              }}
            />
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            background: geslachtBg,
            color: geslachtKleur,
            border: `1.5px solid ${geslachtKleur}`,
            boxSizing: "border-box",
          }}
        >
          {initialen}
        </div>

        {/* Naam-kolom: 2 regels */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {/* Regel 1: naam + badges, spacer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-1)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexShrink: 1,
                minWidth: 0,
                textDecoration: isStopt ? "line-through" : "none",
              }}
            >
              {naam}
            </div>
            {/* Badges direct na naam */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
              {speler.isNieuw && <NieuwSter />}
              {speler.status === "GEBLESSEERD" && <KruisBadge />}
            </div>
            {/* Spacer vult resterende ruimte */}
            <div style={{ flex: 1 }} />
          </div>

          {/* Regel 2: team-badge, spacer, memo-slot, leeftijd */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {speler.huidigTeam && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: "var(--text-2)",
                  border: "1px solid #2a2a2a",
                  borderRadius: 3,
                  padding: "0 4px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {speler.huidigTeam}
              </span>
            )}
            {speler.ingedeeldTeamNaam && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: "var(--accent)",
                  border: "1px solid rgba(255,107,0,.35)",
                  borderRadius: 3,
                  padding: "0 4px",
                  background: "rgba(255,107,0,.08)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {speler.ingedeeldTeamNaam}
              </span>
            )}
            {/* Spacer */}
            <div style={{ flex: 1 }} />
            {/* Memo-slot — vaste 14px */}
            <div
              style={{
                width: 14,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {openMemoCount > 0 && (
                <span
                  style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}
                  title={`${openMemoCount} open memo${openMemoCount !== 1 ? "'s" : ""}`}
                >
                  ▲
                </span>
              )}
            </div>
            {/* Leeftijd */}
            <span style={{ fontSize: 8.5, color: "#ddd", flexShrink: 0 }}>
              {leeftijd.toFixed(1)}
            </span>

            {/* USS score — octagon badge, helemaal rechts als showScores=true */}
            {showScores && speler.ussScore !== null && (
              <span
                title={`USS score: ${speler.ussScore}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  clipPath:
                    "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
                  background: "rgba(255,107,0,.18)",
                  fontSize: 7,
                  fontWeight: 700,
                  color: "var(--accent)",
                  lineHeight: 1,
                }}
              >
                {speler.ussScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

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
    </>
  );
}
