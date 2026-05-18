"use client";

import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";
import { SpelerAvatar } from "../primitives/SpelerAvatar";
import { LeeftijdKolom } from "../primitives/LeeftijdKolom";
import { TeamBadge } from "../primitives/TeamBadge";
import { formatSpelerNaam, leeftijdscategorie } from "@/lib/format/speler";

// ── Status-mapping ─────────────────────────────────────────────────────────

function statusKleur(status: SpelerStatus | string): string {
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

function statusKlasse(status: SpelerStatus | string): string {
  switch (status) {
    case "NIEUW_POTENTIEEL":
    case "NIEUW_DEFINITIEF":
      return "st-nieuw";
    case "TWIJFELT":
    case "GEBLESSEERD":
      return "st-twijfelt";
    case "GAAT_STOPPEN":
    case "GESTOPT":
    case "RECREANT":
    case "NIET_SPELEND":
      return "st-stopt";
    case "ALGEMEEN_RESERVE":
      return "st-ar";
    default:
      return "st-beschikbaar";
  }
}

function isNietDraggable(status: SpelerStatus | string): boolean {
  return status === "ALGEMEEN_RESERVE";
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface RijkeRijProps {
  speler: {
    relCode: string;
    roepnaam: string;
    tussenvoegsel?: string | null;
    achternaam: string;
    geslacht: "M" | "V";
    leeftijd: number;
    status: SpelerStatus | string;
    isNieuw: boolean;
    hasFoto: boolean;
    memoStatus?: WerkitemStatus | null;
    huidigTeam?: string | null;
    indelingTeam?: string | null;
  };
  variant?: "pool" | "team-kaart";
  draggable?: boolean;
  onClick?: () => void;
  onMemoClick?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RijkeRij({
  speler,
  variant = "pool",
  draggable = false,
  onClick,
  onMemoClick,
}: RijkeRijProps) {
  const naam = formatSpelerNaam(speler, "rijk") as string;
  const stKleur = statusKleur(speler.status);
  const stKlasse = statusKlasse(speler.status);
  const isStopt =
    speler.status === "GAAT_STOPPEN" ||
    speler.status === "GESTOPT" ||
    speler.status === "RECREANT" ||
    speler.status === "NIET_SPELEND";
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const effectiefDraggable = draggable && !isNietDraggable(speler.status);
  const jaren = Math.floor(speler.leeftijd);
  const categorie = leeftijdscategorie(jaren);

  // Hoogte + padding per variant
  const hoogte = variant === "team-kaart" ? 52 : 54;
  const avatarBreedte = variant === "team-kaart" ? 40 : 44;

  return (
    <div
      className={`rijke-rij ${stKlasse}${variant === "team-kaart" ? "tk-rijke-rij" : ""}`}
      style={
        {
          "--status-color": stKleur,
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 0,
          height: hoogte,
          background: "transparent",
          border: `1.5px solid ${stKleur}`,
          borderRadius: 6,
          overflow: "hidden",
          flexShrink: 0,
          cursor: onClick ? (draggable ? "grab" : "pointer") : "default",
        } as React.CSSProperties
      }
      draggable={effectiefDraggable}
      onClick={onClick}
      title={naam}
    >
      {/* Avatar — vierkant links, volledige hoogte */}
      <div
        style={{
          width: avatarBreedte,
          height: hoogte,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <SpelerAvatar
          relCode={speler.relCode}
          roepnaam={speler.roepnaam}
          achternaam={speler.achternaam}
          geslacht={speler.geslacht}
          size="lg"
          hasFoto={speler.hasFoto}
          status={speler.status as SpelerStatus}
          isNieuw={speler.isNieuw}
          memoStatus={speler.memoStatus}
          className={onMemoClick ? "memo-klikbaar" : undefined}
          style={{
            width: avatarBreedte,
            height: hoogte,
            borderRadius: "4px 0 0 4px",
          }}
        />
        {/* Klik op memo-corner — apart afvangen */}
        {onMemoClick && speler.memoStatus && speler.memoStatus !== "GEARCHIVEERD" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 22,
              height: 22,
              zIndex: 20,
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMemoClick();
            }}
            aria-label="Open memo"
          />
        )}
      </div>

      {/* Naam + team-badges */}
      <div
        className="col"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
          padding: "0 6px",
        }}
      >
        <span
          className="nm"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isAR ? "#a8a8ad" : "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: isStopt ? "line-through" : undefined,
            opacity: isStopt ? 0.7 : 1,
          }}
        >
          {naam}
        </span>
        <div
          className="row2"
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8 }}
        >
          <TeamBadge variant="huidig" naam={speler.huidigTeam ?? undefined} />
          {speler.indelingTeam ? (
            <TeamBadge variant="indeling" naam={speler.indelingTeam} />
          ) : (
            <TeamBadge variant="leeg" />
          )}
        </div>
      </div>

      {/* Leeftijdkolom rechts */}
      <LeeftijdKolom leeftijd={speler.leeftijd} category={categorie} size="rijk" />
    </div>
  );
}
