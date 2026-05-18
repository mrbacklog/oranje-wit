"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";
import { SpelerAvatar } from "../primitives/SpelerAvatar";
import { formatSpelerNaam } from "@/lib/format/speler";

// ── Leeftijdthema per categorie ───────────────────────────────────────────────

interface LeeftijdThema {
  borderGrad: string;
  glow: string;
  accentColor: string;
  headerBg: string;
  bgTint: string;
}

function leeftijdThema(
  categorie: "kangoeroe" | "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior"
): LeeftijdThema {
  switch (categorie) {
    case "kangoeroe":
      return {
        borderGrad:
          "linear-gradient(135deg, #3b0764 0%, #7c3aed 40%, #a78bfa 60%, #7c3aed 80%, #3b0764 100%)",
        glow: "rgba(124,58,237,.50)",
        accentColor: "rgba(124,58,237,.6)",
        headerBg: "rgba(124,58,237,.15)",
        bgTint: "#7c3aed",
      };
    case "blauw":
      return {
        borderGrad:
          "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 40%, #60a5fa 60%, #3b82f6 80%, #1e3a8a 100%)",
        glow: "rgba(59,130,246,.50)",
        accentColor: "rgba(59,130,246,.6)",
        headerBg: "rgba(59,130,246,.15)",
        bgTint: "#3b82f6",
      };
    case "groen":
      return {
        borderGrad:
          "linear-gradient(135deg, #14532d 0%, #16a34a 40%, #4ade80 60%, #16a34a 80%, #14532d 100%)",
        glow: "rgba(22,163,74,.45)",
        accentColor: "rgba(22,163,74,.6)",
        headerBg: "rgba(22,163,74,.12)",
        bgTint: "#16a34a",
      };
    case "geel":
      return {
        borderGrad:
          "linear-gradient(135deg, #713f12 0%, #facc15 40%, #fde047 60%, #facc15 80%, #713f12 100%)",
        glow: "rgba(250,204,21,.45)",
        accentColor: "rgba(250,204,21,.6)",
        headerBg: "rgba(250,204,21,.12)",
        bgTint: "#facc15",
      };
    case "oranje":
      return {
        borderGrad:
          "linear-gradient(135deg, #7c2d12 0%, #f97316 40%, #fb923c 60%, #f97316 80%, #7c2d12 100%)",
        glow: "rgba(249,115,22,.50)",
        accentColor: "rgba(249,115,22,.6)",
        headerBg: "rgba(249,115,22,.15)",
        bgTint: "#f97316",
      };
    case "rood":
      return {
        borderGrad:
          "linear-gradient(135deg, #7f1d1d 0%, #dc2626 40%, #ef4444 60%, #dc2626 80%, #7f1d1d 100%)",
        glow: "rgba(220,38,38,.50)",
        accentColor: "rgba(220,38,38,.6)",
        headerBg: "rgba(220,38,38,.15)",
        bgTint: "#dc2626",
      };
    default: // senior
      return {
        borderGrad:
          "linear-gradient(135deg, #374151 0%, #9ca3af 40%, #d1d5db 60%, #9ca3af 80%, #374151 100%)",
        glow: "rgba(156,163,175,.35)",
        accentColor: "rgba(156,163,175,.5)",
        headerBg: "rgba(156,163,175,.10)",
        bgTint: "#9ca3af",
      };
  }
}

// ── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GEBLESSEERD: "Geblesseerd",
  GAAT_STOPPEN: "Stopt",
  GESTOPT: "Gestopt",
  NIEUW_POTENTIEEL: "Nieuw lid",
  NIEUW_DEFINITIEF: "Nieuw lid",
  ALGEMEEN_RESERVE: "Alg. reserve",
  RECREANT: "Recreant",
  NIET_SPELEND: "Niet spelend",
};

// ── Status-kleur voor chip-border ─────────────────────────────────────────────

function statusChipKleur(status: string): string {
  switch (status) {
    case "NIEUW_POTENTIEEL":
    case "NIEUW_DEFINITIEF":
      return "#a3e635";
    case "TWIJFELT":
    case "GEBLESSEERD":
      return "#fb923c";
    case "GAAT_STOPPEN":
    case "GESTOPT":
    case "RECREANT":
    case "NIET_SPELEND":
      return "#e11d48";
    case "ALGEMEEN_RESERVE":
      return "#84a98c";
    default:
      return "#10b981";
  }
}

// ── OW-schildje SVG (watermerk) ───────────────────────────────────────────────

