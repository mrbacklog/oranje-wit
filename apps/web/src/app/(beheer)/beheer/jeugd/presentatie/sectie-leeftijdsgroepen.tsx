"use client";

import React from "react";
import { LeeftijdsgroepKaart } from "./leeftijdsgroep-kaart";
import type { LeeftijdsgroepData } from "./leeftijdsgroep-kaart";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const GROEPEN: LeeftijdsgroepData[] = [
  {
    kleurVar: "--knkv-paars-500",
    naam: "Paars",
    leeftijd: "4-5 jaar",
    items: 3,
    schaal: "Geobserveerd",
    beoordelaar: "Trainer",
    tips: [
      {
        label: "Belangrijk",
        tekst:
          "Geen beoordeling, geen formulier. Alleen observeren of het kind plezier heeft, meedoet en veilig beweegt.",
      },
    ],
  },
  {
    kleurVar: "--knkv-blauw-500",
    naam: "Blauw",
    leeftijd: "5-7 jaar",
    items: 11,
    schaal: "Ja / Nog niet",
    beoordelaar: "Trainer",
    pijlers: [
      { naam: "BAL" },
      { naam: "BEWEGEN" },
      { naam: "SPEL" },
      { naam: "SAMEN" },
      { naam: "IK" },
    ],
    miniKaart: [
      { label: "BAL", waarde: 100 },
      { label: "BEWEGEN", waarde: 75 },
      { label: "SPEL", waarde: 50 },
      { label: "SAMEN", waarde: 100 },
      { label: "IK", waarde: 100 },
    ],
    tips: [
      {
        label: "Trainer",
        tekst: "Vul in na de training. Kijk of het kind het probeert, niet of het perfect is.",
      },
      { label: "Ouders", tekst: "Vraag niet 'Heb je gewonnen?' maar 'Wat heb je geleerd?'" },
    ],
  },
  {
    kleurVar: "--knkv-groen-500",
    naam: "Groen",
    leeftijd: "8-9 jaar",
    items: 15,
    schaal: "Goed / Oke / Nog niet",
    beoordelaar: "Trainer",
    pijlers: [
      { naam: "BAL" },
      { naam: "BEWEGEN" },
      { naam: "SPEL" },
      { naam: "SAMEN" },
      { naam: "IK" },
    ],
    funFact: "34% nieuwe leden start hier. Retentie: 93-95%.",
  },
  {
    kleurVar: "--knkv-geel-500",
    naam: "Geel",
    leeftijd: "10-12 jaar",
    items: 25,
    schaal: "1-5 sterren",
    beoordelaar: "Trainer + Coach",
    badge: "NIEUWE KAART",
    pijlerGroepen: [
      { label: "Korfbalacties", pijlers: [{ naam: "AANVALLEN" }, { naam: "VERDEDIGEN" }] },
      {
        label: "Spelerskwaliteiten",
        pijlers: [
          { naam: "TECHNIEK" },
          { naam: "TACTIEK" },
          { naam: "MENTAAL" },
          { naam: "FYSIEK" },
        ],
      },
    ],
    miniKaart: [
      { label: "AANVALLEN", waarde: 80, weergave: "4.0 \u2605" },
      { label: "VERDEDIGEN", waarde: 60, weergave: "3.0 \u2605" },
      { label: "TECHNIEK", waarde: 70, weergave: "3.5 \u2605" },
      { label: "TACTIEK", waarde: 50, weergave: "2.5 \u2605" },
      { label: "MENTAAL", waarde: 90, weergave: "4.5 \u2605" },
      { label: "FYSIEK", waarde: 60, weergave: "3.0 \u2605" },
    ],
  },
  {
    kleurVar: "--knkv-oranje-500",
    naam: "Oranje",
    leeftijd: "13-15 jaar",
    items: 40,
    schaal: "Slider 1-10",
    beoordelaar: "Coach + Speler",
    pijlerGroepen: [
      { label: "Korfbalacties", pijlers: [{ naam: "AANVALLEN" }, { naam: "VERDEDIGEN" }] },
      {
        label: "Spelerskwaliteiten",
        pijlers: [
          { naam: "TECHNIEK" },
          { naam: "TACTIEK" },
          { naam: "MENTAAL" },
          { naam: "FYSIEK" },
        ],
      },
      { label: "Persoonlijke groei", pijlers: [{ naam: "SOCIAAL", nieuw: true }] },
    ],
    extraInfo:
      "Biologische rijping speelt een grote rol. De kaart houdt rekening met vroeg- en laatrijpers via het fysieke profiel.",
  },
  {
    kleurVar: "--knkv-rood-500",
    naam: "Rood",
    leeftijd: "16-18 jaar",
    items: 60,
    schaal: "Slider 1-10",
    beoordelaar: "Coach + Speler + Scout",
    pijlerGroepen: [
      { label: "Korfbalacties", pijlers: [{ naam: "AANVALLEN" }, { naam: "VERDEDIGEN" }] },
      {
        label: "Spelerskwaliteiten",
        pijlers: [
          { naam: "TECHNIEK" },
          { naam: "TACTIEK" },
          { naam: "MENTAAL" },
          { naam: "FYSIEK" },
        ],
      },
      { label: "Persoonlijke groei", pijlers: [{ naam: "SOCIAAL" }] },
      {
        label: "Wedstrijdprofiel",
        pijlers: [
          { naam: "SCOREN", nieuw: true },
          { naam: "SPELINTELLIGENTIE", nieuw: true },
        ],
      },
    ],
    kernOnderscheidend: { kern: 41, onderscheidend: 19 },
  },
];

