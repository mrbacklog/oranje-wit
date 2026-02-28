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

const ERNST_CONFIG: Record<MeldingErnst, { icon: string; kleur: string }> = {
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
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Validatierapport</h2>
          <button
            onClick={onClose}
            className="text-lg leading-none text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Samenvatting */}
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Samenvatting</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">{tellingen.GROEN} groen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
                <span className="text-sm text-gray-600">{tellingen.ORANJE} oranje</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">{tellingen.ROOD} rood</span>
              </div>
            </div>
          </div>

          {/* Dubbele spelers */}
          {dubbeleMeldingen.length > 0 && (
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="mb-2 text-sm font-semibold text-red-700">
                Dubbele plaatsingen ({dubbeleMeldingen.length})
              </h3>
              <div className="space-y-1.5">
                {dubbeleMeldingen.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded bg-red-50 px-2 py-1.5 text-xs text-red-700"
                  >
                    <span className="mt-0.5 shrink-0">{"\u2715"}</span>
                    <span>{m.bericht}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per team */}
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Per team</h3>
            <div className="space-y-3">
              {gesorteerdeTeams.map((team) => {
                const validatie = validatieMap.get(team.id);
                if (!validatie) return null;

                return (
                  <div key={team.id} className="overflow-hidden rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                      <ValidatieBadge status={validatie.status} />
                      <span className="text-sm font-medium text-gray-800">{team.naam}</span>
                      <span className="ml-auto text-xs text-gray-400">
                        {team.spelers.length} spelers
                      </span>
                    </div>
                    {validatie.meldingen.length > 0 ? (
                      <div className="space-y-1 px-3 py-2">
                        {validatie.meldingen.map((m, i) => {
                          const config = ERNST_CONFIG[m.ernst];
                          return (
                            <div key={`${m.regel}-${i}`} className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] ${config.kleur}`}
                              >
                                {config.icon}
                              </span>
                              <span className="text-xs leading-snug text-gray-700">
                                {m.bericht}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-3 py-2">
                        <span className="text-xs text-gray-400">Geen meldingen</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impact overzicht */}
          <div className="px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Impact-analyse</h3>
            <ImpactOverzicht teams={teams} />
          </div>
        </div>
      </div>
    </>
  );
}
