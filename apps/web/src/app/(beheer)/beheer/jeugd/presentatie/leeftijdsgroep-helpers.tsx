"use client";

import React from "react";

// ---------------------------------------------------------------------------
// Types (gedeeld met sectie-leeftijdsgroepen.tsx en leeftijdsgroep-kaart.tsx)
// ---------------------------------------------------------------------------

export interface Pijler {
  naam: string;
  nieuw?: boolean;
}

export interface PijlerGroep {
  label: string;
  pijlers: Pijler[];
}

export interface MiniKaartBar {
  label: string;
  waarde: number; // 0-100
  weergave?: string; // bijv. "4.2 ★"
}

export interface Tip {
  label: string;
  tekst: string;
}

export interface LeeftijdsgroepData {
  kleurVar: string;
  naam: string;
  leeftijd: string;
  items: number;
  schaal: string;
  beoordelaar: string;
  pijlerGroepen?: PijlerGroep[];
  pijlers?: Pijler[];
  miniKaart?: MiniKaartBar[];
  tips?: Tip[];
  funFact?: string;
  badge?: string;
  extraInfo?: string;
  kernOnderscheidend?: { kern: number; onderscheidend: number };
}

// ---------------------------------------------------------------------------
// Sub-componenten
// ---------------------------------------------------------------------------

/** Gekleurde pill voor een pijler */
export function PijlerPill({
  naam,
  kleurVar,
  nieuw,
}: {
  naam: string;
  kleurVar: string;
  nieuw?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: `var(${kleurVar})`,
        backgroundColor: `color-mix(in srgb, var(${kleurVar}) 12%, transparent)`,
        border: `1px solid color-mix(in srgb, var(${kleurVar}) 25%, transparent)`,
      }}
    >
      {naam}
      {nieuw && (
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: "4px",
            backgroundColor: `var(${kleurVar})`,
            color: "var(--surface-page)",
            lineHeight: 1.4,
          }}
        >
          NIEUW
        </span>
      )}
    </span>
  );
}

/** Mini-spelerskaart: horizontale bars */
export function MiniSpelersKaart({ bars, kleurVar }: { bars: MiniKaartBar[]; kleurVar: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface-sunken)",
        borderRadius: "12px",
        padding: "16px",
        marginTop: "12px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-tertiary)",
          letterSpacing: "0.06em",
          marginBottom: "10px",
          textTransform: "uppercase",
        }}
      >
        Mini Spelerskaart
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {bars.map((bar) => (
          <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "80px",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {bar.label}
            </span>
            <div
              style={{
                flex: 1,
                height: "8px",
                borderRadius: "4px",
                backgroundColor: `color-mix(in srgb, var(${kleurVar}) 15%, transparent)`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${bar.waarde}%`,
                  height: "100%",
                  borderRadius: "4px",
                  backgroundColor: `var(${kleurVar})`,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            {bar.weergave && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: `var(${kleurVar})`,
                  width: "44px",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {bar.weergave}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stats-rij: items / schaal / beoordelaar */
export function StatsRij({
  items,
  schaal,
  beoordelaar,
  kleurVar,
}: {
  items: number;
  schaal: string;
  beoordelaar: string;
  kleurVar: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1px",
        borderRadius: "8px",
        overflow: "hidden",
        marginTop: "12px",
      }}
    >
      {[
        { label: "Items", waarde: String(items) },
        { label: "Schaal", waarde: schaal },
        { label: "Door", waarde: beoordelaar },
      ].map((stat) => (
        <div
          key={stat.label}
          style={{
            flex: 1,
            padding: "10px 12px",
            backgroundColor: "var(--surface-raised)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-tertiary)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}
          >
            {stat.label}
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: `var(${kleurVar})` }}>
            {stat.waarde}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tip sub-card */
export function TipCard({ tip }: { tip: Tip }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        backgroundColor: "var(--surface-sunken)",
        borderLeft: "3px solid var(--text-tertiary)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--text-tertiary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "2px",
        }}
      >
        {tip.label}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {tip.tekst}
      </div>
    </div>
  );
}

/** Flash badge (bijv. "NIEUWE KAART") */
export function FlashBadge({ tekst, kleurVar }: { tekst: string; kleurVar: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "6px",
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: "var(--surface-page)",
        backgroundColor: `var(${kleurVar})`,
        animation: "pulse 2s infinite",
      }}
    >
      {tekst}
    </span>
  );
}

/** Kern / Onderscheidend visueel */
export function KernOnderscheidend({
  kern,
  onderscheidend,
  kleurVar,
}: {
  kern: number;
  onderscheidend: number;
  kleurVar: string;
}) {
  const totaal = kern + onderscheidend;
  const kernPct = (kern / totaal) * 100;
  return (
    <div style={{ marginTop: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          fontWeight: 600,
          marginBottom: "6px",
        }}
      >
        <span style={{ color: `var(${kleurVar})` }}>KERN ~{kern} items</span>
        <span style={{ color: "var(--text-tertiary)" }}>
          ONDERSCHEIDEND ~{onderscheidend} items
        </span>
      </div>
      <div
        style={{
          height: "10px",
          borderRadius: "5px",
          overflow: "hidden",
          display: "flex",
          backgroundColor: `color-mix(in srgb, var(${kleurVar}) 15%, transparent)`,
        }}
      >
        <div
          style={{
            width: `${kernPct}%`,
            backgroundColor: `var(${kleurVar})`,
            borderRadius: "5px 0 0 5px",
          }}
        />
        <div
          style={{
            width: `${100 - kernPct}%`,
            backgroundColor: `color-mix(in srgb, var(${kleurVar}) 35%, transparent)`,
            borderRadius: "0 5px 5px 0",
          }}
        />
      </div>
    </div>
  );
}
