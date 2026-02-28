"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import Spinner from "@/components/ui/Spinner";

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

export default function AdviesPanel({ laatsteActie, teams, enabled, onToggle }: AdviesPanelProps) {
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
            spelers: t.spelers.map((s) => `${s.roepnaam} ${s.achternaam}`),
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
      } catch (error) {
        logger.warn("Advies ophalen mislukt:", error);
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
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          AI Advies
        </button>
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs text-gray-500">{enabled ? "Aan" : "Uit"}</span>
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
              <Spinner size="sm" className="text-orange-500" />
              <span className="text-xs text-gray-500">Claude denkt na...</span>
            </div>
          ) : advies ? (
            <p className="text-sm leading-relaxed text-gray-700">{advies}</p>
          ) : (
            <p className="text-xs text-gray-400">Verplaats een speler om advies te ontvangen.</p>
          )}
        </div>
      )}
    </div>
  );
}
