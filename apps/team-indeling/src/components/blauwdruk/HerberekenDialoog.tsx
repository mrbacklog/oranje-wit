"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import type { EvaluatieRondeData } from "./UitgangspositiePanel";

interface SpelerPreview {
  spelerId: string;
  roepnaam: string;
  achternaam: string;
  niveau: number | null;
  huidigeRating: number | null;
  nieuweRating: number;
  verschilPct: number | null;
}

interface HerberekenDialoogProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  teamNaam: string;
  teamscore: number;
  seizoen: string;
  evaluatieRondes: EvaluatieRondeData[];
}

export default function HerberekenDialoog({
  open,
  onClose,
  teamId,
  teamNaam,
  teamscore,
  seizoen,
  evaluatieRondes,
}: HerberekenDialoogProps) {
  const [spelers, setSpelers] = useState<SpelerPreview[]>([]);
  const [aanpassingen, setAanpassingen] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geselecteerdeRonde, setGeselecteerdeRonde] = useState<number | null>(null);

  // Fetch preview bij openen of bij ronde-wissel
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch("/api/ratings/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        teamscore,
        seizoen,
        ...(geselecteerdeRonde != null ? { ronde: geselecteerdeRonde } : {}),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.spelers) {
          setSpelers(data.data.spelers);
          const initial: Record<string, number> = {};
          for (const s of data.data.spelers) {
            initial[s.spelerId] = s.nieuweRating;
          }
          setAanpassingen(initial);
        }
      })
      .catch((error) => logger.warn("Preview ophalen mislukt:", error))
      .finally(() => setLoading(false));
  }, [open, teamId, teamscore, seizoen, geselecteerdeRonde]);

  const handleRatingChange = useCallback((spelerId: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 300) {
      setAanpassingen((prev) => ({ ...prev, [spelerId]: num }));
    }
  }, []);

  const handleOpslaan = useCallback(async () => {
    setSaving(true);
    try {
      const ratings = Object.entries(aanpassingen).map(([spelerId, rating]) => ({
        spelerId,
        rating,
      }));

      const res = await fetch("/api/ratings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings }),
      });

      if (res.ok) {
        onClose();
      } else {
        logger.warn("Batch opslaan mislukt:", await res.text());
      }
    } catch (error) {
      logger.warn("Batch opslaan mislukt:", error);
    } finally {
      setSaving(false);
    }
  }, [aanpassingen, onClose]);

  if (!open) return null;

  const berekenVerschilPct = (spelerId: string, huidigeRating: number | null): number | null => {
    const nieuw = aanpassingen[spelerId];
    if (nieuw == null || huidigeRating == null || huidigeRating === 0) return null;
    return Math.round(((nieuw - huidigeRating) / huidigeRating) * 1000) / 10;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Spelersratings herberekenen — {teamNaam}
            </h3>
            {evaluatieRondes.length > 0 && (
              <select
                value={geselecteerdeRonde ?? ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setGeselecteerdeRonde(e.target.value ? Number(e.target.value) : null)
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">Laatste ronde</option>
                {evaluatieRondes.map((r) => (
                  <option key={r.id} value={r.ronde}>
                    R{r.ronde} — {r.naam}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Teamscore: <span className="font-medium tabular-nums">{teamscore}</span> — Pas hieronder
            de berekende ratings aan indien nodig.
          </p>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-400">Berekenen...</span>
            </div>
          ) : spelers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-400">Geen spelers in dit team</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Speler</th>
                  <th className="w-16 py-2 text-center font-medium">Niveau</th>
                  <th className="w-20 py-2 text-right font-medium">Huidig</th>
                  <th className="w-24 py-2 text-right font-medium">Nieuw</th>
                  <th className="w-20 py-2 text-right font-medium">Verschil</th>
                </tr>
              </thead>
              <tbody>
                {spelers.map((speler) => {
                  const verschil = berekenVerschilPct(speler.spelerId, speler.huidigeRating);
                  const isAangepast = aanpassingen[speler.spelerId] !== speler.nieuweRating;

                  return (
                    <tr key={speler.spelerId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-4">
                        <span className="font-medium text-gray-900">{speler.roepnaam}</span>{" "}
                        <span className="text-gray-500">{speler.achternaam}</span>
                      </td>
                      <td className="py-2 text-center">
                        {speler.niveau != null ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                            {speler.niveau}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-gray-500 tabular-nums">
                        {speler.huidigeRating ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={aanpassingen[speler.spelerId] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleRatingChange(speler.spelerId, e.target.value)
                          }
                          className={`w-20 rounded border px-2 py-1 text-right text-sm tabular-nums focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none ${
                            isAangepast
                              ? "border-orange-300 bg-orange-50 text-orange-900"
                              : "border-gray-200 text-gray-900"
                          }`}
                        />
                      </td>
                      <td className="py-2 text-right">
                        {speler.huidigeRating == null ? (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                            nieuw
                          </span>
                        ) : verschil != null ? (
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              verschil > 0
                                ? "text-green-600"
                                : verschil < 0
                                  ? "text-red-600"
                                  : "text-gray-400"
                            }`}
                          >
                            {verschil > 0 ? "+" : ""}
                            {verschil.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">
            {spelers.length} speler{spelers.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleOpslaan}
              disabled={saving || loading || spelers.length === 0}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
