"use client";

import type { PijlerConfig } from "@oranje-wit/types";

interface SpelerSelectie {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
}

const SPELER_KLEUREN = [
  "#F97316", // oranje
  "#3B82F6", // blauw
  "#22C55E", // groen
  "#EAB308", // geel
  "#A855F7", // paars
  "#EF4444", // rood
];

export function StapVergelijkingSamenvatting({
  spelers,
  pijlers,
  posities,
  opmerking,
  onOpmerkingChange,
}: {
  spelers: SpelerSelectie[];
  pijlers: PijlerConfig[];
  posities: Record<string, Record<string, number>>;
  opmerking: string;
  onOpmerkingChange: (v: string) => void;
}) {
  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-4 text-xl font-bold">Samenvatting</h2>

      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <h3 className="text-text-secondary mb-2 text-sm font-bold">Spelers</h3>
        <div className="flex flex-wrap gap-2">
          {spelers.map((s, i) => (
            <span
              key={s.id}
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{
                backgroundColor: SPELER_KLEUREN[i % SPELER_KLEUREN.length] + "33",
                color: SPELER_KLEUREN[i % SPELER_KLEUREN.length],
              }}
            >
              {s.roepnaam} {s.achternaam}
            </span>
          ))}
        </div>
      </div>

      {/* Per pijler de rangorde */}
      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <h3 className="text-text-secondary mb-3 text-sm font-bold">Rangorde per pijler</h3>
        <div className="flex flex-col gap-2">
          {pijlers.map((pijler) => {
            const pijlerPosities = posities[pijler.code] ?? {};
            const gesorteerd = spelers
              .map((s) => ({ ...s, positie: pijlerPosities[s.id] ?? 50 }))
              .sort((a, b) => b.positie - a.positie);

            return (
              <div key={pijler.code} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm">{pijler.icoon}</span>
                <span className="text-text-secondary w-24 truncate text-xs">{pijler.naam}</span>
                <div className="flex flex-1 gap-1">
                  {gesorteerd.map((s, i) => (
                    <span
                      key={s.id}
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor:
                          SPELER_KLEUREN[
                            spelers.findIndex((sp) => sp.id === s.id) % SPELER_KLEUREN.length
                          ] + "22",
                        color:
                          SPELER_KLEUREN[
                            spelers.findIndex((sp) => sp.id === s.id) % SPELER_KLEUREN.length
                          ],
                      }}
                    >
                      {i + 1}. {s.roepnaam}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opmerking */}
      <div className="bg-surface-card rounded-2xl p-4">
        <h3 className="text-text-secondary mb-2 text-sm font-bold">Opmerking (optioneel)</h3>
        <textarea
          value={opmerking}
          onChange={(e) => onOpmerkingChange(e.target.value)}
          rows={3}
          placeholder="Eventuele toelichting bij de vergelijking..."
          className="bg-surface-elevated text-text-primary placeholder:text-text-muted focus:border-ow-oranje focus:ring-ow-oranje w-full resize-none rounded-lg border border-white/10 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
      </div>
    </div>
  );
}
