"use client";

import { motion } from "framer-motion";
import { SpelersKaart } from "@/components/scouting/spelers-kaart";
import type { AchterkantData } from "@/components/scouting/spelers-kaart";
import { fadeUp, stagger, BrowserFrame, FeatureBadge } from "./platform-app-mockups";

// ─── Demodata SpelersKaarten ───

const KLEINE_KAARTEN = [
  {
    spelerId: "demo-emma",
    roepnaam: "Emma",
    achternaam: "de Vries",
    leeftijd: 7,
    tier: "brons" as const,
    overall: 62,
    sterren: 2,
    stats: { schot: 58, aanval: 64, passing: 60, verdediging: 55, fysiek: 68, mentaal: 66 },
  },
  {
    spelerId: "demo-luuk",
    roepnaam: "Luuk",
    achternaam: "Bakker",
    leeftijd: 11,
    tier: "zilver" as const,
    overall: 74,
    sterren: 3,
    stats: { schot: 72, aanval: 76, passing: 78, verdediging: 70, fysiek: 74, mentaal: 72 },
  },
  {
    spelerId: "demo-sanne",
    roepnaam: "Sanne",
    achternaam: "Jansen",
    leeftijd: 17,
    tier: "goud" as const,
    overall: 88,
    sterren: 5,
    stats: { schot: 86, aanval: 90, passing: 88, verdediging: 84, fysiek: 92, mentaal: 86 },
  },
];

const GROTE_KAART = {
  spelerId: "demo-daan",
  roepnaam: "Daan",
  achternaam: "van Dijk",
  leeftijd: 14,
  tier: "zilver" as const,
  overall: 81,
  sterren: 4,
  stats: { schot: 78, aanval: 84, passing: 76, verdediging: 72, fysiek: 86, mentaal: 82 },
};

const GROTE_KAART_ACHTERKANT: AchterkantData = {
  bio: { positie: "Aanvaller", korfbalLeeftijd: 6, spelerstype: "Allrounder" },
  rapporten: [
    { score: 79, datum: "2026-01-15", scout: "Coach Mark" },
    { score: 81, datum: "2026-02-08", scout: "Coach Lisa" },
    { score: 83, datum: "2026-03-01", scout: "Coach Jan" },
  ],
  trend: 3,
  radarScores: [78, 84, 76, 72, 86, 82],
};

// ─── Zoom Team-Indeling ───

