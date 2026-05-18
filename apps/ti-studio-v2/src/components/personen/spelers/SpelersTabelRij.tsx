"use client";

import { useRef, useState } from "react";
import type { SpelerStatus } from "@oranje-wit/database";
import type { SpelerRijData } from "@/components/personen/types";
import { SpelerAvatar } from "@/components/speler/primitives/SpelerAvatar";
import { HoverKaart } from "@/components/speler/contexts/HoverKaart";
import { LeeftijdsCel } from "./LeeftijdsCel";
import { StatusCel } from "./StatusCel";
import { GezienCel } from "./GezienCel";
import { IndelingCel } from "./IndelingCel";
import { MemoCel } from "./MemoCel";
import { formatSpelerNaam } from "@/lib/format/speler";

const STATUS_BORDER_MAP: Record<string, string> = {
  BESCHIKBAAR: "var(--status-beschikbaar-outline)",
  NIEUW_POTENTIEEL: "#a3e635",
  NIEUW_DEFINITIEF: "#a3e635",
  TWIJFELT: "#fb923c",
  GEBLESSEERD: "#fb923c",
  GAAT_STOPPEN: "#e11d48",
  GESTOPT: "#e11d48",
  RECREANT: "#e11d48",
  NIET_SPELEND: "#e11d48",
  ALGEMEEN_RESERVE: "#84a98c",
};

const STATUS_CSS_MAP: Record<string, string> = {
  BESCHIKBAAR: "st-beschikbaar",
  TWIJFELT: "st-twijfelt",
  GEBLESSEERD: "st-twijfelt",
  GAAT_STOPPEN: "st-stopt",
  GESTOPT: "st-stopt",
  NIEUW_POTENTIEEL: "st-nieuw",
  NIEUW_DEFINITIEF: "st-nieuw",
  ALGEMEEN_RESERVE: "st-ar",
  RECREANT: "st-stopt",
  NIET_SPELEND: "st-stopt",
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusCss = STATUS_CSS_MAP[speler.status] ?? "";
  const borderKleur = STATUS_BORDER_MAP[speler.status] ?? "var(--status-beschikbaar-outline)";

  const volledigeNaam = formatSpelerNaam(
    {
      roepnaam: speler.roepnaam,
      tussenvoegsel: speler.tussenvoegsel,
      achternaam: speler.achternaam,
    },
    "tabel"
  ) as string;

  const handleMouseEnterNaam = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (naamRef.current) {
        setAnchorRect(naamRef.current.getBoundingClientRect());
      }
      setHoverOpen(true);
    }, 400);
  };

  const handleMouseLeaveNaam = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    closeTimerRef.current = setTimeout(() => setHoverOpen(false), 150);
  };

  const handleMouseEnterCard = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handleMouseLeaveCard = () => {
    setHoverOpen(false);
  };

  return (
    <div
      className={`spelers-tabel-rij ${statusCss}`}
      style={{
        position: "relative",
        background: "transparent",
        borderLeft: `3px solid ${borderKleur}`,
        borderBottom: "1px solid var(--border-light)",
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
      {/* Kolom 1: Foto / Avatar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
        <SpelerAvatar
          relCode={speler.id}
          roepnaam={speler.roepnaam}
          achternaam={speler.achternaam}
          geslacht={speler.geslacht}
          size="sm"
          hasFoto={speler.hasFoto}
          status={speler.status as SpelerStatus}
          isNieuw={speler.isNieuw}
          memoStatus={speler.memoStatus}
          style={{ width: 46, height: 46 }}
        />
      </div>

      {/* Kolom 2: Naam */}
      <div style={{ minWidth: 0 }}>
        <span
          ref={naamRef}
          className="tr-naam"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-1)",
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
          onMouseEnter={handleMouseEnterNaam}
          onMouseLeave={handleMouseLeaveNaam}
          onClick={() => onOpenDialog(speler.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenDialog(speler.id);
          }}
          aria-label={`Bekijk ${volledigeNaam}`}
        >
          {volledigeNaam}
        </span>
      </div>

      {/* Kolom 3: Status */}
      <StatusCel spelerId={speler.id} huidigeStatus={speler.status} />

      {/* Kolom 4: Huidig team */}
      <span
        style={{
          fontSize: 12,
          color: "var(--text-2)",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {speler.huidigTeam ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 3,
              border: "1px solid var(--border-1)",
              color: "var(--text-2)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "default",
            }}
          >
            {speler.huidigTeam}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        )}
      </span>

      {/* Kolom 5: Indeling */}
      <IndelingCel
        spelerId={speler.id}
        versieId={actieveVersieId}
        teamId={speler.indelingTeamId}
        teamNaam={speler.indelingTeamNaam}
        teams={teams}
      />

      {/* Kolom 6: Memo */}
      <MemoCel badge={speler.memoBadge} />

      {/* Kolom 7: Gezien */}
      <GezienCel kadersId={kadersId} spelerId={speler.id} huidigeStatus={speler.gezienStatus} />

      {/* Kolom 8: Leeftijd */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <LeeftijdsCel
          leeftijdscategorie={speler.leeftijdscategorie}
          korfbalLeeftijd={speler.korfbalLeeftijd}
        />
      </div>

      {/* HoverKaart — FIFA-stijl via primitives */}
      <HoverKaart
        speler={{
          relCode: speler.id,
          roepnaam: speler.roepnaam,
          tussenvoegsel: speler.tussenvoegsel,
          achternaam: speler.achternaam,
          geslacht: speler.geslacht,
          leeftijd: speler.leeftijd,
          leeftijdscategorie: speler.leeftijdscategorie,
          status: speler.status,
          isNieuw: speler.isNieuw,
          hasFoto: speler.hasFoto,
          memoStatus: speler.memoStatus,
          huidigTeam: speler.huidigTeam,
          indelingTeam: speler.indelingTeamNaam,
        }}
        anchorRect={anchorRect}
        open={hoverOpen}
        onMouseEnter={handleMouseEnterCard}
        onMouseLeave={handleMouseLeaveCard}
        onClick={() => onOpenDialog(speler.id)}
      />
    </div>
  );
}
