"use client";

import type { ScoutingGroepConfigV3, ScoutingVraagV3 } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { berekenOverallV3 } from "@/lib/scouting/rating";
import type { LeeftijdsgroepNaamV3 } from "@oranje-wit/types";
import { SpelerInitiaal } from "../speler-initiaal";

type ScoutingContext = "WEDSTRIJD" | "TRAINING" | "OVERIG";

const CONTEXT_LABELS: Record<ScoutingContext, string> = {
  WEDSTRIJD: "Wedstrijd",
  TRAINING: "Training",
  OVERIG: "Overig",
};

interface SpelerInfo {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  heeftFoto: boolean;
}

interface TeamInfo {
  id: number;
  naam: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
}

export function StapTeamSamenvattingV3({
  team,
  spelers,
  context,
  alleScores,
  opmerkingen,
  config,
  kernItems,
  leeftijdsgroep,
}: {
  team: TeamInfo;
  spelers: SpelerInfo[];
  context: ScoutingContext;
  alleScores: Record<string, Record<string, number>>;
  opmerkingen: Record<string, string>;
  config: ScoutingGroepConfigV3;
  kernItems: ScoutingVraagV3[];
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const contextLabel = CONTEXT_LABELS[context] ?? context;

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-4 text-xl font-bold">Samenvatting</h2>

      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{team.naam}</span>
          <span className="bg-ow-oranje/20 text-ow-oranje rounded-full px-3 py-1 text-xs font-semibold">
            {contextLabel}
          </span>
        </div>
        <p className="text-text-muted mt-1 text-xs">
          {spelers.length} spelers beoordeeld - Kernset ({kernItems.length} items)
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {spelers.map((speler) => {
          const scores = alleScores[speler.id] ?? {};
          const heeftOpmerking = !!opmerkingen[speler.id];

          // Bereken pijlerscores
          const { pijlerScores } = berekenOverallV3(
            scores,
            config.band as LeeftijdsgroepNaamV3,
            true
          );

          return (
            <div key={speler.id} className="bg-surface-card rounded-2xl border border-white/10 p-3">
              <div className="flex items-center gap-2">
                <SpelerInitiaal roepnaam={speler.roepnaam} leeftijdsgroep={leeftijdsgroep} small />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {speler.roepnaam} {speler.achternaam}
                </span>
                {heeftOpmerking && (
                  <span className="text-text-muted text-xs" title="Heeft opmerking">
                    💬
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {config.pijlers.map((pijler) => {
                  const score = pijlerScores[pijler.code];
                  return (
                    <div
                      key={pijler.code}
                      className="bg-surface-card/5 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px]"
                    >
                      <span>{pijler.icoon}</span>
                      <span className="font-bold">{score != null ? score : "-"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-text-muted mt-4 text-center text-xs">
        Na indienen worden alle spelerskaarten automatisch bijgewerkt.
      </p>
    </div>
  );
}
