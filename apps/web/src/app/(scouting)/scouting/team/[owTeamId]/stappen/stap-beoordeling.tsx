"use client";

import { useMemo } from "react";
import { SmileyScore, SterrenScore, SliderScore } from "@/components/scouting/score-input";
import type { ScoutingGroepConfigV3, ScoutingVraagV3 } from "@/lib/scouting/vragen";
import type { PijlerCode } from "@oranje-wit/types";
import { SpelerInitiaal } from "../speler-initiaal";

interface SpelerInfo {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  heeftFoto: boolean;
}

type GroeiIndicator = "geen" | "weinig" | "normaal" | "veel";

/**
 * V3 Team beoordeling: alleen kern-items, per pijler, per speler.
 * Met groei-indicator en sociale veiligheid per speler.
 */
export function StapTeamBeoordelingV3({
  spelers,
  kernItems,
  config,
  actievePijler,
  onPijlerChange,
  alleScores,
  onScore,
  groeiPerSpeler,
  onGroeiChange,
  socialeVeiligheidPerSpeler,
  onSocialeVeiligheidChange,
}: {
  spelers: SpelerInfo[];
  kernItems: ScoutingVraagV3[];
  config: ScoutingGroepConfigV3;
  actievePijler: PijlerCode;
  onPijlerChange: (p: PijlerCode) => void;
  alleScores: Record<string, Record<string, number>>;
  onScore: (spelerId: string, vraagId: string, waarde: number) => void;
  groeiPerSpeler: Record<string, GroeiIndicator>;
  onGroeiChange: (spelerId: string, v: GroeiIndicator) => void;
  socialeVeiligheidPerSpeler: Record<string, number | boolean>;
  onSocialeVeiligheidChange: (spelerId: string, v: number | boolean) => void;
}) {
  // Items per pijler (alleen kern)
  const itemsPerPijler = useMemo(() => {
    const result: Record<string, ScoutingVraagV3[]> = {};
    for (const p of config.pijlers) {
      result[p.code] = kernItems.filter((i) => i.pijlerCode === p.code);
    }
    return result;
  }, [config.pijlers, kernItems]);

  const pijlerItems = itemsPerPijler[actievePijler] ?? [];

  // Voortgang per pijler
  const pijlerVoortgang = useMemo(() => {
    const result: Record<string, { klaar: number; totaal: number }> = {};
    for (const p of config.pijlers) {
      const items = itemsPerPijler[p.code] ?? [];
      let klaar = 0;
      for (const speler of spelers) {
        const scores = alleScores[speler.id] ?? {};
        const alleIngevuld = items.every((v) => scores[v.id] != null);
        if (alleIngevuld) klaar++;
      }
      result[p.code] = { klaar, totaal: spelers.length };
    }
    return result;
  }, [alleScores, config.pijlers, itemsPerPijler, spelers]);

  return (
    <div className="animate-[fadeIn_300ms_ease]">
      {/* Horizontale pijler-tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {config.pijlers.map((pijler) => {
          const isActive = pijler.code === actievePijler;
          const voortgang = pijlerVoortgang[pijler.code];
          const isKlaar = voortgang && voortgang.klaar === voortgang.totaal;

          return (
            <button
              key={pijler.code}
              type="button"
              onClick={() => onPijlerChange(pijler.code)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-ow-oranje text-white shadow-lg"
                  : isKlaar
                    ? "bg-green-500/20 text-green-400"
                    : "bg-surface-card text-text-secondary hover:bg-surface-elevated"
              } `}
            >
              <span>{pijler.icoon}</span>
              <span className="max-w-[60px] truncate">{pijler.naam}</span>
              {isKlaar && !isActive && <span className="text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Pijler-naam */}
      <h3 className="mb-4 text-lg font-bold">
        {config.pijlers.find((p) => p.code === actievePijler)?.icoon}{" "}
        {config.pijlers.find((p) => p.code === actievePijler)?.naam}
      </h3>

      {/* Spelers-lijst met score-invoer */}
      <div className="flex flex-col gap-4">
        {spelers.map((speler) => {
          const spelerScores = alleScores[speler.id] ?? {};

          return (
            <div key={speler.id} className="bg-surface-card rounded-2xl border border-white/10 p-4">
              {/* Speler header */}
              <div className="mb-3 flex items-center gap-3">
                <SpelerInitiaal roepnaam={speler.roepnaam} leeftijdsgroep={config.band} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {speler.roepnaam} {speler.achternaam}
                  </p>
                </div>
                {pijlerItems.every((v) => spelerScores[v.id] != null) && (
                  <span className="text-sm text-green-400">✓</span>
                )}
              </div>

              {/* Score-invoer per item */}
              <div className="flex flex-col gap-3">
                {pijlerItems.map((item) => (
                  <ScoreInvoerRijV3
                    key={`${speler.id}-${item.id}`}
                    item={item}
                    value={spelerScores[item.id] ?? null}
                    onChange={(v) => onScore(speler.id, item.id, v)}
                    schaalType={config.schaalType}
                    schaalMax={config.schaalMax}
                  />
                ))}
              </div>

              {/* Groei-indicator (compact in team-mode) */}
              <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
                <span className="text-text-muted text-[10px] font-semibold uppercase">Groei:</span>
                {(["geen", "weinig", "normaal", "veel"] as GroeiIndicator[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onGroeiChange(speler.id, g)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                      (groeiPerSpeler[speler.id] ?? "normaal") === g
                        ? "bg-ow-oranje/20 text-ow-oranje"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreInvoerRijV3({
  item,
  value,
  onChange,
  schaalType,
  schaalMax,
}: {
  item: ScoutingVraagV3;
  value: number | null;
  onChange: (v: number) => void;
  schaalType: string;
  schaalMax: number;
}) {
  if (schaalType === "ja_nogniet") {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-primary min-w-0 flex-1 text-sm">{item.vraagTekst}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChange(0)}
            className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
              value === 0 ? "bg-red-500/20 text-red-400" : "bg-surface-elevated text-text-muted"
            }`}
          >
            Nee
          </button>
          <button
            type="button"
            onClick={() => onChange(1)}
            className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
              value === 1 ? "bg-green-500/20 text-green-400" : "bg-surface-elevated text-text-muted"
            }`}
          >
            Ja
          </button>
        </div>
      </div>
    );
  }

  if (schaalType === "goed_oke_nogniet") {
    return (
      <SmileyScore
        label={item.vraagTekst}
        value={value != null ? Math.round(value * 2 + 1) : null}
        onChange={(v) => onChange((v - 1) / 2)}
      />
    );
  }

  if (schaalType === "sterren") {
    return <SterrenScore label={item.vraagTekst} value={value} onChange={onChange} />;
  }

  // Slider 1-10
  return (
    <SliderScore
      label={item.vraagTekst}
      value={value}
      onChange={onChange}
      snelkeuze={[
        { label: "Zwak", value: 2 },
        { label: "Gem", value: 5 },
        { label: "Goed", value: 7 },
        { label: "Top", value: 9 },
      ]}
    />
  );
}