function OwSchildje() {
  return (
    <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 7 C4 5 6 4 8 4 L40 2 L72 4 C74 4 76 5 76 7 L76 52 C76 68 60 82 40 94 C20 82 4 68 4 52 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M9 10 C9 8.5 10.5 7.5 12 7.5 L40 5.5 L68 7.5 C69.5 7.5 71 8.5 71 10 L71 51 C71 65 56 78 40 89 C24 78 9 65 9 51 Z"
        stroke="currentColor"
        strokeWidth="0.75"
        fill="none"
        opacity={0.4}
        strokeLinejoin="round"
      />
      <ellipse
        cx="34"
        cy="52"
        rx="14"
        ry="18"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M22 42 L26 68 L34 52 L42 68 L52 38"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 34 Q34 30 40 34"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity={0.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Geslacht-icoon ─────────────────────────────────────────────────────────────

function GeslachtIcoon({ geslacht }: { geslacht: "M" | "V" }) {
  if (geslacht === "V") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
        <circle cx="12" cy="8" r="6" stroke="#000" strokeWidth="3.5" />
        <line x1="12" y1="14" x2="12" y2="22" stroke="#000" strokeWidth="3.5" />
        <line x1="9" y1="19" x2="15" y2="19" stroke="#000" strokeWidth="3.5" />
        <circle cx="12" cy="8" r="6" stroke="#fff" strokeWidth="2" />
        <line x1="12" y1="14" x2="12" y2="22" stroke="#fff" strokeWidth="2" />
        <line x1="9" y1="19" x2="15" y2="19" stroke="#fff" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
      <circle cx="10" cy="14" r="6" stroke="#000" strokeWidth="3.5" />
      <line x1="21" y1="3" x2="15" y2="9" stroke="#000" strokeWidth="3.5" />
      <polyline points="16 3 21 3 21 8" stroke="#000" strokeWidth="3.5" />
      <circle cx="10" cy="14" r="6" stroke="#fff" strokeWidth="2" />
      <line x1="21" y1="3" x2="15" y2="9" stroke="#fff" strokeWidth="2" />
      <polyline points="16 3 21 3 21 8" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface HoverKaartSpelerData {
  relCode: string;
  roepnaam: string;
  tussenvoegsel?: string | null;
  achternaam: string;
  geslacht: "M" | "V";
  leeftijd: number;
  leeftijdscategorie: "kangoeroe" | "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";
  status: SpelerStatus | string;
  isNieuw: boolean;
  hasFoto: boolean;
  memoStatus?: WerkitemStatus | null;
  huidigTeam?: string | null;
  indelingTeam?: string | null;
}

interface HoverKaartProps {
  speler: HoverKaartSpelerData;
  anchorRect: DOMRect | null;
  open: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HoverKaart({
  speler,
  anchorRect,
  open,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: HoverKaartProps) {
  const [gemount, setGemount] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const kaartRef = useRef<HTMLDivElement>(null);

  // Portal mount guard
  useEffect(() => {
    setGemount(true);
  }, []);

  // Positie berekenen op basis van anchorRect
  useEffect(() => {
    if (!anchorRect) return;
    const kaartBreed = 200;
    const kaartHoog = 300;
    let left = anchorRect.right + 12;
    let top = anchorRect.top - 60;

    if (left + kaartBreed > window.innerWidth - 12) {
      left = anchorRect.left - kaartBreed - 12;
    }
    if (top + kaartHoog > window.innerHeight - 12) {
      top = window.innerHeight - kaartHoog - 12;
    }
    if (top < 12) top = 12;

    setPos({ top: top + window.scrollY, left: left + window.scrollX });
  }, [anchorRect]);

  if (!open || !gemount) return null;

  const thema = leeftijdThema(speler.leeftijdscategorie);
  const leeftijdJaar = Math.floor(speler.leeftijd);
  const leeftijdDecimaal = Math.round((speler.leeftijd - leeftijdJaar) * 100);
  const leeftijdDecStr = `.${String(leeftijdDecimaal).padStart(2, "0")}`;

  const naamResult = formatSpelerNaam(speler, "hover") as { hoofd: string; sub: string };
  const chipKleur = statusChipKleur(speler.status);
  const statusLabel = STATUS_LABELS[speler.status] ?? speler.status;

  return createPortal(
    <div
      ref={kaartRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 200,
        height: 300,
        borderRadius: 12,
        overflow: "visible",
        cursor: onClick ? "pointer" : "default",
        // Fade-in + slight scale-up animatie (200ms)
        animation: "hoverkaart-in 200ms cubic-bezier(0.4, 0, 0.2, 1) both",
      }}
    >
      {/* Gradient-border via div (CSS pseudo-element equivalent) */}
      <div
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: 15,
          background: thema.borderGrad,
          zIndex: 0,
        }}
      />
      {/* Blur-glow achter border */}
      <div
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: 15,
          background: thema.borderGrad,
          zIndex: 0,
          filter: "blur(8px)",
          opacity: 0.35,
        }}
      />

      {/* Inner card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 12,
          overflow: "hidden",
          background: "linear-gradient(160deg, #1a1a1e 0%, #0c0c0f 55%, #121216 100%)",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* OW-schildje watermerk */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 28,
            right: -10,
            width: 120,
            height: 144,
            zIndex: 1,
            pointerEvents: "none",
            opacity: 0.13,
            color: thema.accentColor,
            mixBlendMode: "overlay",
          }}
        >
          <OwSchildje />
        </div>

        {/* Achtergrond-tint (leeftijdkleur) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            mixBlendMode: "overlay",
            zIndex: 0,
            pointerEvents: "none",
            background: thema.bgTint,
          }}
        />

        {/* Corner glow */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: thema.accentColor,
            opacity: 0.12,
            filter: "blur(24px)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Header: [status + memo links] · [leeftijd rechts] */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "11px 11px 8px",
            gap: 6,
            borderBottom: `1px solid ${thema.accentColor}`,
            background: `linear-gradient(180deg, ${thema.headerBg} 0%, transparent 100%)`,
          }}
        >
          {/* Links: status-chip + memo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
              marginTop: 10,
            }}
          >
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: `1px solid ${chipKleur}`,
                color: "#f5f5f7",
                background: "rgba(255,255,255,.07)",
                whiteSpace: "nowrap",
              }}
            >
              {statusLabel}
            </span>
            {/* Memo-indicatie in header (28px corner zit op avatar) */}
            {speler.memoStatus && speler.memoStatus !== "GEARCHIVEERD" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  color: "var(--memo-open, #fde047)",
                }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M5 3h10l4 4v14H5z" />
                  <path
                    d="M15 3v4h4M8 12h8M8 15h8M8 18h5"
                    stroke="#121216"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            )}
          </div>

          {/* Rechts: leeftijd groot met glow */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 38,
                fontWeight: 900,
                lineHeight: 1,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 24px ${thema.glow}, 0 0 8px ${thema.glow}`,
              }}
            >
              {leeftijdJaar}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "rgba(255,255,255,.7)",
                lineHeight: 1,
                marginTop: -2,
                fontVariantNumeric: "tabular-nums",
                textAlign: "right",
              }}
            >
              {leeftijdDecStr}
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                color: "rgba(255,255,255,.35)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "right",
                marginTop: 1,
              }}
            >
              jr
            </span>
          </div>
        </div>

        {/* Foto/avatar vlak — edge-to-edge, flex: 1 */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            margin: 0,
            overflow: "hidden",
          }}
        >
          {/* SpelerAvatar — vult het hele vlak */}
          <SpelerAvatar
            relCode={speler.relCode}
            roepnaam={speler.roepnaam}
            achternaam={speler.achternaam}
            geslacht={speler.geslacht}
            size="hover"
            hasFoto={speler.hasFoto}
            status={speler.status as SpelerStatus}
            isNieuw={speler.isNieuw}
            memoStatus={speler.memoStatus}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: 0,
            }}
          />

          {/* Gradient bovenaan foto (leesbaarheid header-overgang) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40%",
              background:
                "linear-gradient(180deg, rgba(8,8,12,.45) 0%, rgba(8,8,12,.15) 50%, transparent 100%)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          {/* Gradient onderkant — overgang naar footer */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "72%",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(10,10,14,.75) 45%, rgba(8,8,12,.98) 100%)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          {/* Geslacht-icoon links-onder in foto */}
          <div
            style={{
              position: "absolute",
              bottom: 54,
              left: 8,
              zIndex: 6,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <GeslachtIcoon geslacht={speler.geslacht} />
          </div>

          {/* Naam over foto — hoofd UPPERCASE groot, sub gedempt */}
          <div
            style={{
              position: "absolute",
              bottom: 52,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,.9), 0 4px 24px rgba(0,0,0,.8)",
                lineHeight: 1,
              }}
            >
              {naamResult.hoofd}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,.65)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {naamResult.sub}
            </div>
          </div>
        </div>

        {/* Footer: huidig team · indeling — glassmorphism */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 5,
            padding: "8px 12px 11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            borderTop: "1px solid rgba(255,255,255,.10)",
            background: "rgba(255,255,255,.06)",
            backdropFilter: "blur(12px) saturate(140%)",
            WebkitBackdropFilter: "blur(12px) saturate(140%)",
            borderRadius: "0 0 12px 12px",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,.65)",
              border: "1px solid rgba(255,255,255,.18)",
              borderRadius: 4,
              padding: "4px 10px",
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: 11,
              whiteSpace: "nowrap",
              opacity: speler.huidigTeam ? 1 : 0.3,
            }}
          >
            {speler.huidigTeam ?? "—"}
          </span>

          {speler.indelingTeam ? (
            <span
              style={{
                color: "var(--indeling-text, #ff6b00)",
                border: "1px solid var(--indeling-border, rgba(255,107,0,.4))",
                background: "var(--indeling-bg, rgba(255,107,0,.12))",
                borderRadius: 4,
                padding: "4px 10px",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              {speler.indelingTeam}
            </span>
          ) : (
            <span
              style={{
                color: "rgba(255,255,255,.65)",
                border: "1px solid rgba(255,255,255,.18)",
                borderRadius: 4,
                padding: "4px 10px",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: 11,
                opacity: 0.3,
              }}
            >
              —
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
