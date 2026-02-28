"use client";

import { useState, useCallback } from "react";
import type { TeamData, SpelerData } from "./types";
import Spinner from "@/components/ui/Spinner";

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
  alleSpelers: _alleSpelers,
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
      setError(err instanceof Error ? err.message : "Onbekende fout bij analyse");
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
    <div className="dialog-overlay" onClick={handleClose}>
      <div
        className="dialog-panel flex max-h-[80vh] w-full max-w-lg flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="text-lg font-bold text-gray-900">What-if analyse</h3>
          <p className="mt-1 text-sm text-gray-500">
            Analyseer de impact van hypothetische wijzigingen op de teamindeling.
          </p>
        </div>

        <div className="dialog-body flex-1 overflow-auto">
          {/* Modus keuze */}
          <div className="flex gap-2">
            <button
              onClick={() => setModus("speler")}
              disabled={loading}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                modus === "speler"
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Speler selecteren
            </button>
            <button
              onClick={() => setModus("vrij")}
              disabled={loading}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                modus === "vrij"
                  ? "border-orange-400 bg-orange-50 text-orange-700"
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
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Kies een speler
              </label>
              <select
                id="whatif-speler"
                value={geselecteerdeSpeler}
                onChange={(e) => setGeselecteerdeSpeler(e.target.value)}
                disabled={loading}
                className="input disabled:opacity-50"
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
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="input disabled:opacity-50"
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-3">
              <Spinner size="md" className="text-orange-500" />
              <span className="text-sm text-orange-700">Claude analyseert de impact...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Resultaat */}
          {resultaat && (
            <div className="space-y-3">
              {/* Analyse */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <h4 className="mb-1 text-sm font-medium text-blue-800">Analyse</h4>
                <p className="text-sm text-blue-700">{resultaat.analyse}</p>
              </div>

              {/* Getroffen teams */}
              {resultaat.getrofenTeams.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-gray-700">Getroffen teams</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resultaat.getrofenTeams.map((team) => (
                      <span key={team} className="badge-orange">
                        {team}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggesties */}
              {resultaat.suggesties.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-gray-700">Suggesties</h4>
                  <ul className="space-y-1">
                    {resultaat.suggesties.map((suggestie, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-orange-400">*</span>
                        {suggestie}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn-ghost disabled:opacity-50"
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
              className="btn-primary"
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
              className="btn-primary"
            >
              Nieuwe analyse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
