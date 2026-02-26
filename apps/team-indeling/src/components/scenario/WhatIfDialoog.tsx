"use client";

import { useState, useCallback } from "react";
import type { TeamData, SpelerData } from "./types";

interface WhatIfDialoogProps {
  open: boolean;
  onClose: () => void;
  teams: TeamData[];
  alleSpelers: SpelerData[];
}

interface WhatIfResultaat {
  analyse: string;
  getrofenTeams: string[];
  suggesties: string[];
}

export default function WhatIfDialoog({
  open,
  onClose,
  teams,
  alleSpelers,
}: WhatIfDialoogProps) {
  const [modus, setModus] = useState<"speler" | "vrij">("speler");
  const [geselecteerdeSpeler, setGeselecteerdeSpeler] = useState("");
  const [vrijVraag, setVrijVraag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<WhatIfResultaat | null>(null);

  // Alle spelers die in minstens 1 team zitten
  const ingedeeldeSpelers = new Map<string, SpelerData>();
  for (const team of teams) {
    for (const ts of team.spelers) {
      if (!ingedeeldeSpelers.has(ts.spelerId)) {
        ingedeeldeSpelers.set(ts.spelerId, ts.speler);
      }
    }
  }

  const handleAnalyseer = useCallback(async () => {
    let vraag: string;

    if (modus === "speler") {
      if (!geselecteerdeSpeler) return;
      const speler = ingedeeldeSpelers.get(geselecteerdeSpeler);
      if (!speler) return;
      // Zoek in welk team deze speler zit
      const huidigTeam = teams.find((t) =>
        t.spelers.some((ts) => ts.spelerId === geselecteerdeSpeler)
      );
      vraag = `Wat als ${speler.roepnaam} ${speler.achternaam} (${speler.geboortejaar}, ${speler.geslacht === "M" ? "jongen" : "meisje"}) ${huidigTeam ? `wordt verplaatst uit ${huidigTeam.naam}` : "niet meer beschikbaar is"}?`;
    } else {
      if (!vrijVraag.trim()) return;
      vraag = vrijVraag.trim();
    }

    setLoading(true);
    setError(null);
    setResultaat(null);

    try {
      const teamsData = teams.map((t) => ({
        naam: t.naam,
        categorie: t.categorie,
        spelers: t.spelers.map((ts) => ({
          naam: `${ts.speler.roepnaam} ${ts.speler.achternaam}`,
          geboortejaar: ts.speler.geboortejaar,
          geslacht: ts.speler.geslacht,
        })),
      }));

      const response = await fetch("/api/ai/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vraag, teams: teamsData }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Er ging iets mis");
        return;
      }

      setResultaat(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Onbekende fout bij analyse"
      );
    } finally {
      setLoading(false);
    }
  }, [modus, geselecteerdeSpeler, vrijVraag, teams, ingedeeldeSpelers]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setError(null);
    setResultaat(null);
    setGeselecteerdeSpeler("");
    setVrijVraag("");
    onClose();
  }, [loading, onClose]);

  if (!open) return null;

  // Sort spelers by name for dropdown, filter only those known in alleSpelers
  const spelerOpties = Array.from(ingedeeldeSpelers.entries())
    .map(([id, s]) => ({
      id,
      label: `${s.roepnaam} ${s.achternaam} (${s.geboortejaar})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            What-if analyse
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Analyseer de impact van hypothetische wijzigingen op de
            teamindeling.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-auto flex-1">
          {/* Modus keuze */}
          <div className="flex gap-2">
            <button
              onClick={() => setModus("speler")}
              disabled={loading}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                modus === "speler"
                  ? "bg-orange-50 border-orange-400 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Speler selecteren
            </button>
            <button
              onClick={() => setModus("vrij")}
              disabled={loading}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                modus === "vrij"
                  ? "bg-orange-50 border-orange-400 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Vrije vraag
            </button>
          </div>

          {/* Speler selectie */}
          {modus === "speler" && (
            <div>
              <label
                htmlFor="whatif-speler"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Kies een speler
              </label>
              <select
                id="whatif-speler"
                value={geselecteerdeSpeler}
                onChange={(e) => setGeselecteerdeSpeler(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 disabled:opacity-50"
              >
                <option value="">Selecteer een speler...</option>
                {spelerOpties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vrije vraag */}
          {modus === "vrij" && (
            <div>
              <label
                htmlFor="whatif-vraag"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stel een what-if vraag
              </label>
              <textarea
                id="whatif-vraag"
                value={vrijVraag}
                onChange={(e) => setVrijVraag(e.target.value)}
                placeholder='Bijv. "Wat als er 3 nieuwe spelers van geboortejaar 2016 bijkomen?" of "Wat als Team Oranje-2 wordt opgeheven?"'
                rows={3}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 disabled:opacity-50"
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <svg
                className="animate-spin h-5 w-5 text-orange-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-orange-700">
                Claude analyseert de impact...
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Resultaat */}
          {resultaat && (
            <div className="space-y-3">
              {/* Analyse */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Analyse
                </h4>
                <p className="text-sm text-blue-700">{resultaat.analyse}</p>
              </div>

              {/* Getroffen teams */}
              {resultaat.getrofenTeams.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Getroffen teams
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resultaat.getrofenTeams.map((team) => (
                      <span
                        key={team}
                        className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        {team}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggesties */}
              {resultaat.suggesties.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Suggesties
                  </h4>
                  <ul className="space-y-1">
                    {resultaat.suggesties.map((suggestie, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="text-orange-400 mt-0.5">*</span>
                        {suggestie}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Sluiten
          </button>
          {!resultaat && (
            <button
              onClick={handleAnalyseer}
              disabled={
                loading ||
                (modus === "speler" && !geselecteerdeSpeler) ||
                (modus === "vrij" && !vrijVraag.trim())
              }
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Bezig..." : "Analyseer"}
            </button>
          )}
          {resultaat && (
            <button
              onClick={() => {
                setResultaat(null);
                setError(null);
              }}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
            >
              Nieuwe analyse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