// ---------------------------------------------------------------------------
// Samenvattingstabel-data
// ---------------------------------------------------------------------------

const SAMENVATTING_RIJEN: { label: string; waarden: string[] }[] = [
  { label: "Leeftijd", waarden: ["4-5", "5-7", "8-9", "10-12", "13-15", "16-18"] },
  { label: "Pijlers", waarden: ["0", "5", "5", "6", "7", "9"] },
  { label: "Items", waarden: ["3", "11", "15", "25", "40", "60"] },
  { label: "Schaal", waarden: ["Geobserveerd", "Ja/Nee", "3-punt", "1-5 \u2605", "1-10", "1-10"] },
];

const SAMENVATTING_HEADERS: { naam: string; kleurVar: string }[] = [
  { naam: "Paars", kleurVar: "--knkv-paars-500" },
  { naam: "Blauw", kleurVar: "--knkv-blauw-500" },
  { naam: "Groen", kleurVar: "--knkv-groen-500" },
  { naam: "Geel", kleurVar: "--knkv-geel-500" },
  { naam: "Oranje", kleurVar: "--knkv-oranje-500" },
  { naam: "Rood", kleurVar: "--knkv-rood-500" },
];

// ---------------------------------------------------------------------------
// Samenvattingstabel
// ---------------------------------------------------------------------------

function SamenvattingsTabel() {
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: "12px",
        border: "1px solid var(--border-default)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-tertiary)",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--border-default)",
              }}
            />
            {SAMENVATTING_HEADERS.map((h) => (
              <th
                key={h.naam}
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "12px",
                  color: `var(${h.kleurVar})`,
                  backgroundColor: `color-mix(in srgb, var(${h.kleurVar}) 10%, var(--surface-raised))`,
                  borderBottom: `2px solid var(${h.kleurVar})`,
                }}
              >
                {h.naam}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SAMENVATTING_RIJEN.map((rij, ri) => (
            <tr key={rij.label}>
              <td
                style={{
                  padding: "10px 16px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--surface-card)",
                  borderBottom:
                    ri < SAMENVATTING_RIJEN.length - 1 ? "1px solid var(--border-default)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {rij.label}
              </td>
              {rij.waarden.map((waarde, wi) => (
                <td
                  key={wi}
                  style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    color: "var(--text-primary)",
                    backgroundColor: "var(--surface-card)",
                    borderBottom:
                      ri < SAMENVATTING_RIJEN.length - 1
                        ? "1px solid var(--border-default)"
                        : "none",
                    fontWeight: rij.label === "Items" ? 700 : 400,
                  }}
                >
                  {waarde}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hoofd-export
// ---------------------------------------------------------------------------

export function SectieLeeftijdsgroepen() {
  return (
    <section style={{ padding: "0 16px" }}>
      {/* Pulse animatie voor de badge */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.2,
            marginBottom: "8px",
          }}
        >
          Scouting per leeftijdsgroep
        </h2>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          De pijlers groeien mee.
        </p>
      </div>
      {/* 6 leeftijdsgroep-kaarten */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
        {GROEPEN.map((groep) => (
          <LeeftijdsgroepKaart key={groep.naam} groep={groep} />
        ))}
      </div>
      {/* Samenvattingstabel */}
      <div style={{ marginBottom: "40px" }}>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Overzicht
        </h3>
        <SamenvattingsTabel />
      </div>
      {/* Quote */}
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <blockquote
          style={{
            fontSize: "20px",
            fontWeight: 600,
            fontStyle: "italic",
            color: "var(--text-primary)",
            lineHeight: 1.5,
            position: "relative",
          }}
        >
          <span
            style={{
              color: "var(--ow-oranje-500)",
              fontSize: "32px",
              lineHeight: 0,
              verticalAlign: "middle",
              marginRight: "4px",
            }}
          >
            &ldquo;
          </span>
          De kaart groeit mee met je kind.
          <span
            style={{
              color: "var(--ow-oranje-500)",
              fontSize: "32px",
              lineHeight: 0,
              verticalAlign: "middle",
              marginLeft: "4px",
            }}
          >
            &rdquo;
          </span>
        </blockquote>
      </div>
    </section>
  );
}
