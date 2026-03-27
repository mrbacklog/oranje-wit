"use client";

import { useState } from "react";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import type { ScoutingGroepConfigV3 } from "@/lib/scouting/vragen";
import { SpelerInitiaal } from "../speler-initiaal";

interface SpelerInfo {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  heeftFoto: boolean;
}

export function StapRanking({
  spelers,
  pijlers,
  rankings,
  onUp,
  onDown,
  leeftijdsgroep,
  config,
}: {
  spelers: SpelerInfo[];
  pijlers: string[];
  rankings: Record<string, string[]>;
  onUp: (pijler: string, spelerId: string) => void;
  onDown: (pijler: string, spelerId: string) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
  config?: ScoutingGroepConfigV3;
}) {
  const [actievePijler, setActievePijler] = useState<string>(pijlers[0] ?? "");

  const gesorteerdeSpelers = rankings[actievePijler] ?? spelers.map((s) => s.id);
  const spelerMap = new Map(spelers.map((s) => [s.id, s]));

  // Gebruik v3 config als beschikbaar, anders legacy labels
  const pijlerLabel = (code: string) => {
    if (config) {
      const p = config.pijlers.find((pp) => pp.code === code);
      return p ? `${p.icoon} ${p.naam}` : code;
    }
    return code;
  };

  const pijlerNaam = (code: string) => {
    if (config) {
      const p = config.pijlers.find((pp) => pp.code === code);
      return p?.naam ?? code;
    }
    return code;
  };

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">Ranking (optioneel)</h2>
      <p className="text-text-secondary mb-4 text-sm">
        Wie is de beste per pijler? Gebruik de pijltjes om de volgorde aan te passen.
      </p>

      {/* Pijler-tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {pijlers.map((pijler) => (
          <button
            key={pijler}
            type="button"
            onClick={() => setActievePijler(pijler)}
            className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              actievePijler === pijler
                ? "bg-ow-oranje text-white"
                : "bg-surface-card text-text-secondary"
            } `}
          >
            {pijlerLabel(pijler)}
          </button>
        ))}
      </div>

      <h3 className="text-text-secondary mb-3 text-sm font-semibold">
        Wie is de beste {pijlerNaam(actievePijler).toLowerCase()} speler?
      </h3>

      {/* Sorteerbare lijst */}
      <div className="flex flex-col gap-2">
        {gesorteerdeSpelers.map((spelerId, index) => {
          const speler = spelerMap.get(spelerId);
          if (!speler) return null;

          return (
            <div
              key={spelerId}
              className="bg-surface-card flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0
                    ? "bg-yellow-500/20 text-yellow-400"
                    : index === 1
                      ? "bg-gray-300/20 text-text-muted"
                      : index === 2
                        ? "bg-amber-600/20 text-amber-500"
                        : "text-text-muted bg-surface-card/5"
                }`}
              >
                {index + 1}
              </span>

              <SpelerInitiaal roepnaam={speler.roepnaam} leeftijdsgroep={leeftijdsgroep} small />

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {speler.roepnaam} {speler.achternaam}
              </span>

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onUp(actievePijler, spelerId)}
                  className="text-text-muted rounded p-1 transition-colors hover:bg-surface-card/10 active:bg-surface-card/20 disabled:opacity-20"
                  aria-label={`${speler.roepnaam} omhoog`}
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
                    <path d="M6 2L1 8h10L6 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={index === gesorteerdeSpelers.length - 1}
                  onClick={() => onDown(actievePijler, spelerId)}
                  className="text-text-muted rounded p-1 transition-colors hover:bg-surface-card/10 active:bg-surface-card/20 disabled:opacity-20"
                  aria-label={`${speler.roepnaam} omlaag`}
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
                    <path d="M6 10L1 4h10L6 10z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
