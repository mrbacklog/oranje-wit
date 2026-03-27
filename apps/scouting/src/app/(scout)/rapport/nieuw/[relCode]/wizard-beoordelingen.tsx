"use client";

import { useCallback, useState } from "react";
import { SmileyScore, SterrenScore, SliderScore } from "@/components/score-input";
import type { ScoutingGroepConfigV3, ScoutingVraagV3 } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import type { PijlerConfig, Blok } from "@oranje-wit/types";

// ─── Legacy exports (backward compatible) ───

export { StapBeoordelingV3 };

// ─── V3 Beoordeling ───

function StapBeoordelingV3({
  config,
  scores,
  onScore,
  leeftijdsgroep,
}: {
  config: ScoutingGroepConfigV3;
  scores: Record<string, number>;
  onScore: (vraagId: string, waarde: number) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  // Blauw: binary (Ja / Nog niet) — one-at-a-time flow
  if (config.schaalType === "ja_nogniet") {
    return (
      <BinaryBeoordeling
        items={config.items}
        scores={scores}
        onScore={onScore}
        pijlers={config.pijlers}
      />
    );
  }

  // Groen: ternary (Goed / Oke / Nog niet) — one-at-a-time flow
  if (config.schaalType === "goed_oke_nogniet") {
    return (
      <TernaryBeoordeling
        items={config.items}
        scores={scores}
        onScore={onScore}
        pijlers={config.pijlers}
      />
    );
  }

  // Geel+: grouped by pijler with blokken
  return <PijlerBeoordeling config={config} scores={scores} onScore={onScore} />;
}

// ─── Binary (Blauw: Ja / Nog niet) ───

function BinaryBeoordeling({
  items,
  scores,
  onScore,
  pijlers,
}: {
  items: ScoutingVraagV3[];
  scores: Record<string, number>;
  onScore: (id: string, v: number) => void;
  pijlers: PijlerConfig[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = items[currentIndex];
  const pijler = pijlers.find((p) => p.code === item?.pijlerCode);

  const handleScore = useCallback(
    (waarde: number) => {
      onScore(item.id, waarde);
      setTimeout(() => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }, 300);
    },
    [item, currentIndex, items.length, onScore]
  );

  if (!item) return null;

  return (
    <div className="flex animate-[fadeIn_300ms_ease] flex-col items-center">
      {/* Progress dots */}
      <div className="mb-6 flex gap-2">
        {items.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Vraag ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "bg-ow-oranje scale-125"
                : scores[v.id] != null
                  ? "bg-ow-oranje/40"
                  : "bg-surface-card/20"
            }`}
          />
        ))}
      </div>

      {/* Pijler label */}
      {pijler && (
        <span className="text-text-muted mb-1 text-xs font-semibold tracking-wider uppercase">
          {pijler.icoon} {pijler.naam}
        </span>
      )}

      <span className="text-ow-oranje mb-3 text-xs font-semibold tracking-wider uppercase">
        Vraag {currentIndex + 1} van {items.length}
      </span>

      <h3 className="mb-8 max-w-[280px] text-center text-xl leading-tight font-bold">
        {item.vraagTekst}
      </h3>

      {/* Binary buttons: Ja / Nog niet */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleScore(0)}
          className={`flex h-16 w-28 items-center justify-center rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${
            scores[item.id] === 0
              ? "border-red-400 bg-red-500/20 text-red-400"
              : "bg-surface-card text-text-secondary border-white/10 hover:border-white/20"
          }`}
        >
          Nog niet
        </button>
        <button
          type="button"
          onClick={() => handleScore(1)}
          className={`flex h-16 w-28 items-center justify-center rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${
            scores[item.id] === 1
              ? "border-green-400 bg-green-500/20 text-green-400"
              : "bg-surface-card text-text-secondary border-white/10 hover:border-white/20"
          }`}
        >
          Ja
        </button>
      </div>

      {/* Kern badge */}
      {item.isKern && (
        <span className="bg-ow-oranje/20 text-ow-oranje mt-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase">
          Kern-item
        </span>
      )}

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
        >
          Vorige
        </button>
        <button
          type="button"
          disabled={currentIndex === items.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

// ─── Ternary (Groen: Goed / Oke / Nog niet) ───

function TernaryBeoordeling({
  items,
  scores,
  onScore,
  pijlers,
}: {
  items: ScoutingVraagV3[];
  scores: Record<string, number>;
  onScore: (id: string, v: number) => void;
  pijlers: PijlerConfig[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = items[currentIndex];
  const pijler = pijlers.find((p) => p.code === item?.pijlerCode);

  const handleScore = useCallback(
    (waarde: number) => {
      onScore(item.id, waarde);
      setTimeout(() => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }, 400);
    },
    [item, currentIndex, items.length, onScore]
  );

  if (!item) return null;

  return (
    <div className="flex animate-[fadeIn_300ms_ease] flex-col items-center">
      <div className="mb-6 flex gap-2">
        {items.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Vraag ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "bg-ow-oranje scale-125"
                : scores[v.id] != null
                  ? "bg-ow-oranje/40"
                  : "bg-surface-card/20"
            }`}
          />
        ))}
      </div>

      {pijler && (
        <span className="text-text-muted mb-1 text-xs font-semibold tracking-wider uppercase">
          {pijler.icoon} {pijler.naam}
        </span>
      )}

      <span className="text-ow-oranje mb-3 text-xs font-semibold tracking-wider uppercase">
        Vraag {currentIndex + 1} van {items.length}
      </span>

      <h3 className="mb-8 max-w-[280px] text-center text-xl leading-tight font-bold">
        {item.vraagTekst}
      </h3>

      {/* Ternary buttons */}
      <SmileyScore
        label=""
        value={scores[item.id] != null ? Math.round(scores[item.id] * 2 + 1) : null}
        onChange={(v) => handleScore((v - 1) / 2)}
      />

      {item.isKern && (
        <span className="bg-ow-oranje/20 text-ow-oranje mt-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase">
          Kern-item
        </span>
      )}

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
        >
          Vorige
        </button>
        <button
          type="button"
          disabled={currentIndex === items.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

// ─── Pijler-gegroepeerde beoordeling (Geel+) ───

const BLOK_LABELS: Record<string, string> = {
  korfbalacties: "Korfbalacties",
  spelerskwaliteiten: "Spelerskwaliteiten",
  persoonlijk: "Persoonlijk",
  basis: "Basisvaardigheden",
};

function PijlerBeoordeling({
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
        <div className="h-1.5 flex-1 rounded-full bg-surface-card/10">
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
                <div className="h-px flex-1 bg-surface-card/10" />
                <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                  {BLOK_LABELS[blokNaam] ?? blokNaam}
                </span>
                <div className="h-px flex-1 bg-surface-card/10" />
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
                  <div
                    key={pijler.code}
                    className={`overflow-hidden rounded-2xl border transition-all ${
                      isOpen
                        ? "border-ow-oranje bg-surface-elevated shadow-lg"
                        : "bg-surface-card border-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenPijler(isOpen ? null : pijler.code)}
                      className="active:bg-surface-dark flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                    >
                      <span className="text-xl">{pijler.icoon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold">{pijler.naam}</span>
                        <span className="text-text-muted ml-2 text-xs">
                          {aantalKlaar}/{items.length}
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
                            schaalType={config.schaalType}
                            schaalMax={config.schaalMax}
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
                                schaalType={config.schaalType}
                                schaalMax={config.schaalMax}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
    // Slider 1-10 (niet 0-99)
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
