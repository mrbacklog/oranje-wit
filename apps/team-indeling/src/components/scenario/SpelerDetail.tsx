"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SpelerData,
  HuidigData,
  SpelerspadEntry,
  EvaluatieData,
  TeamGemiddelde,
} from "./types";
import {
  STATUS_KLEUREN,
  kleurIndicatie,
  KLEUR_DOT,
  korfbalLeeftijd,
  KLEUR_LABELS,
  KLEUR_BADGE_KLEUREN,
} from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";
import EvaluatieScores from "./EvaluatieScores";
import Spinner from "@/components/ui/Spinner";

interface SpelerDetailProps {
  speler: SpelerData;
  teamId?: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw (potentieel)",
  NIEUW_DEFINITIEF: "Nieuw (definitief)",
};

export default function SpelerDetail({ speler, teamId, onClose }: SpelerDetailProps) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const spelerspad = (speler.spelerspad ?? []) as SpelerspadEntry[];

  // Evaluatie data (lazy fetch)
  const [evaluaties, setEvaluaties] = useState<EvaluatieData[] | null>(null);
  const [teamGem, setTeamGem] = useState<TeamGemiddelde | null>(null);
  const [evalLoading, setEvalLoading] = useState(true);
  const [toonVergelijking, setToonVergelijking] = useState(!!teamId);

  useEffect(() => {
    let cancelled = false;
    const url = teamId
      ? `/api/spelers/${speler.id}/evaluaties?teamId=${teamId}`
      : `/api/spelers/${speler.id}/evaluaties`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setEvaluaties(data.evaluaties ?? []);
        setTeamGem(data.teamVergelijking ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEvalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [speler.id, teamId]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-panel max-h-[85vh] w-full max-w-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SpelerAvatar
              spelerId={speler.id}
              naam={speler.roepnaam}
              size="md"
              className="h-10 w-10 text-sm"
            />
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {speler.roepnaam} {speler.achternaam}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_KLEUREN[speler.status]}`} />
                <span className="text-xs text-gray-500">
                  {STATUS_LABELS[speler.status] ?? speler.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="dialog-body">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Korfballeeftijd</span>
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                {kleur && <span className={`h-2 w-2 rounded-full ${KLEUR_DOT[kleur]}`} />}
                {leeftijd.toFixed(2)} jaar
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Geboortejaar</span>
              <p className="text-sm text-gray-500">{speler.geboortejaar}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Geslacht</span>
              <p className="text-sm font-medium text-gray-800">
                {speler.geslacht === "M" ? "Man" : "Vrouw"}
              </p>
            </div>
            {speler.lidSinds && (
              <div>
                <span className="text-xs text-gray-500">Lid sinds</span>
                <p className="text-sm font-medium text-gray-800">{speler.lidSinds}</p>
              </div>
            )}
            {speler.seizoenenActief != null && (
              <div>
                <span className="text-xs text-gray-500">Seizoenen actief</span>
                <p className="text-sm font-medium text-gray-800">{speler.seizoenenActief}</p>
              </div>
            )}
          </div>

          {/* Huidig team */}
          {huidig?.team && (
            <div>
              <span className="mb-1 block text-xs text-gray-500">Huidig team</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-sm text-orange-700">
                {huidig.team}
                {huidig.kleur && <span className="text-xs text-orange-500">({huidig.kleur})</span>}
              </span>
            </div>
          )}

          {/* Spelerspad */}
          {spelerspad.length > 0 && (
            <div>
              <span className="mb-2 block text-xs text-gray-500">
                Spelerspad ({spelerspad.length} seizoenen)
              </span>
              <div className="rounded-lg border border-gray-100">
                {spelerspad.map((entry, i) => (
                  <div
                    key={`${entry.seizoen}-${i}`}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                      i > 0 ? "border-t border-gray-50" : ""
                    }`}
                  >
                    <span className="w-20 shrink-0 text-xs text-gray-400 tabular-nums">
                      {entry.seizoen}
                    </span>
                    <span className="flex-1 font-medium text-gray-800">{entry.team}</span>
                    {entry.kleur && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          KLEUR_BADGE_KLEUREN[entry.kleur] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {KLEUR_LABELS[entry.kleur] ?? entry.kleur}
                      </span>
                    )}
                    {entry.spelvorm && (
                      <span className="text-[10px] text-gray-400">{entry.spelvorm}</span>
                    )}
                    {entry.niveau && (
                      <span className="text-[10px] text-gray-400">{entry.niveau}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluaties */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Evaluaties</span>
              {teamGem && (
                <label className="flex cursor-pointer items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">Vergelijk met team</span>
                  <button
                    onClick={() => setToonVergelijking(!toonVergelijking)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      toonVergelijking ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                        toonVergelijking ? "translate-x-3.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              )}
            </div>

            {evalLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Spinner size="sm" className="text-orange-500" />
                <span className="text-xs text-gray-400">Evaluaties laden...</span>
              </div>
            ) : evaluaties && evaluaties.length > 0 ? (
              <div className="space-y-3">
                {evaluaties.map((ev) => (
                  <div key={ev.seizoen} className="rounded-lg border border-gray-100 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{ev.seizoen}</span>
                      {ev.coach && (
                        <span className="text-[10px] text-gray-400">Coach: {ev.coach}</span>
                      )}
                    </div>
                    <EvaluatieScores
                      scores={ev.scores}
                      teamGem={teamGem}
                      toonTeamVergelijking={toonVergelijking}
                    />
                    {ev.scores.speler_opmerkingen && (
                      <p className="mt-2 rounded bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
                        {ev.scores.speler_opmerkingen}
                      </p>
                    )}
                    {ev.opmerking && (
                      <p className="mt-1 text-[11px] text-gray-500 italic">{ev.opmerking}</p>
                    )}
                  </div>
                ))}
                {toonVergelijking && teamGem && (
                  <p className="text-[10px] text-gray-400">
                    Team-gemiddelde op basis van {teamGem.aantalSpelers} spelers (grijze lijn)
                  </p>
                )}
              </div>
            ) : (
              <p className="py-1 text-xs text-gray-400">Geen evaluaties beschikbaar.</p>
            )}
          </div>

          {/* Notitie */}
          {speler.notitie && (
            <div>
              <span className="mb-1 block text-xs text-gray-500">Notitie</span>
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {speler.notitie}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
