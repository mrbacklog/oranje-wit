"use client";

import { useState, useCallback } from "react";
import { createScenario } from "@/app/scenarios/actions";
import type { Keuze } from "@/app/blauwdruk/actions";

interface NieuwScenarioDialogProps {
  blauwdrukId: string;
  keuzes: Keuze[];
}

export default function NieuwScenarioDialog({
  blauwdrukId,
  keuzes,
}: NieuwScenarioDialogProps) {
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState("");
  const [toelichting, setToelichting] = useState("");
  const [keuzeWaardes, setKeuzeWaardes] = useState<Record<string, string>>({});
  const [bezig, setBezig] = useState(false);

  const handleKeuzeChange = useCallback((keuzeId: string, waarde: string) => {
    setKeuzeWaardes((prev) => ({ ...prev, [keuzeId]: waarde }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!naam.trim()) return;
    setBezig(true);
    try {
      await createScenario(blauwdrukId, naam.trim(), toelichting.trim(), keuzeWaardes);
    } catch {
      // redirect gooit een NEXT_REDIRECT error — dat is normaal
    } finally {
      setBezig(false);
    }
  }, [blauwdrukId, naam, toelichting, keuzeWaardes]);

  const handleReset = useCallback(() => {
    setNaam("");
    setToelichting("");
    setKeuzeWaardes({});
    setOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        + Nieuw scenario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Nieuw scenario
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Kies waardes voor de keuzes en maak een teamstructuur aan.
              </p>
            </div>

            {/* Formulier */}
            <div className="px-6 py-4 space-y-5">
              {/* Naam */}
              <div>
                <label
                  htmlFor="scenario-naam"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Naam *
                </label>
                <input
                  id="scenario-naam"
                  type="text"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  placeholder="Bijv. Standaard indeling"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                />
              </div>

              {/* Keuzes */}
              {keuzes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Keuzes
                  </h4>
                  {keuzes.map((keuze) => (
                    <div key={keuze.id}>
                      <p className="text-sm text-gray-600 mb-2">
                        {keuze.vraag}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {keuze.opties.map((optie) => (
                          <label
                            key={optie}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                              keuzeWaardes[keuze.id] === optie
                                ? "bg-orange-50 border-orange-400 text-orange-700"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`keuze-${keuze.id}`}
                              value={optie}
                              checked={keuzeWaardes[keuze.id] === optie}
                              onChange={() =>
                                handleKeuzeChange(keuze.id, optie)
                              }
                              className="sr-only"
                            />
                            {optie}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Toelichting */}
              <div>
                <label
                  htmlFor="scenario-toelichting"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Toelichting (optioneel)
                </label>
                <textarea
                  id="scenario-toelichting"
                  value={toelichting}
                  onChange={(e) => setToelichting(e.target.value)}
                  placeholder="Eventuele toelichting of aannames..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={handleReset}
                disabled={bezig}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSubmit}
                disabled={bezig || !naam.trim()}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bezig ? "Aanmaken..." : "Scenario aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
