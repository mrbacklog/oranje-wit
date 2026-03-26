"use client";

import { SmileyScore, SterrenScore, SliderScore } from "@/components/score-input";
import type { ScoutingVraag, Pijler } from "@/lib/scouting/vragen";
import { PIJLER_LABELS, PIJLER_ICONEN } from "@/lib/scouting/vragen";
import type { SchaalType, LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { SpelerInitiaal } from "../speler-initiaal";

interface SpelerInfo {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  heeftFoto: boolean;
}

export function StapTeamBeoordeling({
  spelers,
  vragen,
  pijlers,
  actievePijler,
  onPijlerChange,
  alleScores,
  onScore,
  schaalType,
  leeftijdsgroep,
  pijlerVoortgang,
  teamGemiddelde,
  maxScore,
}: {
  spelers: SpelerInfo[];
  vragen: ScoutingVraag[];
  pijlers: Pijler[];
  actievePijler: Pijler;
  onPijlerChange: (p: Pijler) => void;
  alleScores: Record<string, Record<string, number>>;
  onScore: (spelerId: string, vraagId: string, waarde: number) => void;
  schaalType: SchaalType;
  leeftijdsgroep: LeeftijdsgroepNaam;
  pijlerVoortgang: Record<string, { klaar: number; totaal: number }>;
  teamGemiddelde: string | null;
  maxScore: number;
}) {
  const pijlerVragen = vragen.filter((v) => v.pijler === actievePijler);

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      {/* Horizontale pijler-tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {pijlers.map((pijler) => {
          const isActive = pijler === actievePijler;
          const voortgang = pijlerVoortgang[pijler];
          const isKlaar = voortgang && voortgang.klaar === voortgang.totaal;

          return (
            <button
              key={pijler}
              type="button"
              onClick={() => onPijlerChange(pijler)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-ow-oranje text-white shadow-lg"
                  : isKlaar
                    ? "bg-green-500/20 text-green-400"
                    : "bg-surface-card text-text-secondary hover:bg-surface-elevated"
              } `}
            >
              <span>{PIJLER_ICONEN[pijler]}</span>
              <span>{pijler}</span>
              {isKlaar && !isActive && <span className="text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Pijler-naam */}
      <h3 className="mb-4 text-lg font-bold">
        {PIJLER_ICONEN[actievePijler]} {PIJLER_LABELS[actievePijler]}
      </h3>

      {/* Spelers-lijst met score-invoer */}
      <div className="flex flex-col gap-4">
        {spelers.map((speler) => {
          const spelerScores = alleScores[speler.id] ?? {};

          return (
            <div key={speler.id} className="bg-surface-card rounded-2xl border border-white/10 p-4">
              {/* Speler header */}
              <div className="mb-3 flex items-center gap-3">
                <SpelerInitiaal roepnaam={speler.roepnaam} leeftijdsgroep={leeftijdsgroep} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {speler.roepnaam} {speler.achternaam}
                  </p>
                </div>
                {pijlerVragen.every((v) => spelerScores[v.id] != null) && (
                  <span className="text-sm text-green-400">✓</span>
                )}
              </div>

              {/* Score-invoer per vraag */}
              <div className="flex flex-col gap-3">
                {pijlerVragen.map((vraag) => (
                  <ScoreInvoerRij
                    key={`${speler.id}-${vraag.id}`}
                    vraag={vraag}
                    value={spelerScores[vraag.id] ?? null}
                    onChange={(v) => onScore(speler.id, vraag.id, v)}
                    schaalType={schaalType}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Team-gemiddelde floating bar */}
      {teamGemiddelde && (
        <div className="bg-surface-dark/95 sticky bottom-0 mt-4 rounded-2xl border border-white/10 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">
              Teamgemiddelde {PIJLER_LABELS[actievePijler]}
            </span>
            <span className="text-ow-oranje text-lg font-bold">
              {teamGemiddelde}
              <span className="text-text-muted text-xs font-normal">/{maxScore}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreInvoerRij({
  vraag,
  value,
  onChange,
  schaalType,
}: {
  vraag: ScoutingVraag;
  value: number | null;
  onChange: (v: number) => void;
  schaalType: SchaalType;
}) {
  if (schaalType === "smiley") {
    return <SmileyScore label={vraag.vraagTekst} value={value} onChange={onChange} />;
  }

  if (schaalType === "sterren") {
    return <SterrenScore label={vraag.vraagTekst} value={value} onChange={onChange} />;
  }

  return <SliderScore label={vraag.vraagTekst} value={value} onChange={onChange} />;
}
