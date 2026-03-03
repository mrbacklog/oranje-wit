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
  const [gekozen, setGekozen] = useState<Set<string>>(new Set());

  // Koppelbare teams: niet dit team, niet al in een selectie
  const koppelbaar = alleTeams.filter(
    (t) =>
      t.id !== teamId &&
      t.selectieGroepId === null &&
      !alleTeams.some((ot) => ot.selectieGroepId === t.id)
  );

  if (koppelbaar.length === 0) {
    return <p className="text-[10px] text-gray-400">Geen koppelbare teams beschikbaar</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-gray-500">Kies teams om te koppelen:</p>
      <div className="max-h-24 space-y-0.5 overflow-y-auto">
        {koppelbaar.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={gekozen.has(t.id)}
              onChange={() => {
                setGekozen((prev) => {
                  const next = new Set(prev);
                  if (next.has(t.id)) next.delete(t.id);
                  else next.add(t.id);
                  return next;
                });
              }}
              className="h-3 w-3 rounded border-gray-300 text-orange-500"
            />
            <span className="text-xs text-gray-700">{t.alias ?? t.naam}</span>
          </label>
        ))}
      </div>
      {gekozen.size > 0 && (
        <button
          onClick={() => {
            onKoppel([teamId, ...Array.from(gekozen)]);
            setGekozen(new Set());
          }}
          className="w-full rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
        >
          Koppel ({gekozen.size + 1} teams)
        </button>
      )}
    </div>
  );
}
