"use client";

import { useCallback, useState } from "react";
import { SmileyScore } from "@/components/score-input";
import type { ScoutingGroepConfigV3, ScoutingVraagV3 } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import type { PijlerConfig } from "@oranje-wit/types";
import { PijlerBeoordeling } from "./pijler-beoordeling";

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
      <ProgressDots
        items={items}
        scores={scores}
        currentIndex={currentIndex}
        onSelect={setCurrentIndex}
      />

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

      <KernBadge isKern={item.isKern} />

      <NavigatieKnoppen
        currentIndex={currentIndex}
        totaal={items.length}
        onVorige={() => setCurrentIndex(currentIndex - 1)}
        onVolgende={() => setCurrentIndex(currentIndex + 1)}
      />
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
      <ProgressDots
        items={items}
        scores={scores}
        currentIndex={currentIndex}
        onSelect={setCurrentIndex}
      />

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

      <KernBadge isKern={item.isKern} />

      <NavigatieKnoppen
        currentIndex={currentIndex}
        totaal={items.length}
        onVorige={() => setCurrentIndex(currentIndex - 1)}
        onVolgende={() => setCurrentIndex(currentIndex + 1)}
      />
    </div>
  );
}

// ─── Gedeelde sub-componenten ───

function ProgressDots({
  items,
  scores,
  currentIndex,
  onSelect,
}: {
  items: ScoutingVraagV3[];
  scores: Record<string, number>;
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mb-6 flex gap-2">
      {items.map((v, i) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onSelect(i)}
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
  );
}

function KernBadge({ isKern }: { isKern: boolean }) {
  if (!isKern) return null;
  return (
    <span className="bg-ow-oranje/20 text-ow-oranje mt-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase">
      Kern-item
    </span>
  );
}

function NavigatieKnoppen({
  currentIndex,
  totaal,
  onVorige,
  onVolgende,
}: {
  currentIndex: number;
  totaal: number;
  onVorige: () => void;
  onVolgende: () => void;
}) {
  return (
    <div className="mt-6 flex gap-4">
      <button
        type="button"
        disabled={currentIndex === 0}
        onClick={onVorige}
        className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
      >
        Vorige
      </button>
      <button
        type="button"
        disabled={currentIndex === totaal - 1}
        onClick={onVolgende}
        className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
      >
        Volgende
      </button>
    </div>
  );
}
