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
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700"
        >
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>
            &#9654;
          </span>
          {label}
          <span className="text-gray-400 font-normal normal-case">
            ({teams.length})
          </span>
        </button>
        <button
          onClick={() => onToggleAlles(teamIds, geenAan || !alleAan)}
          className="text-[10px] text-gray-400 hover:text-orange-500"
        >
          {alleAan ? "Niets" : "Alles"}
        </button>
      </div>

      {open && (
        <div className="space-y-0.5 ml-1">
          {teams.map((team) => (
            <label
              key={team.id}
              className="flex items-center gap-2 py-0.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={zichtbaar.has(team.id)}
                onChange={() => onToggle(team.id)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 h-3.5 w-3.5"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">
                {team.naam}
              </span>
              {team.kleur && (
                <span className="text-[10px] text-gray-400">
                  {KLEUR_LABELS[team.kleur]}
                </span>
              )}
              <span className="text-[10px] text-gray-400 ml-auto">
                {team.spelers.length}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
