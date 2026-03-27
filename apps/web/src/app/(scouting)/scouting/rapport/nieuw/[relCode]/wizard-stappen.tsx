"use client";

import { useCallback } from "react";
import type { Pijler } from "@/lib/scouting/vragen";
import { PIJLER_LABELS, PIJLER_ICONEN, vragenPerPijler } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";

export type ScoutingContext = "WEDSTRIJD" | "TRAINING" | "OVERIG";

export const CONTEXT_OPTIES: { value: ScoutingContext; label: string; icon: string }[] = [
  { value: "WEDSTRIJD", label: "Wedstrijd", icon: "\u{1F3DF}\uFE0F" },
  { value: "TRAINING", label: "Training", icon: "\u{1F3C3}" },
  { value: "OVERIG", label: "Overig", icon: "\u{1F4CB}" },
];

const OPMERKING_CHIPS = [
  "Goede instelling",
  "Moeite met concentratie",
  "Snelle leerling",
  "Blessure-gevoelig",
  "Teamspeler",
  "Leider op het veld",
  "Moet meer durven",
  "Fysiek sterk",
];

export function StapContext({
  context,
  contextDetail,
  onContextChange,
  onDetailChange,
}: {
  context: ScoutingContext | null;
  contextDetail: string;
  onContextChange: (v: ScoutingContext) => void;
  onDetailChange: (v: string) => void;
}) {
  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">In welke context heb je gescout?</h2>
      <p className="text-text-secondary mb-6 text-sm">Kies wanneer je deze speler hebt gezien.</p>

      <div className="grid grid-cols-3 gap-3">
        {CONTEXT_OPTIES.map((optie) => (
          <button
            key={optie.value}
            type="button"
            onClick={() => onContextChange(optie.value)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95 ${
              context === optie.value
                ? "border-ow-oranje bg-ow-oranje/10 shadow-lg"
                : "bg-surface-card border-white/10 hover:border-white/20"
            } `}
          >
            <span className="text-3xl">{optie.icon}</span>
            <span className="text-sm font-semibold">{optie.label}</span>
          </button>
        ))}
      </div>

      {context && (
        <div className="mt-6 animate-[fadeIn_300ms_ease]">
          <label htmlFor="context-detail" className="text-text-secondary mb-1 block text-sm">
            Optioneel: tegenstander of locatie
          </label>
          <input
            id="context-detail"
            type="text"
            value={contextDetail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={context === "WEDSTRIJD" ? "Bijv. Deetos D1" : "Bijv. Dinsdagtraining"}
            className="bg-surface-card text-text-primary placeholder:text-text-muted focus:border-ow-oranje focus:ring-ow-oranje w-full rounded-xl border border-white/10 px-4 py-3 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

export function StapOpmerking({
  opmerking,
  onOpmerkingChange,
  roepnaam,
}: {
  opmerking: string;
  onOpmerkingChange: (v: string) => void;
  roepnaam: string;
}) {
  const handleChip = useCallback(
    (tekst: string) => {
      const nieuw = opmerking ? `${opmerking}\n${tekst}` : tekst;
      onOpmerkingChange(nieuw);
    },
    [opmerking, onOpmerkingChange]
  );

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">Opmerking over {roepnaam}</h2>
      <p className="text-text-secondary mb-4 text-sm">
        Optioneel. Voeg context toe die niet in de scores past.
      </p>

      <textarea
        value={opmerking}
        onChange={(e) => onOpmerkingChange(e.target.value)}
        rows={4}
        placeholder={`Wat valt je op aan ${roepnaam}?`}
        className="bg-surface-card text-text-primary placeholder:text-text-muted focus:border-ow-oranje focus:ring-ow-oranje w-full resize-none rounded-xl border border-white/10 px-4 py-3 text-sm focus:ring-1 focus:outline-none"
      />

      <div className="mt-4">
        <p className="text-text-muted mb-2 text-xs font-medium">Suggesties:</p>
        <div className="flex flex-wrap gap-2">
          {OPMERKING_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              className="bg-surface-elevated text-text-secondary active:bg-surface-dark hover:border-ow-oranje hover:text-ow-oranje rounded-full border border-white/10 px-3 py-1.5 text-xs transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StapSamenvatting({
  speler,
  context,
  scores,
  opmerking,
  maxScore,
  leeftijdsgroep,
}: {
  speler: { roepnaam: string; achternaam: string };
  context: ScoutingContext;
  scores: Record<string, number>;
  opmerking: string;
  maxScore: number;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const contextLabel = CONTEXT_OPTIES.find((c) => c.value === context)?.label ?? context;

  const perPijler = vragenPerPijler(leeftijdsgroep);
  const activePijlers = (Object.keys(perPijler) as Pijler[]).filter((p) => perPijler[p].length > 0);

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-4 text-xl font-bold">Samenvatting</h2>

      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">
            {speler.roepnaam} {speler.achternaam}
          </span>
          <span className="bg-ow-oranje/20 text-ow-oranje rounded-full px-3 py-1 text-xs font-semibold">
            {contextLabel}
          </span>
        </div>
      </div>

      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <h3 className="text-text-secondary mb-3 text-sm font-bold">Scores</h3>
        <div className="flex flex-col gap-2">
          {activePijlers.map((pijler) => {
            const pijlerVragen = perPijler[pijler];
            const waarden = pijlerVragen
              .map((v) => scores[v.id])
              .filter((w): w is number => w != null);
            const gemiddelde =
              waarden.length > 0
                ? (waarden.reduce((a, b) => a + b, 0) / waarden.length).toFixed(1)
                : "-";

            return (
              <div key={pijler} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{PIJLER_ICONEN[pijler]}</span>
                  <span className="text-sm">{PIJLER_LABELS[pijler]}</span>
                </div>
                <span className="text-sm font-bold">
                  {gemiddelde}
                  <span className="text-text-muted text-xs font-normal">/{maxScore}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {opmerking && (
        <div className="bg-surface-card mb-4 rounded-2xl p-4">
          <h3 className="text-text-secondary mb-2 text-sm font-bold">Opmerking</h3>
          <p className="text-text-primary text-sm whitespace-pre-wrap">{opmerking}</p>
        </div>
      )}

      <p className="text-text-muted text-center text-xs">
        Na indienen wordt de spelerskaart automatisch bijgewerkt.
      </p>
    </div>
  );
}

export function SpelerAvatar({
  roepnaam,
  leeftijdsgroep,
}: {
  roepnaam: string;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const gradient = GROEP_GRADIENT[leeftijdsgroep] ?? FALLBACK_GRADIENT;
  const initiaal = roepnaam.charAt(0).toUpperCase();

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
      style={{
        background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {initiaal}
    </div>
  );
}

const GROEP_GRADIENT: Record<LeeftijdsgroepNaam, { from: string; to: string }> = {
  paars: { from: "var(--knkv-paars-500)", to: "var(--knkv-paars-400)" },
  blauw: { from: "var(--knkv-blauw-500)", to: "var(--knkv-blauw-400)" },
  groen: { from: "var(--knkv-groen-500)", to: "var(--knkv-groen-400)" },
  geel: { from: "var(--knkv-geel-500)", to: "var(--knkv-geel-400)" },
  oranje: { from: "var(--knkv-oranje-500)", to: "var(--knkv-oranje-400)" },
  rood: { from: "var(--knkv-rood-500)", to: "var(--knkv-rood-400)" },
};

const FALLBACK_GRADIENT = { from: "var(--ow-zwart-400)", to: "var(--ow-zwart-500)" };
