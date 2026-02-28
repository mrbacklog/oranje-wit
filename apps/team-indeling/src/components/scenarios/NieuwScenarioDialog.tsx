"use client";

import { useState, useCallback } from "react";
import { createScenario } from "@/app/scenarios/actions";
import type { Keuze } from "@/app/blauwdruk/actions";

interface NieuwScenarioDialogProps {
  blauwdrukId: string;
  keuzes: Keuze[];
}

export default function NieuwScenarioDialog({ blauwdrukId, keuzes }: NieuwScenarioDialogProps) {
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
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Nieuw scenario
      </button>

      {open && (
        <div className="dialog-overlay">
          <div className="dialog-panel max-h-[90vh] w-full max-w-lg overflow-y-auto">
            {/* Header */}
            <div className="dialog-header">
              <h3 className="text-lg font-bold text-gray-900">Nieuw scenario</h3>
              <p className="mt-1 text-sm text-gray-500">
                Kies waardes voor de keuzes en maak een teamstructuur aan.
              </p>
            </div>

            {/* Formulier */}
            <div className="dialog-body">
              {/* Naam */}
              <div>
                <label
                  htmlFor="scenario-naam"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Naam *
                </label>
                <input
                  id="scenario-naam"
                  type="text"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  placeholder="Bijv. Standaard indeling"
                  className="input"
                />
              </div>

              {/* Keuzes */}
              {keuzes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Keuzes</h4>
                  {keuzes.map((keuze) => (
                    <div key={keuze.id}>
                      <p className="mb-2 text-sm text-gray-600">{keuze.vraag}</p>
                      <div className="flex flex-wrap gap-2">
                        {keuze.opties.map((optie) => (
                          <label
                            key={optie}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              keuzeWaardes[keuze.id] === optie
                                ? "border-orange-400 bg-orange-50 text-orange-700"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`keuze-${keuze.id}`}
                              value={optie}
                              checked={keuzeWaardes[keuze.id] === optie}
                              onChange={() => handleKeuzeChange(keuze.id, optie)}
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
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Toelichting (optioneel)
                </label>
                <textarea
                  id="scenario-toelichting"
                  value={toelichting}
                  onChange={(e) => setToelichting(e.target.value)}
                  placeholder="Eventuele toelichting of aannames..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="dialog-footer">
              <button onClick={handleReset} disabled={bezig} className="btn-ghost">
                Annuleren
              </button>
              <button
                onClick={handleSubmit}
                disabled={bezig || !naam.trim()}
                className="btn-primary"
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
