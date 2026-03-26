"use client";

import { useCallback, useState } from "react";
import { SmileyScore, SterrenScore, SliderScore } from "@/components/score-input";
import type { ScoutingVraag, Pijler } from "@/lib/scouting/vragen";
import { PIJLER_LABELS, PIJLER_ICONEN, vragenPerPijler } from "@/lib/scouting/vragen";
import type { SchaalType, LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";

export function StapBeoordeling({
  schaalType,
  vragen,
  scores,
  onScore,
  leeftijdsgroep,
  smileyIndex,
  onSmileyIndexChange,
}: {
  schaalType: SchaalType;
  vragen: ScoutingVraag[];
  scores: Record<string, number>;
  onScore: (vraagId: string, waarde: number) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
  smileyIndex: number;
  onSmileyIndexChange: (index: number) => void;
}) {
  if (schaalType === "smiley") {
    return (
      <SmileyBeoordeling
        vragen={vragen}
        scores={scores}
        onScore={onScore}
        huidigeIndex={smileyIndex}
        onIndexChange={onSmileyIndexChange}
      />
    );
  }

  if (schaalType === "sterren") {
    return (
      <SterrenBeoordeling
        vragen={vragen}
        scores={scores}
        onScore={onScore}
        leeftijdsgroep={leeftijdsgroep}
      />
    );
  }

  return (
    <SliderBeoordeling
      vragen={vragen}
      scores={scores}
      onScore={onScore}
      leeftijdsgroep={leeftijdsgroep}
    />
  );
}

function SmileyBeoordeling({
  vragen,
  scores,
  onScore,
  huidigeIndex,
  onIndexChange,
}: {
  vragen: ScoutingVraag[];
  scores: Record<string, number>;
  onScore: (vraagId: string, waarde: number) => void;
  huidigeIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const huidigeVraag = vragen[huidigeIndex];

  const handleScore = useCallback(
    (waarde: number) => {
      onScore(huidigeVraag.id, waarde);
      setTimeout(() => {
        if (huidigeIndex < vragen.length - 1) {
          onIndexChange(huidigeIndex + 1);
        }
      }, 400);
    },
    [huidigeVraag, huidigeIndex, vragen.length, onScore, onIndexChange]
  );

  return (
    <div className="flex animate-[fadeIn_300ms_ease] flex-col items-center">
      <div className="mb-6 flex gap-2">
        {vragen.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onIndexChange(i)}
            aria-label={`Vraag ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i === huidigeIndex
                ? "bg-ow-oranje scale-125"
                : scores[v.id] != null
                  ? "bg-ow-oranje/40"
                  : "bg-white/20"
            }`}
          />
        ))}
      </div>

      <span className="text-ow-oranje mb-3 text-xs font-semibold tracking-wider uppercase">
        Vraag {huidigeIndex + 1} van {vragen.length}
      </span>

      <h3 className="mb-10 max-w-[280px] text-center text-xl leading-tight font-bold">
        {huidigeVraag.vraagTekst}
      </h3>

      <SmileyScore label="" value={scores[huidigeVraag.id] ?? null} onChange={handleScore} />

      <div className="mt-8 flex gap-4">
        <button
          type="button"
          disabled={huidigeIndex === 0}
          onClick={() => onIndexChange(huidigeIndex - 1)}
          className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
        >
          Vorige
        </button>
        <button
          type="button"
          disabled={huidigeIndex === vragen.length - 1}
          onClick={() => onIndexChange(huidigeIndex + 1)}
          className="text-text-secondary active:bg-surface-elevated rounded-full border border-white/20 px-6 py-2 text-sm transition-colors disabled:opacity-30"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

function SterrenBeoordeling({
  vragen,
  scores,
  onScore,
  leeftijdsgroep,
}: {
  vragen: ScoutingVraag[];
  scores: Record<string, number>;
  onScore: (vraagId: string, waarde: number) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const [openPijler, setOpenPijler] = useState<Pijler | null>(null);
  const perPijler = vragenPerPijler(leeftijdsgroep);

  const activePijlers = (Object.keys(perPijler) as Pijler[]).filter((p) => perPijler[p].length > 0);

  const aantalIngevuld = Object.keys(scores).length;
  const aantalVragen = vragen.length;

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-text-secondary text-sm font-semibold">
          {aantalIngevuld}/{aantalVragen}
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-white/10">
          <div
            className="bg-ow-oranje h-full rounded-full transition-all duration-300"
            style={{ width: `${(aantalIngevuld / aantalVragen) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activePijlers.map((pijler) => {
          const pijlerVragen = perPijler[pijler];
          const isOpen = openPijler === pijler;
          const aantalKlaar = pijlerVragen.filter((v) => scores[v.id] != null).length;
          const alleKlaar = aantalKlaar === pijlerVragen.length;

          return (
            <div
              key={pijler}
              className={`overflow-hidden rounded-2xl border transition-all ${
                isOpen
                  ? "border-ow-oranje bg-surface-elevated shadow-lg"
                  : "bg-surface-card border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenPijler(isOpen ? null : pijler)}
                className="active:bg-surface-dark flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
              >
                <span className="text-xl">{PIJLER_ICONEN[pijler]}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold">{PIJLER_LABELS[pijler]}</span>
                  <span className="text-text-muted ml-2 text-xs">
                    {aantalKlaar}/{pijlerVragen.length}
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
                  isOpen ? "max-h-[600px]" : "max-h-0"
                }`}
              >
                <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
                  {pijlerVragen.map((vraag) => (
                    <div key={vraag.id}>
                      <SterrenScore
                        label={vraag.vraagTekst}
                        value={scores[vraag.id] ?? null}
                        onChange={(v) => onScore(vraag.id, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SliderBeoordeling({
  vragen,
  scores,
  onScore,
  leeftijdsgroep,
}: {
  vragen: ScoutingVraag[];
  scores: Record<string, number>;
  onScore: (vraagId: string, waarde: number) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const perPijler = vragenPerPijler(leeftijdsgroep);

  const activePijlers = (Object.keys(perPijler) as Pijler[]).filter((p) => perPijler[p].length > 0);

  const aantalIngevuld = Object.keys(scores).length;
  const aantalVragen = vragen.length;

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-text-secondary text-sm font-semibold">
          {aantalIngevuld}/{aantalVragen}
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-white/10">
          <div
            className="bg-ow-oranje h-full rounded-full transition-all duration-300"
            style={{ width: `${(aantalIngevuld / aantalVragen) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {activePijlers.map((pijler) => {
          const pijlerVragen = perPijler[pijler];

          return (
            <section key={pijler}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{PIJLER_ICONEN[pijler]}</span>
                <h3 className="text-sm font-bold">{PIJLER_LABELS[pijler]}</h3>
              </div>

              <div className="bg-surface-card flex flex-col gap-6 rounded-2xl p-4">
                {pijlerVragen.map((vraag) => (
                  <SliderScore
                    key={vraag.id}
                    label={vraag.vraagTekst}
                    value={scores[vraag.id] ?? null}
                    onChange={(v) => onScore(vraag.id, v)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
