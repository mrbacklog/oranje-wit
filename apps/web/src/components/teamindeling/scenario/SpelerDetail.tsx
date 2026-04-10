"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import type { EvaluatieData } from "@oranje-wit/types";
import type { SpelerData, HuidigData, SpelerspadEntry, PinData } from "./types";
import {
  STATUS_KLEUREN,
  kleurIndicatie,
  KLEUR_DOT,
  korfbalLeeftijd,
  KLEUR_LABELS,
  KLEUR_BADGE_KLEUREN,
} from "./types";
import SpelerAvatar from "@/components/teamindeling/ui/SpelerAvatar";
import FotoLightbox from "@/components/teamindeling/ui/FotoLightbox";
import AfmeldBadge from "./AfmeldBadge";
import EvaluatieScores from "./EvaluatieScores";
import OpmerkingPopover from "./OpmerkingPopover";
import RatingEditor from "./RatingEditor";
import RankingBadge from "./RankingBadge";
import Spinner from "@/components/teamindeling/ui/Spinner";

/** Groepeer evaluaties per seizoen, rondes in oplopende volgorde */
function groepeerPerSeizoen(evaluaties: EvaluatieData[]): [string, EvaluatieData[]][] {
  const map = new Map<string, EvaluatieData[]>();
  for (const ev of evaluaties) {
    const list = map.get(ev.seizoen) ?? [];
    list.push(ev);
    map.set(ev.seizoen, list);
  }
  // Sorteer rondes oplopend binnen elk seizoen
  for (const [, rondes] of map) {
    rondes.sort((a, b) => a.ronde - b.ronde);
  }
  // Seizoenen aflopend (nieuwste eerst -- input is al zo gesorteerd)
  return Array.from(map.entries());
}

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw (potentieel)",
  NIEUW_DEFINITIEF: "Nieuw (definitief)",
  ALGEMEEN_RESERVE: "Algemeen reserve",
};

interface SpelerDetailProps {
  speler: SpelerData;
  teamId?: string;
  teamNaam?: string;
  pin?: PinData | null;
  showRanking?: boolean;
  kadersId?: string;
  onClose: () => void;
  onTogglePin?: (spelerId: string, teamNaam: string, teamId: string) => void;
}

export default function SpelerDetail({
  speler,
  teamId,
  teamNaam,
  pin,
  showRanking,
  kadersId,
  onClose,
  onTogglePin,
}: SpelerDetailProps) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const spelerspad = (speler.spelerspad ?? []) as SpelerspadEntry[];

  // Tab state
  const [activeTab, setActiveTab] = useState<"overzicht">("overzicht");

  // Foto lightbox
  const [fotoOpen, setFotoOpen] = useState(false);

  // Evaluatie data (lazy fetch)
  const [evaluaties, setEvaluaties] = useState<EvaluatieData[] | null>(null);
  const [evalLoading, setEvalLoading] = useState(true);

  // Fetch evaluaties
  useEffect(() => {
    let cancelled = false;
    const url = `/api/spelers/${speler.id}/evaluaties`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setEvaluaties(data.evaluaties ?? []);
      })
      .catch((err) => {
        logger.warn("Evaluaties ophalen mislukt:", err);
      })
      .finally(() => {
        if (!cancelled) setEvalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [speler.id]);

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
    <div className="dialog-overlay">
      <div
        className="dialog-panel flex max-h-[85vh] w-full max-w-xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header -- niet scrollbaar */}
        <div className="relative shrink-0 px-6 pt-6 pb-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>

          {/* Twee-koloms header */}
          <div className="flex gap-5">
            {/* Links: grote foto */}
            <SpelerAvatar
              spelerId={speler.id}
              naam={speler.roepnaam}
              size="xl"
              className="h-36 w-36 cursor-pointer rounded-full"
              onClick={() => setFotoOpen(true)}
            />

            {/* Rechts: info */}
            <div className="min-w-0 flex-1">
              {/* Naam + ranking */}
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {speler.roepnaam} {speler.achternaam}
                </h3>
                {showRanking && leeftijd < 20 && (
                  <RankingBadge rating={speler.rating} size="detail" />
                )}
              </div>

              {/* Status + afmeldbadge */}
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_KLEUREN[speler.status]}`} />
                <span className="text-xs text-gray-500">
                  {STATUS_LABELS[speler.status] ?? speler.status}
                </span>
                {speler.afmelddatum && (
                  <AfmeldBadge afmelddatum={speler.afmelddatum} variant="full" />
                )}
              </div>

              {/* Info-grid (compact) */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
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
                {leeftijd < 20 && (
                  <RatingEditor
                    spelerId={speler.id}
                    rating={speler.rating}
                    ratingBerekend={speler.ratingBerekend}
                  />
                )}
              </div>

              {/* Team badge + Pin inline */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {huidig?.team && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-sm text-orange-700">
                    {huidig.team}
                    {huidig.kleur && (
                      <span className="text-xs text-orange-500">({huidig.kleur})</span>
                    )}
                  </span>
                )}
                {onTogglePin && teamNaam && teamId && (
                  <button
                    onClick={() => onTogglePin(speler.id, teamNaam, teamId)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      pin
                        ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill={pin ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={pin ? "0" : "2"}
                    >
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                    {pin ? "Ontpin" : "Pin vast"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigatie */}
        <div className="shrink-0 border-b border-gray-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab("overzicht")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "overzicht"
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overzicht
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="dialog-body flex-1 overflow-y-auto">
          {activeTab === "overzicht" && (
            <>
              {/* Spelerspad */}
              {spelerspad.length > 0 && (
                <div>
                  <span className="mb-2 block text-xs text-gray-500">
                    Spelerspad ({spelerspad.length} seizoenen)
                  </span>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100">
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

              {/* Trainer-evaluaties (compact) */}
              <div>
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Trainer-evaluaties</span>
                </div>

                {evalLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner size="sm" className="text-orange-500" />
                    <span className="text-xs text-gray-400">Evaluaties laden...</span>
                  </div>
                ) : evaluaties && evaluaties.length > 0 ? (
                  <div className="space-y-4">
                    {groepeerPerSeizoen(evaluaties).map(([seizoen, rondes]) => (
                      <div key={seizoen}>
                        <span className="mb-1.5 block text-xs font-medium text-gray-700">
                          {seizoen}
                        </span>
                        <div className="space-y-0.5">
                          {rondes.map((ev, i) => (
                            <div
                              key={`${ev.seizoen}-${ev.ronde}-${ev.coach ?? i}`}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                            >
                              <span className="w-6 shrink-0 text-[10px] font-medium text-gray-400">
                                R{ev.ronde}
                              </span>
                              <span className="w-24 shrink-0 truncate text-xs font-medium text-gray-700">
                                {ev.coach ?? "Onbekend"}
                              </span>
                              <div className="flex-1">
                                <EvaluatieScores scores={ev.scores} compact />
                              </div>
                              <OpmerkingPopover
                                spelerOpmerkingen={ev.scores.speler_opmerkingen}
                                trainerOpmerking={ev.opmerking}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-1 text-xs text-gray-400">Geen evaluaties beschikbaar.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Foto lightbox */}
      {fotoOpen && (
        <FotoLightbox
          spelerId={speler.id}
          naam={`${speler.roepnaam} ${speler.achternaam}`}
          onClose={() => setFotoOpen(false)}
        />
      )}
    </div>
  );
}
