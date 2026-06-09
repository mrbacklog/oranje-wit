"use client";
/**
 * Kolom-layout subcomponenten voor TeamPresentatieKaart.
 * Gesplitst om de max-lines limiet te respecteren.
 */
import type { PresentatieSpeler, PresentatieLidTeam } from "../presentatie-types";
import { KNKV_KLEUR } from "./knkv-kleur";
import { SpelerPresentatieRij } from "./SpelerPresentatieRij";

// ── Helpers ─────────────────────────────────────────────────────────────────

export function gesorteerd(spelers: PresentatieSpeler[]): PresentatieSpeler[] {
  return [...spelers].sort((a, b) => a.roepnaam.localeCompare(b.roepnaam, "nl"));
}

// ── Kolom-header ─────────────────────────────────────────────────────────────

export function KolomHeader({ label, kleur }: { label: string; kleur: "V" | "M" }) {
  const kleurCss = kleur === "V" ? "rgba(236,72,153,.65)" : "rgba(96,165,250,.65)";
  return (
    <div
      style={{
        fontSize: 8,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".6px",
        color: kleurCss,
        padding: "4px 8px 3px",
        borderBottom: "1px solid rgba(255,255,255,.04)",
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

// ── Speler-kolom ─────────────────────────────────────────────────────────────

export function SpelerKolom({
  spelers,
  geslacht,
  label,
  peildatum,
  borderRight = false,
}: {
  spelers: PresentatieSpeler[];
  geslacht: "V" | "M";
  label: string;
  peildatum: Date;
  borderRight?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderRight: borderRight ? "1px solid var(--border-0)" : "none",
      }}
    >
      <KolomHeader label={label} kleur={geslacht} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {gesorteerd(spelers).map((sp) => (
          <SpelerPresentatieRij key={sp.relCode} speler={sp} peildatum={peildatum} />
        ))}
      </div>
    </div>
  );
}

// ── ViertalLayout ─────────────────────────────────────────────────────────────

export function ViertalLayout({
  dames,
  heren,
  peildatum,
}: {
  dames: PresentatieSpeler[];
  heren: PresentatieSpeler[];
  peildatum: Date;
}) {
  const alle = [...gesorteerd(dames), ...gesorteerd(heren)];
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {alle.map((sp) => (
        <SpelerPresentatieRij key={sp.relCode} speler={sp} peildatum={peildatum} />
      ))}
    </div>
  );
}

// ── TweeKolommenLayout ────────────────────────────────────────────────────────

export function TweeKolommenLayout({
  dames,
  heren,
  peildatum,
}: {
  dames: PresentatieSpeler[];
  heren: PresentatieSpeler[];
  peildatum: Date;
}) {
  return (
    <div style={{ display: "flex" }}>
      <SpelerKolom spelers={dames} geslacht="V" label="Dames" peildatum={peildatum} borderRight />
      <SpelerKolom spelers={heren} geslacht="M" label="Heren" peildatum={peildatum} />
    </div>
  );
}

// ── OngecombineerdLayout ──────────────────────────────────────────────────────

export function OngecombineerdLayout({
  leden,
  peildatum,
}: {
  leden: PresentatieLidTeam[];
  peildatum: Date;
}) {
  if (leden.length === 0) {
    return (
      <div
        style={{
          padding: "18px 16px",
          color: "var(--text-3)",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        Geen lidteams
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
      {leden.map((lid, idx) => {
        const lidKleurCss = KNKV_KLEUR[lid.kleur ?? ""] ?? "var(--cat-senior)";
        const isLaatste = idx === leden.length - 1;
        return (
          <div
            key={lid.teamId}
            style={{
              flex: "1 1 260px",
              minWidth: 220,
              borderRight: isLaatste ? "none" : "1px solid var(--border-0)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Teamnaam-kopje met kleurband */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px 4px 10px",
                borderBottom: "1px solid var(--border-0)",
                background: "rgba(255,255,255,.03)",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: lidKleurCss,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  paddingLeft: 6,
                }}
              >
                {lid.naam}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(236,72,153,.65)",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                ♀ {lid.dames.length}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(96,165,250,.65)",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                ♂ {lid.heren.length}
              </span>
            </div>
            {/* Dames | Heren per lidteam */}
            <div style={{ display: "flex", flex: 1 }}>
              <SpelerKolom
                spelers={lid.dames}
                geslacht="V"
                label="Dames"
                peildatum={peildatum}
                borderRight
              />
              <SpelerKolom spelers={lid.heren} geslacht="M" label="Heren" peildatum={peildatum} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
