"use client";

import { useEffect, useCallback } from "react";
import type { SpelerData, HuidigData, SpelerspadEntry } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

interface SpelerDetailProps {
  speler: SpelerData;
  onClose: () => void;
}

export default function SpelerDetail({ speler, onClose }: SpelerDetailProps) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const spelerspad = (speler.spelerspad ?? []) as SpelerspadEntry[];

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
        className="dialog-panel max-h-[80vh] w-full max-w-md overflow-y-auto"
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
                <span className="text-xs text-gray-500">{speler.status}</span>
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

        {/* Info */}
        <div className="dialog-body">
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
              <span className="mb-2 block text-xs text-gray-500">Spelerspad</span>
              <div className="space-y-1">
                {spelerspad.map((entry, i) => (
                  <div
                    key={`${entry.seizoen}-${i}`}
                    className="flex items-center justify-between py-0.5 text-sm"
                  >
                    <span className="w-20 flex-shrink-0 text-xs text-gray-500">
                      {entry.seizoen}
                    </span>
                    <span className="flex-1 text-gray-800">{entry.team}</span>
                    {entry.kleur && <span className="text-xs text-gray-400">{entry.kleur}</span>}
                    {entry.spelvorm && (
                      <span className="ml-2 text-xs text-gray-400">{entry.spelvorm}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
