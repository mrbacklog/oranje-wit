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

export function StapVergelijking({
  spelers,
  pijlers,
  posities,
  onPositieChange,
}: {
  spelers: SpelerSelectie[];
  pijlers: PijlerConfig[];
  posities: Record<string, Record<string, number>>;
  onPositieChange: (pijlerCode: string, spelerId: string, waarde: number) => void;
}) {
  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">Vergelijk per pijler</h2>
      <p className="text-text-secondary mb-4 text-sm">
        Positioneer elke speler op de balk. Links = zwak, rechts = sterk.
      </p>

      {/* Legenda */}
      <div className="mb-4 flex flex-wrap gap-2">
        {spelers.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: SPELER_KLEUREN[i % SPELER_KLEUREN.length] }}
            />
            <span className="text-xs font-medium">{s.roepnaam}</span>
          </div>
        ))}
      </div>

      {/* Per pijler een vergelijkingsbalk */}
      <div className="flex flex-col gap-5">
        {pijlers.map((pijler) => (
          <div key={pijler.code} className="bg-surface-card rounded-2xl border border-white/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">{pijler.icoon}</span>
              <span className="text-sm font-bold">{pijler.naam}</span>
            </div>

            {/* Per speler een slider */}
            <div className="flex flex-col gap-3">
              {spelers.map((speler, idx) => {
                const waarde = posities[pijler.code]?.[speler.id] ?? 50;
                const kleur = SPELER_KLEUREN[idx % SPELER_KLEUREN.length];

                return (
                  <div key={speler.id} className="flex items-center gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: kleur }}
                    >
                      {speler.roepnaam.charAt(0)}
                    </div>
                    <div className="relative flex-1">
                      <div className="bg-surface-card/10 h-2 w-full rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-150"
                          style={{
                            width: `${waarde}%`,
                            backgroundColor: kleur,
                            opacity: 0.6,
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={waarde}
                        onChange={(e) =>
                          onPositieChange(pijler.code, speler.id, Number(e.target.value))
                        }
                        className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
                        style={
                          {
                            "--thumb-bg": kleur,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-bold" style={{ color: kleur }}>
                      {waarde}
                    </span>
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
