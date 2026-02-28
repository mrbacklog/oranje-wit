"use client";

import { useState } from "react";
import type { TeamData } from "./types";
import { KLEUR_LABELS } from "./types";

interface TeamGroepProps {
  label: string;
  teams: TeamData[];
  zichtbaar: Set<string>;
  onToggle: (teamId: string) => void;
  onToggleAlles: (teamIds: string[], aan: boolean) => void;
}

export default function TeamGroep({
  label,
  teams,
  zichtbaar,
  onToggle,
  onToggleAlles,
}: TeamGroepProps) {
  const [open, setOpen] = useState(true);
  const teamIds = teams.map((t) => t.id);
  const alleAan = teamIds.every((id) => zichtbaar.has(id));
  const geenAan = teamIds.every((id) => !zichtbaar.has(id));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 uppercase hover:text-gray-700"
        >
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>&#9654;</span>
          {label}
          <span className="font-normal text-gray-400 normal-case">({teams.length})</span>
        </button>
        <button
          onClick={() => onToggleAlles(teamIds, geenAan || !alleAan)}
          className="text-[10px] text-gray-400 hover:text-orange-500"
        >
          {alleAan ? "Niets" : "Alles"}
        </button>
      </div>

      {open && (
        <div className="ml-1 space-y-0.5">
          {teams.map((team) => (
            <label key={team.id} className="group flex cursor-pointer items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={zichtbaar.has(team.id)}
                onChange={() => onToggle(team.id)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
              <span className="truncate text-sm text-gray-700 group-hover:text-gray-900">
                {team.naam}
              </span>
              {team.kleur && (
                <span className="text-[10px] text-gray-400">{KLEUR_LABELS[team.kleur]}</span>
              )}
              <span className="ml-auto text-[10px] text-gray-400">{team.spelers.length}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
