"use client";

import { useEffect } from "react";
import type { TeamData } from "./types";
import type {
  TeamValidatie,
  ValidatieMelding,
  ValidatieStatus,
  MeldingErnst,
} from "@/lib/validatie/regels";
import ValidatieBadge from "./ValidatieBadge";
import ImpactOverzicht from "./ImpactOverzicht";

const ERNST_CONFIG: Record<
  MeldingErnst,
  { icon: string; kleur: string }
> = {
  kritiek: { icon: "\u2715", kleur: "text-red-600 bg-red-50" },
  aandacht: { icon: "\u26A0", kleur: "text-orange-600 bg-orange-50" },
  info: { icon: "\u2139", kleur: "text-blue-600 bg-blue-50" },
};

const STATUS_VOLGORDE: ValidatieStatus[] = ["ROOD", "ORANJE", "GROEN"];

interface ValidatieRapportProps {
  teams: TeamData[];
  validatieMap: Map<string, TeamValidatie>;
  dubbeleMeldingen: ValidatieMelding[];
  onClose: () => void;
}

export default function ValidatieRapport({
  teams,
  validatieMap,
  dubbeleMeldingen,
  onClose,
}: ValidatieRapportProps) {
  // Sluit met Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Tel per status
  const tellingen = { GROEN: 0, ORANJE: 0, ROOD: 0 };
  for (const v of validatieMap.values()) {
    tellingen[v.status]++;
  }

  // Sorteer teams op ernst
  const gesorteerdeTeams = [...teams].sort((a, b) => {
    const sa = validatieMap.get(a.id)?.status ?? "GROEN";
    const sb = validatieMap.get(b.id)?.status ?? "GROEN";
    return STATUS_VOLGORDE.indexOf(sa) - STATUS_VOLGORDE.indexOf(sb);
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-base font-bold text-gray-900">
            Validatierapport
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Samenvatting */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Samenvatting
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="text-sm text-gray-600">
                  {tellingen.GROEN} groen
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                <span className="text-sm text-gray-600">
                  {tellingen.ORANJE} oranje
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-sm text-gray-600">
                  {tellingen.ROOD} rood
                </span>
              </div>
            </div>
          </div>

          {/* Dubbele spelers */}
          {dubbeleMeldingen.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-red-700 mb-2">
                Dubbele plaatsingen ({dubbeleMeldingen.length})
              </h3>
              <div className="space-y-1.5">
                {dubbeleMeldingen.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1.5"
                  >
                    <span className="shrink-0 mt-0.5">{"\u2715"}</span>
                    <span>{m.bericht}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per team */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Per team
            </h3>
            <div className="space-y-3">
              {gesorteerdeTeams.map((team) => {
                const validatie = validatieMap.get(team.id);
                if (!validatie) return null;

                return (
                  <div
                    key={team.id}
                    className="border border-gray-100 rounded-lg overflow-hidden"
                  >
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2">
                      <ValidatieBadge status={validatie.status} />
                      <span className="text-sm font-medium text-gray-800">
                        {team.naam}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {team.spelers.length} spelers
                      </span>
                    </div>
                    {validatie.meldingen.length > 0 ? (
                      <div className="px-3 py-2 space-y-1">
                        {validatie.meldingen.map((m, i) => {
                          const config = ERNST_CONFIG[m.ernst];
                          return (
                            <div
                              key={`${m.regel}-${i}`}
                              className="flex items-start gap-2"
                            >
                              <span
                                className={`text-[10px] w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${config.kleur}`}
                              >
                                {config.icon}
                              </span>
                              <span className="text-xs text-gray-700 leading-snug">
                                {m.bericht}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-3 py-2">
                        <span className="text-xs text-gray-400">
                          Geen meldingen
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impact overzicht */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Impact-analyse
            </h3>
            <ImpactOverzicht teams={teams} />
          </div>
        </div>
      </div>
    </>
  );
}