export function ZoomTeamIndeling() {
  const accent = "#3b82f6";
  return (
    <motion.div variants={fadeUp} className="mb-16">
      <h3 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Zoom: Team-Indeling
      </h3>
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `2px solid ${accent}`, background: "var(--surface-sunken)" }}
        >
          <div className="flex gap-1.5">
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#eab308" }} />
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            ckvoranjewit.app/teamindeling/blauwdruk
          </span>
        </div>
        <div className="flex">
          {/* Sidebar */}
          <div
            className="hidden w-40 shrink-0 flex-col gap-1 p-3 sm:flex"
            style={{
              borderRight: "1px solid var(--border-default)",
              background: "var(--surface-sunken)",
            }}
          >
            {["Overzicht", "Blauwdruk", "Werkbord", "Scenario's"].map((item) => (
              <div
                key={item}
                className="rounded-md px-2.5 py-1.5 text-[11px] font-medium"
                style={{
                  background: item === "Blauwdruk" ? "rgba(59,130,246,0.15)" : "transparent",
                  color: item === "Blauwdruk" ? accent : "var(--text-secondary)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
          {/* Main content */}
          <div className="flex-1 p-4">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Kaders", pct: 75, color: accent },
                { label: "Spelers", pct: 60, color: "#22c55e" },
                { label: "Staf", pct: 40, color: "#ff6b00" },
                { label: "Totaal", pct: 58, color: "var(--text-secondary)" },
              ].map((kpi) => (
                <div key={kpi.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold" style={{ color: kpi.color }}>
                      {kpi.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {kpi.pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: "var(--surface-raised)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${kpi.pct}%`, background: kpi.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              {["Kaders", "Gezien", "Besluiten", "Spelers", "Staf", "Teams"].map((tab, i) => (
                <div
                  key={tab}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: i === 5 ? "rgba(59,130,246,0.2)" : "var(--surface-raised)",
                    color: i === 5 ? accent : "var(--text-tertiary)",
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { naam: "D1", spelers: 8, kleur: "rgba(59,130,246,0.12)" },
                { naam: "D2", spelers: 7, kleur: "rgba(59,130,246,0.08)" },
                { naam: "E1", spelers: 6, kleur: "rgba(59,130,246,0.06)" },
              ].map((team) => (
                <div
                  key={team.naam}
                  className="rounded-lg p-2.5"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div className="mb-2 text-[11px] font-bold" style={{ color: accent }}>
                    {team.naam}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from({ length: team.spelers }).map((_, i) => (
                      <div
                        key={i}
                        className="h-3 w-6 rounded-sm"
                        style={{ background: team.kleur }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <FeatureBadge label="Seizoen-dynamisch" accent={accent} />
        <FeatureBadge label="Drag-and-drop" accent={accent} />
        <FeatureBadge label="Validatie-engine" accent={accent} />
      </div>
    </motion.div>
  );
}

// ─── Zoom Scouting ───

export function ZoomScouting() {
  const accent = "#ff6b00";
  const knkvKleuren = [
    { label: "Paars", kleur: "var(--knkv-paars-500)", actief: false },
    { label: "Blauw", kleur: "var(--knkv-blauw-500)", actief: false },
    { label: "Groen", kleur: "var(--knkv-groen-500)", actief: false },
    { label: "Geel", kleur: "var(--knkv-geel-500)", actief: true },
    { label: "Oranje", kleur: "var(--knkv-oranje-500)", actief: false },
    { label: "Rood", kleur: "var(--knkv-rood-500)", actief: false },
  ];
  return (
    <motion.div variants={fadeUp} className="mb-16">
      <h3 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Zoom: Scouting
      </h3>
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `2px solid ${accent}`, background: "var(--surface-sunken)" }}
        >
          <div className="flex gap-1.5">
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#eab308" }} />
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            ckvoranjewit.app/scouting
          </span>
        </div>
        <div className="p-4">
          <p className="mb-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Goedemiddag, Coach Jan
          </p>
          <h4 className="mb-3 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Scouting Dashboard
          </h4>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-bold" style={{ color: accent }}>
              XP
            </span>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full"
              style={{ background: "var(--surface-raised)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: "60%", background: accent }}
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
              60%
            </span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { titel: "Nieuw rapport", sub: "3 openstaand" },
              { titel: "Vergelijken", sub: "2 opgeslagen" },
            ].map((actie) => (
              <div
                key={actie.titel}
                className="rounded-lg p-3"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div className="text-[11px] font-bold" style={{ color: accent }}>
                  {actie.titel}
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {actie.sub}
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {knkvKleuren.map((chip) => (
              <span
                key={chip.label}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: chip.actief
                    ? `color-mix(in srgb, ${chip.kleur} 25%, transparent)`
                    : "var(--surface-raised)",
                  color: chip.actief ? chip.kleur : "var(--text-tertiary)",
                  border: chip.actief
                    ? `1px solid color-mix(in srgb, ${chip.kleur} 40%, transparent)`
                    : "1px solid var(--border-light)",
                }}
              >
                {chip.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => {
              const gradients = [
                "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.1))",
                "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(234,179,8,0.08))",
                "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.06))",
                "linear-gradient(135deg, rgba(234,179,8,0.28), rgba(234,179,8,0.12))",
                "linear-gradient(135deg, rgba(234,179,8,0.22), rgba(234,179,8,0.07))",
                "linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.05))",
              ];
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-lg py-3"
                  style={{ background: gradients[i] }}
                >
                  <div className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                    {[68, 72, 65, 74, 70, 67][i]}
                  </div>
                  <div className="text-[8px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                    {["EV", "LB", "SJ", "MK", "TD", "AB"][i]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <FeatureBadge label="XP & Gamificatie" accent={accent} />
        <FeatureBadge label="Filter op leeftijdsgroep" accent={accent} />
        <FeatureBadge label="Wizard-flow" accent={accent} />
      </div>
    </motion.div>
  );
}

// ─── SpelersKaart Showcase ───

export function SpelersKaartShowcase() {
  return (
    <motion.div variants={fadeUp} className="mb-16">
      <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        De SpelersKaart
      </h3>
      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Elke speler krijgt een eigen kaart met scores, tier en groeiprofiel.
      </p>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex shrink-0 gap-3 lg:flex-col">
          {KLEINE_KAARTEN.map((speler) => (
            <SpelersKaart key={speler.spelerId} {...speler} size="small" />
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center">
          <SpelersKaart
            {...GROTE_KAART}
            size="large"
            flipbaar={true}
            achterkantData={GROTE_KAART_ACHTERKANT}
          />
          <motion.span
            className="mt-3 text-xs font-medium"
            style={{ color: "var(--text-muted, var(--text-tertiary))" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Klik op de kaart om te draaien
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
