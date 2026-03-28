"use client";

import {
  PijlerPill,
  MiniSpelersKaart,
  StatsRij,
  TipCard,
  FlashBadge,
  KernOnderscheidend,
} from "./leeftijdsgroep-helpers";
import type { LeeftijdsgroepData } from "./leeftijdsgroep-helpers";

// Re-export types zodat sectie-leeftijdsgroepen.tsx ze kan importeren
export type {
  LeeftijdsgroepData,
  Pijler,
  PijlerGroep,
  MiniKaartBar,
  Tip,
} from "./leeftijdsgroep-helpers";

// ---------------------------------------------------------------------------
// Leeftijdsgroep kaart
// ---------------------------------------------------------------------------

export function LeeftijdsgroepKaart({ groep }: { groep: LeeftijdsgroepData }) {
  return (
    <div
      style={{
        borderLeft: `4px solid var(${groep.kleurVar})`,
        borderRadius: "12px",
        backgroundColor: "var(--surface-card)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: `var(${groep.kleurVar})`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
          {groep.naam}
        </span>
        <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>
          {groep.leeftijd}
        </span>
        {groep.badge && <FlashBadge tekst={groep.badge} kleurVar={groep.kleurVar} />}
      </div>
      {/* Stats */}
      <StatsRij
        items={groep.items}
        schaal={groep.schaal}
        beoordelaar={groep.beoordelaar}
        kleurVar={groep.kleurVar}
      />
      {/* Pijler-groepen (indien gegroepeerd) */}
      {groep.pijlerGroepen && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
          {groep.pijlerGroepen.map((pg) => (
            <div key={pg.label}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                {pg.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {pg.pijlers.map((p) => (
                  <PijlerPill
                    key={p.naam}
                    naam={p.naam}
                    kleurVar={groep.kleurVar}
                    nieuw={p.nieuw}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Pijler-pills (indien flat) */}
      {groep.pijlers && groep.pijlers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
          {groep.pijlers.map((p) => (
            <PijlerPill key={p.naam} naam={p.naam} kleurVar={groep.kleurVar} nieuw={p.nieuw} />
          ))}
        </div>
      )}
      {/* Kern / Onderscheidend */}
      {groep.kernOnderscheidend && (
        <KernOnderscheidend
          kern={groep.kernOnderscheidend.kern}
          onderscheidend={groep.kernOnderscheidend.onderscheidend}
          kleurVar={groep.kleurVar}
        />
      )}
      {/* Mini spelerskaart */}
      {groep.miniKaart && <MiniSpelersKaart bars={groep.miniKaart} kleurVar={groep.kleurVar} />}
      {/* Fun fact */}
      {groep.funFact && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: `color-mix(in srgb, var(${groep.kleurVar}) 8%, var(--surface-sunken))`,
            border: `1px solid color-mix(in srgb, var(${groep.kleurVar}) 20%, transparent)`,
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 700, color: `var(${groep.kleurVar})`, marginRight: "6px" }}>
            Fun fact:
          </span>
          {groep.funFact}
        </div>
      )}
      {/* Extra info */}
      {groep.extraInfo && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: `color-mix(in srgb, var(${groep.kleurVar}) 8%, var(--surface-sunken))`,
            border: `1px solid color-mix(in srgb, var(${groep.kleurVar}) 20%, transparent)`,
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {groep.extraInfo}
        </div>
      )}
      {/* Tips */}
      {groep.tips && groep.tips.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          {groep.tips.map((t) => (
            <TipCard key={t.label} tip={t} />
          ))}
        </div>
      )}
    </div>
  );
}
