"use client";

import type { ScoutingVraag, Pijler } from "@/lib/scouting/vragen";
import { PIJLER_ICONEN } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
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

export function StapTeamSamenvatting({
  team,
  spelers,
  context,
  alleScores,
  opmerkingen,
  vragen,
  pijlers,
  maxScore,
  leeftijdsgroep,
}: {
  team: TeamInfo;
  spelers: SpelerInfo[];
  context: ScoutingContext;
  alleScores: Record<string, Record<string, number>>;
  opmerkingen: Record<string, string>;
  vragen: ScoutingVraag[];
  pijlers: Pijler[];
  maxScore: number;
  leeftijdsgroep: LeeftijdsgroepNaam;
}) {
  const contextLabel = CONTEXT_LABELS[context] ?? context;

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-4 text-xl font-bold">Samenvatting</h2>

      {/* Team + context */}
      <div className="bg-surface-card mb-4 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{team.naam}</span>
          <span className="bg-ow-oranje/20 text-ow-oranje rounded-full px-3 py-1 text-xs font-semibold">
            {contextLabel}
          </span>
        </div>
        <p className="text-text-muted mt-1 text-xs">{spelers.length} spelers beoordeeld</p>
      </div>

      {/* Per speler mini-overzicht */}
      <div className="flex flex-col gap-3">
        {spelers.map((speler) => {
          const scores = alleScores[speler.id] ?? {};
          const heeftOpmerking = !!opmerkingen[speler.id];

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

              {/* Mini pijler-scores */}
              <div className="mt-2 flex flex-wrap gap-2">
                {pijlers.map((pijler) => {
                  const pijlerVragen = vragen.filter((v) => v.pijler === pijler);
                  const waarden = pijlerVragen
                    .map((v) => scores[v.id])
                    .filter((w): w is number => w != null);
                  const gem =
                    waarden.length > 0
                      ? (waarden.reduce((a, b) => a + b, 0) / waarden.length).toFixed(1)
                      : "-";

                  return (
                    <div
                      key={pijler}
                      className="flex items-center gap-1 rounded-lg bg-surface-card/5 px-2 py-1 text-[11px]"
                    >
                      <span>{PIJLER_ICONEN[pijler]}</span>
                      <span className="font-bold">{gem}</span>
                      <span className="text-text-muted">/{maxScore}</span>
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
