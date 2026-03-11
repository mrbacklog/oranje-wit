"use client";

import { useState } from "react";
import type { TeamData } from "./types";

/**
 * Sub-component: kies teams om te koppelen als selectie.
 */
export default function SelectieKoppelaar({
  teamId,
  alleTeams,
  onKoppel,
}: {
  teamId: string;
  alleTeams: TeamData[];
  onKoppel: (teamIds: string[]) => void;
}) {
  const [gekozen, setGekozen] = useState<string | null>(null);

  // Koppelbare teams: niet dit team, niet al in een selectie, alleen achtallen
  const koppelbaar = alleTeams.filter(
    (t) => t.id !== teamId && t.selectieGroepId === null && (!t.teamType || t.teamType === "ACHTAL")
  );

  if (koppelbaar.length === 0) {
    return <p className="text-[10px] text-gray-400">Geen koppelbare achtallen beschikbaar</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-gray-500">Kies een team om te koppelen:</p>
      <div className="max-h-24 space-y-0.5 overflow-y-auto">
        {koppelbaar.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100"
          >
            <input
              type="radio"
              name="selectie-koppel"
              checked={gekozen === t.id}
              onChange={() => setGekozen(t.id)}
              className="h-3 w-3 border-gray-300 text-orange-500"
            />
            <span className="text-xs text-gray-700">{t.alias ?? t.naam}</span>
          </label>
        ))}
      </div>
      {gekozen && (
        <button
          onClick={() => {
            onKoppel([teamId, gekozen]);
            setGekozen(null);
          }}
          className="w-full rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
        >
          Koppel selectie
        </button>
      )}
    </div>
  );
}
