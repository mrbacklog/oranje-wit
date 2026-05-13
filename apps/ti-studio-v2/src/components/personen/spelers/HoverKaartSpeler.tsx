"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SpelerRijData } from "@/components/personen/types";

const CAT_KLEUREN: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GEBLESSEERD: "Geblesseerd",
  GAAT_STOPPEN: "Stopt",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
  ALGEMEEN_RESERVE: "Alg. reserve",
  RECREANT: "Recreant",
  NIET_SPELEND: "Niet spelend",
};

const GEZIEN_KLEUREN: Record<string, string> = {
  ONGEZIEN: "#52525b",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
};

interface HoverKaartSpelerProps {
  speler: SpelerRijData;
  anchorRef: React.RefObject<HTMLElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function HoverKaartSpeler({
  speler,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}: HoverKaartSpelerProps) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const kaartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const kaartBreed = 200;
    const kaartHoog = 300;
    let left = rect.right + 12;
    let top = rect.top - 60;

    // Buiten rechts? Dan links van anchor
    if (left + kaartBreed > window.innerWidth - 12) {
      left = rect.left - kaartBreed - 12;
    }
    // Buiten onder? Omhoog schuiven
    if (top + kaartHoog > window.innerHeight - 12) {
      top = window.innerHeight - kaartHoog - 12;
    }
    if (top < 12) top = 12;

    setPos({ top: top + window.scrollY, left: left + window.scrollX });
  }, [anchorRef]);

  const accentKleur = CAT_KLEUREN[speler.leeftijdscategorie] ?? "#9ca3af";
  const gezienKleur = GEZIEN_KLEUREN[speler.gezienStatus] ?? "#52525b";

  return createPortal(
    <div
      ref={kaartRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 200,
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(160deg, #1a1a1e 0%, #0c0c0f 55%, #121216 100%)",
        border: `2px solid ${accentKleur}44`,
        boxShadow: `0 8px 32px rgba(0,0,0,.7), 0 0 20px ${accentKleur}22`,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: `1px solid ${accentKleur}22`,
          background: `linear-gradient(180deg, ${accentKleur}1a 0%, transparent 100%)`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Links: status + memo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
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
              border: `1px solid rgba(255,255,255,.3)`,
              color: "#f5f5f7",
              background: "rgba(255,255,255,.07)",
              whiteSpace: "nowrap",
            }}
          >
            {STATUS_LABELS[speler.status] ?? speler.status}
          </span>
          {speler.heeftOpenMemo && <span style={{ color: "#eab308", fontSize: 10 }}>▲ memo</span>}
        </div>

        {/* Rechts: leeftijd */}
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
              fontSize: 36,
              fontWeight: 900,
              lineHeight: 1,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 20px ${accentKleur}`,
            }}
          >
            {speler.korfbalLeeftijd.split(".")[0]}
          </span>
          {speler.korfbalLeeftijd.includes(".") && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "rgba(255,255,255,.7)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              .{speler.korfbalLeeftijd.split(".")[1]}
            </span>
          )}
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: "rgba(255,255,255,.35)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            jr
          </span>
        </div>
      </div>

      {/* Foto-placeholder met naam */}
      <div
        style={{
          position: "relative",
          flex: 1,
          height: 160,
          background: `linear-gradient(180deg, ${accentKleur}18 0%, #0a0a0c 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Initialen als avatar placeholder */}
        <span
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: `${accentKleur}33`,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            userSelect: "none",
          }}
        >
          {speler.roepnaam[0]}
        </span>

        {/* Naam overlay onderaan */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 12px 6px",
            background: "linear-gradient(transparent, rgba(8,8,12,.95))",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#fff",
              lineHeight: 1,
              textShadow: "0 2px 8px rgba(0,0,0,.9)",
            }}
          >
            {speler.roepnaam}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>
            {speler.achternaam}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "8px 12px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          borderTop: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.04)",
        }}
      >
        {/* Huidig team */}
        <span
          style={{
            color: "rgba(255,255,255,.6)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 4,
            padding: "3px 8px",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: 10,
            whiteSpace: "nowrap",
            opacity: speler.huidigTeam ? 1 : 0.3,
          }}
        >
          {speler.huidigTeam ?? "—"}
        </span>

        {/* Gezien stip */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: "var(--text-3)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: gezienKleur,
              display: "block",
              flexShrink: 0,
            }}
          />
          {speler.gezienStatus}
        </span>

        {/* Indeling */}
        {speler.indelingTeamNaam && (
          <span
            style={{
              color: "#4ade80",
              border: "1px solid rgba(34,197,94,.3)",
              background: "rgba(34,197,94,.08)",
              borderRadius: 4,
              padding: "3px 8px",
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: 10,
              whiteSpace: "nowrap",
            }}
          >
            {speler.indelingTeamNaam}
          </span>
        )}
      </div>
    </div>,
    document.body
  );
}
