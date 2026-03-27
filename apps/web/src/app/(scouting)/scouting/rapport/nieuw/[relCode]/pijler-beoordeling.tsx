"use client";

import { useState } from "react";
import { SmileyScore, SterrenScore, SliderScore } from "@/components/scouting/score-input";
import type { ScoutingGroepConfigV3, ScoutingVraagV3 } from "@/lib/scouting/vragen";
import type { PijlerConfig } from "@oranje-wit/types";

// ─── Blok labels ───

const BLOK_LABELS: Record<string, string> = {
  korfbalacties: "Korfbalacties",
  spelerskwaliteiten: "Spelerskwaliteiten",
  persoonlijk: "Persoonlijk",
  basis: "Basisvaardigheden",
};

// ─── Pijler-gegroepeerde beoordeling (Geel+) ───

export function PijlerBeoordeling({
  config,
  scores,
  onScore,
}: {
  config: ScoutingGroepConfigV3;
  scores: Record<string, number>;
  onScore: (id: string, v: number) => void;
}) {
  const [openPijler, setOpenPijler] = useState<string | null>(null);

  // Groepeer pijlers per blok
  const blokken = new Map<string, PijlerConfig[]>();
  for (const p of config.pijlers) {
    const blok = p.blok ?? "basis";
    if (!blokken.has(blok)) blokken.set(blok, []);
    blokken.get(blok)!.push(p);
  }

  const aantalIngevuld = Object.keys(scores).length;
  const aantalVragen = config.items.length;

  // Items per pijler
  const itemsPerPijler: Record<string, ScoutingVraagV3[]> = {};
  for (const item of config.items) {
    if (!itemsPerPijler[item.pijlerCode]) itemsPerPijler[item.pijlerCode] = [];
    itemsPerPijler[item.pijlerCode].push(item);
  }

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-text-secondary text-sm font-semibold">
          {aantalIngevuld}/{aantalVragen}
        </span>
        <div className="bg-surface-card/10 h-1.5 flex-1 rounded-full">
          <div
            className="bg-ow-oranje h-full rounded-full transition-all duration-300"
            style={{ width: `${(aantalIngevuld / aantalVragen) * 100}%` }}
          />
        </div>
      </div>

      {/* Blokken met pijlers */}
      <div className="flex flex-col gap-4">
        {Array.from(blokken.entries()).map(([blokNaam, pijlers]) => (
          <div key={blokNaam}>
            {/* Blok header (alleen bij Geel+) */}
            {config.pijlers.some((p) => p.blok) && (
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-surface-card/10 h-px flex-1" />
                <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                  {BLOK_LABELS[blokNaam] ?? blokNaam}
                </span>
                <div className="bg-surface-card/10 h-px flex-1" />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {pijlers.map((pijler) => {
                const items = itemsPerPijler[pijler.code] ?? [];
                const isOpen = openPijler === pijler.code;
                const aantalKlaar = items.filter((v) => scores[v.id] != null).length;
                const alleKlaar = aantalKlaar === items.length && items.length > 0;
                const kernItems = items.filter((i) => i.isKern);
                const verdiepingItems = items.filter((i) => !i.isKern);

                return (
                  <PijlerAccordion
                    key={pijler.code}
                    pijler={pijler}
                    isOpen={isOpen}
                    aantalKlaar={aantalKlaar}
                    totaalItems={items.length}
                    alleKlaar={alleKlaar}
                    kernItems={kernItems}
                    verdiepingItems={verdiepingItems}
                    scores={scores}
                    onScore={onScore}
                    schaalType={config.schaalType}
                    schaalMax={config.schaalMax}
                    onToggle={() => setOpenPijler(isOpen ? null : pijler.code)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pijler accordion item ──

function PijlerAccordion({
  pijler,
  isOpen,
  aantalKlaar,
  totaalItems,
  alleKlaar,
  kernItems,
  verdiepingItems,
  scores,
  onScore,
  schaalType,
  schaalMax,
  onToggle,
}: {
  pijler: PijlerConfig;
  isOpen: boolean;
  aantalKlaar: number;
  totaalItems: number;
  alleKlaar: boolean;
  kernItems: ScoutingVraagV3[];
  verdiepingItems: ScoutingVraagV3[];
  scores: Record<string, number>;
  onScore: (id: string, v: number) => void;
  schaalType: string;
  schaalMax: number;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        isOpen
          ? "border-ow-oranje bg-surface-elevated shadow-lg"
          : "bg-surface-card border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="active:bg-surface-dark flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
      >
        <span className="text-xl">{pijler.icoon}</span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold">{pijler.naam}</span>
          <span className="text-text-muted ml-2 text-xs">
            {aantalKlaar}/{totaalItems}
          </span>
        </div>
        {alleKlaar && <span className="text-sm text-green-400">✓</span>}
        <span
          className={`text-text-muted transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
          {/* Kern-items */}
          {kernItems.length > 0 && verdiepingItems.length > 0 && (
            <span className="text-ow-oranje text-[10px] font-bold tracking-widest uppercase">
              Kern
            </span>
          )}
          {kernItems.map((item) => (
            <ScoreInvoerV3
              key={item.id}
              item={item}
              value={scores[item.id] ?? null}
              onChange={(v) => onScore(item.id, v)}
              schaalType={schaalType}
              schaalMax={schaalMax}
            />
          ))}

          {/* Verdieping-items */}
          {verdiepingItems.length > 0 && (
            <>
              <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                Verdieping
              </span>
              {verdiepingItems.map((item) => (
                <ScoreInvoerV3
                  key={item.id}
                  item={item}
                  value={scores[item.id] ?? null}
                  onChange={(v) => onScore(item.id, v)}
                  schaalType={schaalType}
                  schaalMax={schaalMax}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Score invoer per schaaltype ───

function ScoreInvoerV3({
  item,
  value,
  onChange,
  schaalType,
  schaalMax,
}: {
  item: ScoutingVraagV3;
  value: number | null;
  onChange: (v: number) => void;
  schaalType: string;
  schaalMax: number;
}) {
  if (schaalType === "sterren") {
    return <SterrenScore label={item.vraagTekst} value={value} onChange={onChange} />;
  }

  if (schaalType === "slider") {
    return (
      <SliderScore
        label={item.vraagTekst}
        value={value}
        onChange={onChange}
        snelkeuze={[
          { label: "Zwak", value: 2 },
          { label: "Gem", value: 5 },
          { label: "Goed", value: 7 },
          { label: "Top", value: 9 },
        ]}
      />
    );
  }

  return <SmileyScore label={item.vraagTekst} value={value} onChange={onChange} />;
}
