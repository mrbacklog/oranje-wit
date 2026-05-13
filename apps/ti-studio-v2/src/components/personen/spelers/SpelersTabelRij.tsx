"use client";

import { useRef, useState } from "react";
import type { SpelerRijData } from "@/components/personen/types";
import { LeeftijdsCel } from "./LeeftijdsCel";
import { StatusCel } from "./StatusCel";
import { GezienCel } from "./GezienCel";
import { IndelingCel } from "./IndelingCel";
import { MemoCel } from "./MemoCel";
import { HoverKaartSpeler } from "./HoverKaartSpeler";

const STATUS_CSS_MAP: Record<string, string> = {
  BESCHIKBAAR: "",
  TWIJFELT: "st-twijfelt",
  GAAT_STOPPEN: "st-stopt",
  GEBLESSEERD: "st-geblesseerd",
  NIEUW_POTENTIEEL: "st-nieuw",
  NIEUW_DEFINITIEF: "st-nieuw",
  ALGEMEEN_RESERVE: "st-ar",
  RECREANT: "",
  NIET_SPELEND: "",
};

interface SpelersTabelRijProps {
  speler: SpelerRijData;
  actieveVersieId: string;
  kadersId: string;
  teams: Array<{ id: string; naam: string; kleur: string | null }>;
  onOpenDialog: (spelerId: string) => void;
}

export function SpelersTabelRij({
  speler,
  actieveVersieId,
  kadersId,
  teams,
  onOpenDialog,
}: SpelersTabelRijProps) {
  const naamRef = useRef<HTMLSpanElement>(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusCss = STATUS_CSS_MAP[speler.status] ?? "";

  const handleMouseEnterNaam = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoverOpen(true), 300);
  };

  const handleMouseLeaveNaam = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    closeTimerRef.current = setTimeout(() => setHoverOpen(false), 150);
  };

  const handleMouseEnterCard = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handleMouseLeaveCard = () => {
    closeTimerRef.current = setTimeout(() => setHoverOpen(false), 150);
  };

  const initials = `${speler.roepnaam[0] ?? ""}${speler.achternaam[0] ?? ""}`.toUpperCase();
  const geslachtCss = speler.geslacht === "V" ? "vrouw" : "";
  const isStopt = speler.status === "GAAT_STOPPEN";

  return (
    <div
      className={`spelers-tabel-rij ${statusCss}`}
      style={{
        position: "relative",
        background: "transparent",
        borderLeft: `3px solid var(--status-color, var(--status-beschikbaar-outline))`,
        borderBottom: "1px solid var(--border-0)",
        overflow: "visible",
        transition: "background 100ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.02)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* REL-code kolom */}
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={speler.id}
      >
        {speler.id.startsWith("OW-") ? "—" : speler.id}
      </span>

      {/* Naam + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {/* Avatar */}
        <div className={`sq-av ${geslachtCss}`} style={{ width: 36, height: 36, flexShrink: 0 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-2)",
              background: "var(--surface-card)",
              borderRadius: 4,
            }}
          >
            {initials}
          </div>
        </div>

        {/* Naam */}
        <div style={{ minWidth: 0 }}>
          <span
            ref={naamRef}
            className="nm"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-1)",
              cursor: "pointer",
              textDecoration: isStopt ? "line-through" : "none",
              opacity: speler.status === "ALGEMEEN_RESERVE" ? 0.7 : 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            onMouseEnter={handleMouseEnterNaam}
            onMouseLeave={handleMouseLeaveNaam}
            onClick={() => onOpenDialog(speler.id)}
          >
            {speler.roepnaam} {speler.achternaam}
          </span>
        </div>
      </div>

      {/* Huidig team */}
      <span
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {speler.huidigTeam ?? "—"}
      </span>

      {/* Leeftijdscel */}
      <LeeftijdsCel
        leeftijdscategorie={speler.leeftijdscategorie}
        korfbalLeeftijd={speler.korfbalLeeftijd}
      />

      {/* Indelingcel */}
      <IndelingCel
        spelerId={speler.id}
        versieId={actieveVersieId}
        teamId={speler.indelingTeamId}
        teamNaam={speler.indelingTeamNaam}
        teams={teams}
      />

      {/* Statuscel */}
      <StatusCel spelerId={speler.id} huidigeStatus={speler.status} />

      {/* Memocel */}
      <MemoCel badge={speler.memoBadge} />

      {/* Gezien */}
      <GezienCel kadersId={kadersId} spelerId={speler.id} huidigeStatus={speler.gezienStatus} />

      {/* Actie */}
      <button
        onClick={() => onOpenDialog(speler.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-3)",
          padding: "4px 6px",
          borderRadius: "var(--radius-sm)",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
        }}
        aria-label={`Bekijk ${speler.roepnaam} ${speler.achternaam}`}
        title="Openen"
      >
        ⋯
      </button>

      {/* HoverKaart */}
      {hoverOpen && (
        <HoverKaartSpeler
          speler={speler}
          anchorRef={naamRef}
          onMouseEnter={handleMouseEnterCard}
          onMouseLeave={handleMouseLeaveCard}
        />
      )}
    </div>
  );
}
