"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AdviesPanelProps {
  scenarioId: string;
  laatsteActie: string | null;
  teams: {
    naam: string;
    spelers: { roepnaam: string; achternaam: string }[];
  }[];
  enabled: boolean;
  onToggle: () => void;
}

export default function AdviesPanel({
  laatsteActie,
  teams,
  enabled,
  onToggle,
}: AdviesPanelProps) {
  const [advies, setAdvies] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const laatsteActieRef = useRef<string | null>(null);

  const fetchAdvies = useCallback(
    async (actie: string) => {
      setLoading(true);
      try {
        const scenarioState = {
          teams: teams.map((t) => ({
            naam: t.naam,
            spelers: t.spelers.map(
              (s) => `${s.roepnaam} ${s.achternaam}`
            ),
          })),
        };

        const response = await fetch("/api/ai/advies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actie, scenarioState }),
        });

        if (response.ok) {
          const data = await response.json();
          setAdvies(data.advies);
        }
      } catch {
        // Stille fout - advies is optioneel
      } finally {
        setLoading(false);
      }
    },
    [teams]
  );

  // Trigger advies bij nieuwe actie (debounced 2s)
  useEffect(() => {
    if (!enabled || !laatsteActie || laatsteActie === laatsteActieRef.current) {
      return;
    }
    laatsteActieRef.current = laatsteActie;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAdvies(laatsteActie);
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, laatsteActie, fetchAdvies]);

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Header met toggle */}
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          AI Advies
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-gray-500">
            {enabled ? "Aan" : "Uit"}
          </span>
          <button
            onClick={onToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              enabled ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="px-4 pb-3">
          {!enabled ? (
            <p className="text-xs text-gray-400">
              Zet AI Advies aan om na elke wijziging feedback te krijgen.
            </p>
          ) : loading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-orange-500"
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
              <span className="text-xs text-gray-500">
                Claude denkt na...
              </span>
            </div>
          ) : advies ? (
            <p className="text-sm text-gray-700 leading-relaxed">{advies}</p>
          ) : (
            <p className="text-xs text-gray-400">
              Verplaats een speler om advies te ontvangen.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
