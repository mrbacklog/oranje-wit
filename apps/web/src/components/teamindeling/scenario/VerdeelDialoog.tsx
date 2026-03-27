"use client";

import { useState, useCallback, useEffect } from "react";
import type { TeamData, SelectieGroepData } from "./types";
import { korfbalLeeftijd, STATUS_KLEUREN } from "./types";
import AfmeldBadge from "./AfmeldBadge";

interface VerdeelDialoogProps {
  open: boolean;
  onClose: () => void;
  selectieGroep: SelectieGroepData;
  teams: TeamData[];
  onBevestig: (
    spelerVerdeling: Record<string, string[]>,
    stafVerdeling: Record<string, string[]>
  ) => void;
}

export default function VerdeelDialoog({
  open,
  onClose,
  selectieGroep,
  teams,
  onBevestig,
}: VerdeelDialoogProps) {
  const alleTeams = teams;
  const alleTeamIds = alleTeams.map((t) => t.id);

  // Speler-verdeling: spelerId → teamId
  const [spelerTeam, setSpelerTeam] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const ss of selectieGroep.spelers) {
      m.set(ss.spelerId, teams[0]?.id ?? "");
    }
    return m;
  });

  // Staf-toewijzing: stafId → teamId of "alle"
  const [stafTeam, setStafTeam] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const ss of selectieGroep.staf) {
      m.set(ss.stafId, "alle");
    }
    return m;
  });

  // Escape sluit dialoog
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  // Klik op speler → verplaats naar andere team (toggle bij 2 teams)
  const handleSpelerKlik = useCallback(
    (spelerId: string) => {
      setSpelerTeam((prev) => {
        const next = new Map(prev);
        const huidig = next.get(spelerId);
        if (alleTeamIds.length === 2) {
          // Toggle tussen de twee teams
          const ander = alleTeamIds.find((id) => id !== huidig);
          if (ander) next.set(spelerId, ander);
        }
        return next;
      });
    },
    [alleTeamIds]
  );

  // Bij 3+ teams: dropdown
  const handleSpelerSelect = useCallback((spelerId: string, teamId: string) => {
    setSpelerTeam((prev) => {
      const next = new Map(prev);
      next.set(spelerId, teamId);
      return next;
    });
  }, []);

  const handleStafSelect = useCallback((stafId: string, teamId: string) => {
    setStafTeam((prev) => {
      const next = new Map(prev);
      next.set(stafId, teamId);
      return next;
    });
  }, []);

  const handleBevestig = useCallback(() => {
    // Groepeer spelers per team
    const spelerVerdeling: Record<string, string[]> = {};
    for (const teamId of alleTeamIds) {
      spelerVerdeling[teamId] = [];
    }
    for (const [spelerId, teamId] of spelerTeam) {
      if (spelerVerdeling[teamId]) {
        spelerVerdeling[teamId].push(spelerId);
      }
    }

    // Groepeer staf per team (inclusief "alle")
    const stafVerdeling: Record<string, string[]> = {};
    for (const [stafId, teamId] of stafTeam) {
      if (!stafVerdeling[teamId]) stafVerdeling[teamId] = [];
      stafVerdeling[teamId].push(stafId);
    }

    onBevestig(spelerVerdeling, stafVerdeling);
  }, [spelerTeam, stafTeam, alleTeamIds, onBevestig]);

  if (!open) return null;

  // Spelers per team groeperen voor weergave
  const spelersPerTeam = new Map<string, typeof selectieGroep.spelers>();
  for (const teamId of alleTeamIds) {
    spelersPerTeam.set(teamId, []);
  }
  for (const ss of selectieGroep.spelers) {
    const teamId = spelerTeam.get(ss.spelerId) ?? teams[0]?.id ?? "";
    spelersPerTeam.get(teamId)?.push(ss);
  }

  const teamNamen = alleTeams.map((t) => t.naam).join(" + ");
  const is2Teams = alleTeamIds.length === 2;

  return (
    <div className="dialog-overlay">
      <div
        className="dialog-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header">
          <h3 className="text-lg font-bold text-gray-900">Selectie ontkoppelen</h3>
          <p className="mt-0.5 text-sm text-gray-500">{teamNamen}</p>
        </div>

        <div className="dialog-body space-y-4">
          {/* Staf-sectie */}
          {selectieGroep.staf.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-gray-600 uppercase">Staf</h4>
              <div className="space-y-1.5">
                {selectieGroep.staf.map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5"
                  >
                    <div>
                      <span className="text-sm text-gray-800">{ts.staf.naam}</span>
                      <span className="ml-1.5 text-xs text-gray-400">({ts.rol})</span>
                    </div>
                    <select
                      value={stafTeam.get(ts.stafId) ?? "alle"}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleStafSelect(ts.stafId, e.target.value)
                      }
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
                    >
                      <option value="alle">Selectie (alle teams)</option>
                      {alleTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.naam}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spelers-sectie */}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-gray-600 uppercase">Spelers verdelen</h4>
            {is2Teams ? (
              <p className="mb-2 text-[10px] text-gray-400">
                Klik op een speler om naar het andere team te verplaatsen
              </p>
            ) : (
              <p className="mb-2 text-[10px] text-gray-400">
                Kies per speler het team via de dropdown
              </p>
            )}

            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${alleTeamIds.length}, 1fr)` }}
            >
              {alleTeams.map((team) => {
                const teamSpelers = spelersPerTeam.get(team.id) ?? [];
                const m = teamSpelers.filter((ts) => ts.speler.geslacht === "M").length;
                const v = teamSpelers.filter((ts) => ts.speler.geslacht === "V").length;

                return (
                  <div key={team.id} className="rounded-lg border border-gray-200 bg-white">
                    {/* Team header */}
                    <div className="border-b border-gray-100 px-3 py-2">
                      <h5 className="text-xs font-semibold text-gray-700">{team.naam}</h5>
                      <span className="text-[10px] text-gray-400">
                        {teamSpelers.length} spelers &middot; {m}&#9794; {v}&#9792;
                      </span>
                    </div>

                    {/* Spelers */}
                    <div className="min-h-[80px] p-1">
                      {teamSpelers.length === 0 ? (
                        <p className="py-3 text-center text-[10px] text-gray-300">Geen spelers</p>
                      ) : (
                        teamSpelers
                          .sort((a, b) => a.speler.achternaam.localeCompare(b.speler.achternaam))
                          .map((ts) => {
                            const leeftijd = korfbalLeeftijd(
                              ts.speler.geboortedatum,
                              ts.speler.geboortejaar
                            );
                            return (
                              <div
                                key={ts.spelerId}
                                className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs ${
                                  is2Teams ? "cursor-pointer hover:bg-orange-50" : ""
                                }`}
                                onClick={is2Teams ? () => handleSpelerKlik(ts.spelerId) : undefined}
                              >
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                    STATUS_KLEUREN[ts.speler.status]
                                  }`}
                                />
                                <span className="flex flex-1 items-center gap-1 text-gray-700">
                                  <span className="truncate">
                                    {ts.speler.roepnaam} {ts.speler.achternaam}
                                  </span>
                                  {ts.speler.afmelddatum && (
                                    <AfmeldBadge afmelddatum={ts.speler.afmelddatum} />
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {leeftijd.toFixed(2)}
                                </span>
                                <span className="text-[10px]">
                                  {ts.speler.geslacht === "M" ? "\u2642" : "\u2640"}
                                </span>
                                {!is2Teams && (
                                  <select
                                    value={spelerTeam.get(ts.spelerId) ?? teams[0]?.id ?? ""}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                      handleSpelerSelect(ts.spelerId, e.target.value)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="ml-1 rounded border border-gray-200 px-1 py-0 text-[10px]"
                                  >
                                    {alleTeams.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.naam}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100"
          >
            Annuleren
          </button>
          <button
            onClick={handleBevestig}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            Bevestig verdeling
          </button>
        </div>
      </div>
    </div>
  );
}
