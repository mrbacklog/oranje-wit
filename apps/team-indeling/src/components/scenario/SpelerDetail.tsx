"use client";

import { useEffect, useCallback } from "react";
import type { SpelerData, HuidigData, SpelerspadEntry } from "./types";
import { SEIZOEN_JAAR, STATUS_KLEUREN } from "./types";

interface SpelerDetailProps {
  speler: SpelerData;
  onClose: () => void;
}

export default function SpelerDetail({ speler, onClose }: SpelerDetailProps) {
  const leeftijd = SEIZOEN_JAAR - speler.geboortejaar;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {speler.roepnaam} {speler.achternaam}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${STATUS_KLEUREN[speler.status]}`}
              />
              <span className="text-xs text-gray-500">{speler.status}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Geboortejaar</span>
              <p className="text-sm font-medium text-gray-800">
                {speler.geboortejaar}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Leeftijd (peildatum)</span>
              <p className="text-sm font-medium text-gray-800">{leeftijd} jaar</p>
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
                <p className="text-sm font-medium text-gray-800">
                  {speler.lidSinds}
                </p>
              </div>
            )}
            {speler.seizoenenActief != null && (
              <div>
                <span className="text-xs text-gray-500">Seizoenen actief</span>
                <p className="text-sm font-medium text-gray-800">
                  {speler.seizoenenActief}
                </p>
              </div>
            )}
          </div>

          {/* Huidig team */}
          {huidig?.team && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">
                Huidig team
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                {huidig.team}
                {huidig.kleur && (
                  <span className="text-xs text-orange-500">
                    ({huidig.kleur})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Spelerspad */}
          {spelerspad.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 block mb-2">
                Spelerspad
              </span>
              <div className="space-y-1">
                {spelerspad.map((entry, i) => (
                  <div
                    key={`${entry.seizoen}-${i}`}
                    className="flex items-center justify-between text-sm py-0.5"
                  >
                    <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                      {entry.seizoen}
                    </span>
                    <span className="text-gray-800 flex-1">{entry.team}</span>
                    {entry.kleur && (
                      <span className="text-xs text-gray-400">{entry.kleur}</span>
                    )}
                    {entry.spelvorm && (
                      <span className="text-xs text-gray-400 ml-2">
                        {entry.spelvorm}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notitie */}
          {speler.notitie && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">Notitie</span>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                {speler.notitie}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
