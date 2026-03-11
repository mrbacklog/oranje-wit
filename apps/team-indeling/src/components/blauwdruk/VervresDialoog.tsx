"use client";

import { useState } from "react";

interface VervresDialoogProps {
  open: boolean;
  onClose: () => void;
  onBevestig: (keuzes: Record<string, "behoud" | "reset">) => void;
  teams: { id: string; naam: string; teamscore: number | null }[];
}

export default function VervresDialoog({ open, onClose, onBevestig, teams }: VervresDialoogProps) {
  const [keuzes, setKeuzes] = useState<Record<string, "behoud" | "reset">>(() =>
    Object.fromEntries(teams.map((t) => [t.id, "behoud" as const]))
  );

  if (!open) return null;

  const handleToggle = (teamId: string) => {
    setKeuzes((prev) => ({
      ...prev,
      [teamId]: prev[teamId] === "behoud" ? "reset" : "behoud",
    }));
  };

  const handleAllesBehouden = () => {
    setKeuzes(Object.fromEntries(teams.map((t) => [t.id, "behoud" as const])));
  };

  const handleAllesResetten = () => {
    setKeuzes(Object.fromEntries(teams.map((t) => [t.id, "reset" as const])));
  };

  const aantalReset = Object.values(keuzes).filter((k) => k === "reset").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Teams verversen</h3>
          <p className="mt-1 text-sm text-gray-500">
            De volgende teams hebben al een teamscore. Wil je die behouden of resetten?
          </p>
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto px-6 py-3">
          <div className="mb-3 flex gap-2">
            <button
              onClick={handleAllesBehouden}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              Alles behouden
            </button>
            <button
              onClick={handleAllesResetten}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              Alles resetten
            </button>
          </div>
          <div className="space-y-1">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{team.naam}</span>
                  <span className="text-sm text-gray-400 tabular-nums">{team.teamscore}</span>
                </div>
                <button
                  onClick={() => handleToggle(team.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    keuzes[team.id] === "behoud"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {keuzes[team.id] === "behoud" ? "Behouden" : "Resetten"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">
            {aantalReset > 0
              ? `${aantalReset} score(s) worden gereset`
              : "Alle scores blijven behouden"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              onClick={() => onBevestig(keuzes)}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Verversen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
