"use client";

import { useCallback } from "react";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { SpelerInitiaal } from "../speler-initiaal";

interface SpelerInfo {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  heeftFoto: boolean;
}

const OPMERKING_CHIPS = [
  "Goede instelling",
  "Moeite met concentratie",
  "Snelle leerling",
  "Teamspeler",
  "Leider op het veld",
  "Moet meer durven",
  "Fysiek sterk",
  "Blessure-gevoelig",
];

export function StapOpmerkingen({
  spelers,
  opmerkingen,
  onOpmerkingChange,
  leeftijdsgroep,
}: {
  spelers: SpelerInfo[];
  opmerkingen: Record<string, string>;
  onOpmerkingChange: (spelerId: string, tekst: string) => void;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const handleChip = useCallback(
    (spelerId: string, chip: string) => {
      const huidige = opmerkingen[spelerId] ?? "";
      const nieuw = huidige ? `${huidige}\n${chip}` : chip;
      onOpmerkingChange(spelerId, nieuw);
    },
    [opmerkingen, onOpmerkingChange]
  );

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">Opmerkingen (optioneel)</h2>
      <p className="text-text-secondary mb-4 text-sm">
        Voeg per speler optioneel een opmerking toe.
      </p>

      {/* Suggestie-chips */}
      <div className="mb-4">
        <p className="text-text-muted mb-2 text-xs font-medium">Snelle suggesties:</p>
        <div className="flex flex-wrap gap-2">
          {OPMERKING_CHIPS.map((chip) => (
            <span
              key={chip}
              className="bg-surface-elevated text-text-secondary rounded-full border border-white/10 px-3 py-1.5 text-xs"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Per speler */}
      <div className="flex flex-col gap-3">
        {spelers.map((speler) => (
          <div key={speler.id} className="bg-surface-card rounded-2xl border border-white/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <SpelerInitiaal roepnaam={speler.roepnaam} leeftijdsgroep={leeftijdsgroep} small />
              <span className="text-sm font-bold">{speler.roepnaam}</span>
            </div>

            <textarea
              value={opmerkingen[speler.id] ?? ""}
              onChange={(e) => onOpmerkingChange(speler.id, e.target.value)}
              rows={2}
              placeholder={`Opmerking over ${speler.roepnaam}...`}
              className="bg-surface-elevated text-text-primary placeholder:text-text-muted focus:border-ow-oranje focus:ring-ow-oranje w-full resize-none rounded-lg border border-white/10 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            />

            {/* Chip knoppen per speler */}
            <div className="mt-2 flex flex-wrap gap-1">
              {OPMERKING_CHIPS.slice(0, 4).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChip(speler.id, chip)}
                  className="text-text-muted hover:border-ow-oranje hover:text-ow-oranje active:bg-surface-dark rounded-full border border-white/10 px-2 py-1 text-[10px] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
