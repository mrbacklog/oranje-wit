"use client";

import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";
import type { LeeftijdCategorie } from "@/components/speler/primitives";
import { SpelerAvatar } from "@/components/speler/primitives/SpelerAvatar";
import { LeeftijdKolom } from "@/components/speler/primitives/LeeftijdKolom";
import { TeamBadge } from "@/components/speler/primitives/TeamBadge";
import { formatSpelerNaam } from "@/lib/format/speler";

// ── Status-chip kleuren ───────────────────────────────────────────────────────

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

const STATUS_KLEUR: Record<string, { bg: string; border: string; text: string }> = {
  BESCHIKBAAR: {
    bg: "rgba(16,185,129,.15)",
    border: "rgba(16,185,129,.4)",
    text: "var(--status-beschikbaar, #10b981)",
  },
  TWIJFELT: {
    bg: "rgba(245,158,11,.12)",
    border: "rgba(245,158,11,.4)",
    text: "var(--status-twijfelt, #f59e0b)",
  },
  GEBLESSEERD: {
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.4)",
    text: "var(--val-err, #ef4444)",
  },
  GAAT_STOPPEN: {
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.4)",
    text: "var(--val-err, #ef4444)",
  },
  GESTOPT: {
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.4)",
    text: "var(--val-err, #ef4444)",
  },
  NIEUW_POTENTIEEL: {
    bg: "rgba(255,107,0,.1)",
    border: "rgba(255,107,0,.35)",
    text: "var(--ow-accent, #ff6b00)",
  },
  NIEUW_DEFINITIEF: {
    bg: "rgba(255,107,0,.1)",
    border: "rgba(255,107,0,.35)",
    text: "var(--ow-accent, #ff6b00)",
  },
  ALGEMEEN_RESERVE: {
    bg: "rgba(132,169,140,.1)",
    border: "rgba(132,169,140,.35)",
    text: "#84a98c",
  },
};

function statusStijl(status: string) {
  return (
    STATUS_KLEUR[status] ?? {
      bg: "rgba(255,255,255,.06)",
      border: "rgba(255,255,255,.2)",
      text: "var(--text-secondary)",
    }
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface HeroHeaderSpeler {
  relCode: string;
  roepnaam: string;
  tussenvoegsel?: string | null;
  achternaam: string;
  geslacht: "M" | "V";
  leeftijd: number;
  leeftijdscategorie: LeeftijdCategorie;
  status: SpelerStatus;
  isNieuw: boolean;
  hasFoto: boolean;
  memoStatus?: WerkitemStatus | null;
  huidigTeam?: string | null;
  indelingTeam?: string | null;
}

interface HeroHeaderProps {
  speler: HeroHeaderSpeler;
  onStatusClick?: () => void;
  onTeamClick?: () => void;
  onIndelingClick?: () => void;
  onMemoClick?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroHeader({
  speler,
  onStatusClick,
  onTeamClick,
  onIndelingClick,
  onMemoClick,
}: HeroHeaderProps) {
  const naam = formatSpelerNaam(speler, "hero") as { hoofd: string; sub: string };
  const stijl = statusStijl(speler.status);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        minHeight: 200,
        borderBottom: "1px solid var(--border-light)",
        flexShrink: 0,
      }}
    >
      {/* Hero content (links + midden) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 24,
          padding: "24px 28px",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Avatar 96px (size="hero") met sexe-L, status-outline, memo-corner, sparkle */}
        <SpelerAvatar
          relCode={speler.relCode}
          roepnaam={speler.roepnaam}
          achternaam={speler.achternaam}
          geslacht={speler.geslacht}
          size="hero"
          hasFoto={speler.hasFoto}
          status={speler.status}
          isNieuw={speler.isNieuw}
          memoStatus={speler.memoStatus}
          onMemoClick={onMemoClick ? () => onMemoClick() : undefined}
          style={{ borderRadius: 8, flexShrink: 0 }}
        />

        {/* Naam + meta */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {/* Naam: hoofd (roepnaam) groot, sub (tussenvoegsel+achternaam) gedempt */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {naam.hoofd}{" "}
            {naam.sub && (
              <span
                style={{
                  color: "var(--text-tertiary, rgba(255,255,255,.35))",
                  fontWeight: 600,
                }}
              >
                {naam.sub}
              </span>
            )}
          </div>

          {/* Status-chip — klikbaar (fase 3 wires de actie aan) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 4,
              fontSize: 11,
            }}
          >
            <button
              onClick={onStatusClick}
              aria-label={`Status: ${STATUS_LABELS[speler.status] ?? speler.status}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px 3px 10px",
                borderRadius: 999,
                background: stijl.bg,
                color: stijl.text,
                border: `1px solid ${stijl.border}`,
                fontWeight: 700,
                fontSize: 11,
                cursor: onStatusClick ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >
              {/* Kleur-dot */}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: stijl.text,
                  flexShrink: 0,
                }}
              />
              {STATUS_LABELS[speler.status] ?? speler.status}
              {/* Chevron als klikbaar */}
              {onStatusClick && (
                <span style={{ fontSize: 10, opacity: 0.75, marginLeft: 2 }}>▾</span>
              )}
            </button>
          </div>

          {/* Team-badges via TeamBadge primitives */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Huidig
            </span>
            <TeamBadge variant="huidig" naam={speler.huidigTeam ?? "—"} onClick={onTeamClick} />

            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginLeft: 8,
              }}
            >
              Indeling
            </span>
            {speler.indelingTeam ? (
              <TeamBadge variant="indeling" naam={speler.indelingTeam} onClick={onIndelingClick} />
            ) : (
              <TeamBadge variant="leeg" onClick={onIndelingClick} />
            )}
          </div>
        </div>
      </div>

      {/* Leeftijdkolom rechts — volledige hoogte, volgt dialog top-right radius */}
      {/* Wrapper past border-radius toe en stretcht de hoogte; breedte komt van LeeftijdKolom zelf */}
      <div
        style={{
          alignSelf: "stretch",
          borderRadius: "0 14px 0 0",
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
        }}
      >
        <LeeftijdKolom
          leeftijd={speler.leeftijd}
          category={speler.leeftijdscategorie}
          size="hero"
        />
      </div>
    </div>
  );
}
