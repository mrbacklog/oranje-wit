"use client";

import { useState } from "react";
import type { Pijler } from "@/lib/scouting/vragen";
import { PIJLER_LABELS, PIJLER_ICONEN } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
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
}: {
  spelers: SpelerInfo[];
  pijlers: Pijler[];
  rankings: Record<string, string[]>;
  onUp: (pijler: string, spelerId: string) => void;
  onDown: (pijler: string, spelerId: string) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const [actievePijler, setActievePijler] = useState<Pijler>(pijlers[0] ?? "SCH");

  const gesorteerdeSpelers = rankings[actievePijler] ?? spelers.map((s) => s.id);
  const spelerMap = new Map(spelers.map((s) => [s.id, s]));

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">Ranking (optioneel)</h2>
      <p className="text-text-secondary mb-4 text-sm">
        Wie is de beste per pijler? Gebruik de pijltjes om de volgorde aan te passen. Je kunt deze
        stap ook overslaan.
      </p>

      {/* Pijler-tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {pijlers.map((pijler) => (
          <button
            key={pijler}
            type="button"
            onClick={() => setActievePijler(pijler)}
            className={`flex flex-shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              actievePijler === pijler
                ? "bg-ow-oranje text-white"
                : "bg-surface-card text-text-secondary"
            } `}
          >
            {PIJLER_ICONEN[pijler]} {PIJLER_LABELS[pijler]}
          </button>
        ))}
      </div>

      <h3 className="text-text-secondary mb-3 text-sm font-semibold">
        Wie is de beste {PIJLER_LABELS[actievePijler].toLowerCase()} speler?
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
              {/* Ranknummer */}
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0
                    ? "bg-yellow-500/20 text-yellow-400"
                    : index === 1
                      ? "bg-gray-300/20 text-gray-300"
                      : index === 2
                        ? "bg-amber-600/20 text-amber-500"
                        : "text-text-muted bg-white/5"
                }`}
              >
                {index + 1}
              </span>

              {/* Avatar */}
              <SpelerInitiaal roepnaam={speler.roepnaam} leeftijdsgroep={leeftijdsgroep} small />

              {/* Naam */}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {speler.roepnaam} {speler.achternaam}
              </span>

              {/* Up/Down knoppen */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onUp(actievePijler, spelerId)}
                  className="text-text-muted rounded p-1 transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-20"
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
                  className="text-text-muted rounded p-1 transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-20"
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
