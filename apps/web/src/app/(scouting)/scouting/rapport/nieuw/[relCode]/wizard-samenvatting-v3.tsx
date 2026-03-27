"use client";

import type { ScoutingGroepConfigV3 } from "@/lib/scouting/vragen";
import type { ScoutingContext } from "./wizard-stappen";
import { CONTEXT_OPTIES } from "./wizard-stappen";
import { berekenOverallV3 } from "@/lib/scouting/rating";
import type { LeeftijdsgroepNaamV3 } from "@oranje-wit/types";

const BLOK_LABELS: Record<string, string> = {
  korfbalacties: "Korfbalacties",
  spelerskwaliteiten: "Spelerskwaliteiten",
  persoonlijk: "Persoonlijk",
  basis: "Basisvaardigheden",
};

export function StapSamenvattingV3({
  speler,
  context,
  scores,
  opmerking,
  config,
  groeiIndicator,
}: {
  speler: { roepnaam: string; achternaam: string };
  context: ScoutingContext;
  scores: Record<string, number>;
  opmerking: string;
  config: ScoutingGroepConfigV3;
  groeiIndicator: string;
}) {
  const contextLabel = CONTEXT_OPTIES.find((c) => c.value === context)?.label ?? context;
  const { overall, pijlerScores } = berekenOverallV3(scores, config.band as LeeftijdsgroepNaamV3);

  // Groepeer per blok
  const blokken = new Map<string, typeof config.pijlers>();
  for (const p of config.pijlers) {
    const blok = p.blok ?? "basis";
    if (!blokken.has(blok)) blokken.set(blok, []);
    blokken.get(blok)!.push(p);
  }

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

      {/* Pijlerscores per blok */}
      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <h3 className="text-text-secondary mb-3 text-sm font-bold">Pijlerscores</h3>
        <div className="flex flex-col gap-3">
          {Array.from(blokken.entries()).map(([blokNaam, pijlers]) => (
            <div key={blokNaam}>
              {config.pijlers.some((p) => p.blok) && (
                <div className="text-text-muted mb-1 text-[10px] font-bold tracking-widest uppercase">
                  {BLOK_LABELS[blokNaam] ?? blokNaam}
                </div>
              )}
              {pijlers.map((pijler) => {
                const score = pijlerScores[pijler.code];
                return (
                  <div key={pijler.code} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{pijler.icoon}</span>
                      <span className="text-sm">{pijler.naam}</span>
                    </div>
                    <span className="text-sm font-bold">{score != null ? score : "-"}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Overall</span>
            <span className="text-ow-oranje text-lg font-black">{overall}</span>
          </div>
        </div>
      </div>

      {/* Groei */}
      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Groei-indicator</span>
          <span className="text-sm font-semibold capitalize">{groeiIndicator}</span>
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
