"use client";

import { useState, useCallback, useRef } from "react";
import { logger } from "@oranje-wit/types";

export type ReferentieTeamData = {
  id: string;
  naam: string;
  seizoen: string;
  teamType: string | null;
  niveau: string | null;
  poolVeld: string | null;
  teamscore: number | null;
};

interface CompetitieTeamsPanelProps {
  initialTeams: ReferentieTeamData[];
}

/** Sorteer teams: senioren (numeriek) eerst, dan jeugd (J + nummer), dan rest */
function sorteerTeams(teams: ReferentieTeamData[]): ReferentieTeamData[] {
  return [...teams].sort((a, b) => {
    const aNum = a.naam.match(/^(\d+)$/);
    const bNum = b.naam.match(/^(\d+)$/);
    const aJ = a.naam.match(/^J(\d+)/);
    const bJ = b.naam.match(/^J(\d+)/);
    const aU = a.naam.match(/^U(\d+)/);
    const bU = b.naam.match(/^U(\d+)/);

    // Senioren (pure nummers) eerst, aflopend op teamscore
    if (aNum && bNum) return (b.teamscore ?? 0) - (a.teamscore ?? 0);
    if (aNum) return -1;
    if (bNum) return 1;

    // U-teams (A-categorie)
    if (aU && bU) return a.naam.localeCompare(b.naam);
    if (aU) return -1;
    if (bU) return 1;

    // Jeugd (J-teams), aflopend op teamscore
    if (aJ && bJ) return (b.teamscore ?? 0) - (a.teamscore ?? 0);
    if (aJ) return -1;
    if (bJ) return 1;

    return a.naam.localeCompare(b.naam);
  });
}

export default function CompetitieTeamsPanel({ initialTeams }: CompetitieTeamsPanelProps) {
  const [teams, setTeams] = useState(() => sorteerTeams(initialTeams));
  const [saving, setSaving] = useState<string | null>(null);
  const [herberekening, setHerberekening] = useState(false);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleScoreChange = useCallback((teamId: string, value: string) => {
    const num = value === "" ? null : parseInt(value, 10);
    if (num !== null && isNaN(num)) return;

    // Optimistic update
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, teamscore: num } : t)));

    // Debounce API call
    if (debounceRef.current[teamId]) clearTimeout(debounceRef.current[teamId]);
    debounceRef.current[teamId] = setTimeout(async () => {
      if (num === null) return;
      setSaving(teamId);
      try {
        const res = await fetch(`/api/referentie-teams/${teamId}/teamscore`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamscore: num }),
        });
        if (!res.ok) logger.warn("Teamscore opslaan mislukt:", await res.text());
      } catch (error) {
        logger.warn("Teamscore opslaan mislukt:", error);
      } finally {
        setSaving(null);
      }
    }, 600);
  }, []);

  const handleHerbereken = useCallback(async () => {
    setHerberekening(true);
    try {
      const res = await fetch("/api/ratings/herbereken", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        logger.info("Ratings herberekend:", data);
      }
    } catch (error) {
      logger.warn("Herberekening mislukt:", error);
    } finally {
      setHerberekening(false);
    }
  }, []);

  const aantalMetScore = teams.filter((t) => t.teamscore != null).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {aantalMetScore} van {teams.length} teams hebben een teamscore
          </p>
        </div>
        <button
          onClick={handleHerbereken}
          disabled={herberekening}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {herberekening ? "Herberekenen..." : "Herbereken ratings"}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Team</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Niveau</th>
              <th className="px-4 py-2 font-medium">Poule</th>
              <th className="w-28 px-4 py-2 text-right font-medium">Teamscore</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">{team.naam}</td>
                <td className="px-4 py-2 text-gray-500">{team.teamType ?? "—"}</td>
                <td className="px-4 py-2 text-gray-500">{team.niveau ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-400">
                  {team.poolVeld ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {saving === team.id && (
                      <span className="text-[10px] text-orange-400">opslaan...</span>
                    )}
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={team.teamscore ?? ""}
                      onChange={(e) => handleScoreChange(team.id, e.target.value)}
                      placeholder="—"
                      className="w-20 rounded border border-gray-200 px-2 py-1 text-right text-sm text-gray-900 tabular-nums placeholder:text-gray-300 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
