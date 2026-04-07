"use client";

import { useState } from "react";
import {
  CATEGORIEEN,
  CATEGORIE_DEFAULTS,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/categorie-kaders";

// Accent-kleur per categorie-sleutel
const ACCENT: Record<string, string> = {
  SENIOREN_A: "#6b7280",
  SENIOREN_B: "#9ca3af",
  U19: "var(--ow-oranje-500)",
  U17: "var(--ow-oranje-400)",
  U15: "var(--ow-oranje-300)",
  ROOD: "var(--knkv-rood-500)",
  ORANJE: "var(--knkv-oranje-500)",
  GEEL: "var(--knkv-geel-500)",
  GROEN: "var(--knkv-groen-500)",
  BLAUW: "var(--knkv-blauw-500)",
  KANGOEROES: "var(--knkv-paars-400)",
};

function Pill({
  label,
  waarde,
  kleur,
}: {
  label: string;
  waarde: string | number;
  kleur: "roze" | "blauw" | "grijs";
}) {
  const stijl =
    kleur === "roze"
      ? { background: "rgba(244,114,182,0.12)", color: "#f472b6" }
      : kleur === "blauw"
        ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa" }
        : { background: "rgba(156,163,175,0.12)", color: "#9ca3af" };

  return (
    <span
      style={{
        ...stijl,
        borderRadius: 4,
        padding: "1px 7px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-flex",
        gap: 3,
        alignItems: "center",
      }}
    >
      <span style={{ opacity: 0.6, fontSize: 10 }}>{label}</span>
      {waarde}
    </span>
  );
}

export default function KadersKnkvLaag() {
  const [open, setOpen] = useState(false);

  // Kangoeroes apart — informeel, geen KNKV-regels
  const speelCategorieen = CATEGORIEEN.filter((c) => c.sleutel !== "KANGOEROES");

  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: 12,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--text-secondary)", fontSize: 12, userSelect: "none" }}>
          {open ? "▼" : "▶"}
        </span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, flex: 1 }}>
          Laag 1 — KNKV Reglementen
        </span>
        <span
          style={{
            background: "rgba(59,130,246,0.15)",
            color: "#60a5fa",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          VAST
        </span>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 20px 20px" }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            Bron: KNKV Competitie 2.0 · Peildatum leeftijd: 31 december van het seizoensjaar. Niet
            bewerkbaar — dient als validatiereferentie.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {speelCategorieen.map((cat) => {
              const d = CATEGORIE_DEFAULTS[cat.sleutel];
              if (!d) return null;

              const maxSpelers = Math.ceil(
                d.optimaalSpelers * (1 + d.maxAfwijkingPercentage / 100)
              );
              const wissels = d.wisselsAantal === null ? "onbeperkt" : String(d.wisselsAantal);
              const leeftijdTekst =
                d.gemiddeldeLeeftijdKernMin !== null && d.gemiddeldeLeeftijdKernMax !== null
                  ? `gem. ${d.gemiddeldeLeeftijdKernMin}–${d.gemiddeldeLeeftijdKernMax} jr`
                  : null;
              const bandTekst =
                d.bandbreedteLeeftijd !== null ? `≤ ${d.bandbreedteLeeftijd} jr spreiding` : null;

              return (
                <div
                  key={cat.sleutel}
                  style={{
                    background: "var(--surface-sunken)",
                    borderRadius: 8,
                    padding: "12px 14px",
                    border: "1px solid var(--border-default)",
                    borderLeft: `3px solid ${ACCENT[cat.sleutel] ?? "#6b7280"}`,
                  }}
                >
                  {/* Naam + spelvorm */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>
                      {cat.label}
                    </span>
                    <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                      {cat.spelvorm} · {d.korfhoogte}m · bal {d.balMaat}
                    </span>
                  </div>

                  {/* Gender */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {d.verplichtMinV > 0 ? (
                      <>
                        <Pill label="V verplicht" waarde={`≥ ${d.verplichtMinV}`} kleur="roze" />
                        <Pill label="M verplicht" waarde={`≥ ${d.verplichtMinM}`} kleur="blauw" />
                      </>
                    ) : d.gewenstMinV > 0 ? (
                      <>
                        <Pill label="V gewenst" waarde={`≥ ${d.gewenstMinV}`} kleur="roze" />
                        <Pill label="M gewenst" waarde={`≥ ${d.gewenstMinM}`} kleur="blauw" />
                      </>
                    ) : (
                      <Pill label="gender" waarde="vrij" kleur="grijs" />
                    )}
                    {d.monogenderToestaan && (
                      <Pill label="" waarde="mono-gender ok" kleur="grijs" />
                    )}
                  </div>

                  {/* Teamgrootte */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    <Pill label="min" waarde={`${d.minSpelers} sp`} kleur="grijs" />
                    <Pill label="optimaal" waarde={`${d.optimaalSpelers} sp`} kleur="grijs" />
                    <Pill label="max" waarde={`${maxSpelers} sp`} kleur="grijs" />
                  </div>

                  {/* Leeftijd + speeltijd */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {leeftijdTekst && <Pill label="" waarde={leeftijdTekst} kleur="grijs" />}
                    {bandTekst && <Pill label="" waarde={bandTekst} kleur="grijs" />}
                    <Pill label="wissels" waarde={wissels} kleur="grijs" />
                    {d.speeltijdMinuten > 0 && (
                      <Pill label="" waarde={`2×${d.speeltijdMinuten} min`} kleur="grijs" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kangoeroes voetnoot */}
          <p style={{ color: "var(--text-tertiary)", fontSize: 11, marginTop: 12 }}>
            Kangoeroes (4–6 jaar) vallen buiten de KNKV-competitieregels — informeel spelformat.
          </p>
        </div>
      )}
    </section>
  );
}
