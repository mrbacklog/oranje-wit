"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

interface VoorstelDialoogProps {
  open: boolean;
  onClose: () => void;
  scenarioId: string;
}

export default function VoorstelDialoog({
  open,
  onClose,
  scenarioId,
}: VoorstelDialoogProps) {
  const router = useRouter();
  const [teamgroottePrio, setTeamgroottePrio] = useState("standaard");
  const [prioriteiten, setPrioriteiten] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<string | null>(null);

  const handleGenereer = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResultaat(null);

    try {
      const response = await fetch("/api/ai/voorstel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          opties: {
            teamgroottePrio:
              teamgroottePrio === "standaard" ? undefined : teamgroottePrio,
            prioriteiten: prioriteiten.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Er ging iets mis");
        return;
      }

      setResultaat(
        `${data.aantalIngedeeld} spelers ingedeeld.${
          data.nietGevondenTeams?.length
            ? ` Let op: teams niet gevonden: ${data.nietGevondenTeams.join(", ")}`
            : ""
        }`
      );

      // Herlaad de pagina zodat de teams verschijnen met spelers
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Onbekende fout bij het genereren"
      );
    } finally {
      setLoading(false);
    }
  }, [scenarioId, teamgroottePrio, prioriteiten, router]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setError(null);
    setResultaat(null);
    onClose();
  }, [loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={handleClose}
    >
      <div
        className="dialog-panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="text-lg font-bold text-gray-900">
            AI Startvoorstel
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Claude analyseert de beschikbare spelers en teams en genereert een
            eerste teamindeling op basis van KNKV-regels en OW-voorkeuren.
          </p>
        </div>

        <div className="dialog-body">
          {/* Teamgrootte voorkeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teamgrootte voorkeur
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { waarde: "compact", label: "Compact (kleinere teams)" },
                { waarde: "standaard", label: "Standaard" },
                { waarde: "ruim", label: "Ruim (grotere teams)" },
              ].map(({ waarde, label }) => (
                <label
                  key={waarde}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                    teamgroottePrio === waarde
                      ? "bg-orange-50 border-orange-400 text-orange-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="teamgrootte"
                    value={waarde}
                    checked={teamgroottePrio === waarde}
                    onChange={() => setTeamgroottePrio(waarde)}
                    className="sr-only"
                    disabled={loading}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Extra prioriteiten */}
          <div>
            <label
              htmlFor="prioriteiten"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Extra prioriteiten{" "}
              <span className="text-gray-400">(optioneel)</span>
            </label>
            <textarea
              id="prioriteiten"
              value={prioriteiten}
              onChange={(e) => setPrioriteiten(e.target.value)}
              placeholder="Bijv. &quot;Houd Lisa en Emma bij elkaar&quot; of &quot;Plaats nieuwe spelers bij ervaren teams&quot;"
              rows={3}
              disabled={loading}
              className="input disabled:opacity-50"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Spinner size="md" className="text-orange-500" />
              <span className="text-sm text-orange-700">
                Claude analyseert spelers en teams...
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
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{resultaat}</p>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn-ghost disabled:opacity-50"
          >
            {resultaat ? "Sluiten" : "Annuleren"}
          </button>
          {!resultaat && (
            <button
              onClick={handleGenereer}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Bezig..." : "Genereer voorstel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
