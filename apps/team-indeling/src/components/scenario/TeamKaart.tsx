"use client";

import { useDroppable } from "@dnd-kit/core";
import type { TeamData } from "./types";
import { SEIZOEN_JAAR, KLEUR_BADGE_KLEUREN } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";

interface TeamKaartProps {
  team: TeamData;
  onDelete?: (teamId: string) => void;
}

export default function TeamKaart({ team, onDelete }: TeamKaartProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `team-${team.id}`,
    data: { type: "team", teamId: team.id },
  });

  // Bereken stats
  const aantalSpelers = team.spelers.length;
  const aantalM = team.spelers.filter((ts) => ts.speler.geslacht === "M").length;
  const aantalV = team.spelers.filter((ts) => ts.speler.geslacht === "V").length;
  const gemLeeftijd =
    aantalSpelers > 0
      ? (
          team.spelers.reduce(
            (sum, ts) => sum + (SEIZOEN_JAAR - ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        ).toFixed(1)
      : "-";

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border rounded-lg flex flex-col transition-colors ${
        isOver
          ? "border-orange-400 ring-2 ring-orange-200"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">{team.naam}</h4>
          {team.kleur && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {team.kleur}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(team.id)}
            className="text-gray-300 hover:text-red-500 text-xs"
            title="Verwijder team"
          >
            &times;
          </button>
        )}
      </div>

      {/* Staf */}
      {team.staf.length > 0 && (
        <div className="px-3 py-1 border-b border-gray-50">
          {team.staf.map((ts) => (
            <div key={ts.id} className="text-[10px] text-gray-500">
              {ts.staf.naam}{" "}
              <span className="text-gray-400">({ts.rol})</span>
            </div>
          ))}
        </div>
      )}

      {/* Spelers */}
      <div className="flex-1 px-1 py-1 min-h-[60px]">
        {team.spelers.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-3">
            Sleep spelers hierheen
          </p>
        ) : (
          team.spelers.map((ts) => (
            <TeamSpelerRij
              key={ts.id}
              teamSpeler={ts}
              teamId={team.id}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-1.5 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400">
        <span>{aantalSpelers} spelers</span>
        <span>{aantalM}{"\u2642"} {aantalV}{"\u2640"}</span>
        <span>gem. {gemLeeftijd} jr</span>
      </div>
    </div>
  );
}
