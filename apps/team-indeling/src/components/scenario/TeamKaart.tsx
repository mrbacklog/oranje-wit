"use client";

import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import { KLEUR_BADGE_KLEUREN, korfbalLeeftijd } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";
import ValidatieBadge from "./ValidatieBadge";
import ValidatieMeldingen from "./ValidatieMeldingen";

interface TeamKaartProps {
  team: TeamData;
  validatie?: TeamValidatie;
  onDelete?: (teamId: string) => void;
}

const VALIDATIE_BORDER: Record<string, string> = {
  ROOD: "border-red-400",
  ORANJE: "border-orange-400",
  GROEN: "border-gray-200",
};

export default function TeamKaart({ team, validatie, onDelete }: TeamKaartProps) {
  const [meldingenOpen, setMeldingenOpen] = useState(false);
  const [deleteBevestig, setDeleteBevestig] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

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
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        ).toFixed(2)
      : "-";

  // J-nummer indicatie
  const jNummer =
    aantalSpelers > 0
      ? `~J${Math.round(
          team.spelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        )}`
      : null;

  const borderKleur = isOver
    ? "border-orange-400 ring-2 ring-orange-200"
    : validatie
      ? (VALIDATIE_BORDER[validatie.status] ?? "border-gray-200")
      : "border-gray-200";

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border bg-white transition-colors ${borderKleur}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <div className="relative flex items-center gap-2">
          {validatie && (
            <ValidatieBadge
              status={validatie.status}
              onClick={() => setMeldingenOpen(!meldingenOpen)}
            />
          )}
          <h4 className="text-sm font-semibold text-gray-900">{team.naam}</h4>
          {team.kleur && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {team.kleur}
            </span>
          )}
          {meldingenOpen && validatie && (
            <ValidatieMeldingen
              meldingen={validatie.meldingen}
              onClose={() => setMeldingenOpen(false)}
            />
          )}
        </div>
        {onDelete &&
          (deleteBevestig ? (
            <button
              onClick={() => {
                if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                setDeleteBevestig(false);
                onDelete(team.id);
              }}
              onBlur={() => {
                if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                setDeleteBevestig(false);
              }}
              className="animate-pulse text-xs font-medium text-red-600 hover:text-red-700"
            >
              Bevestig?
            </button>
          ) : (
            <button
              onClick={() => {
                setDeleteBevestig(true);
                deleteTimerRef.current = setTimeout(() => setDeleteBevestig(false), 3000);
              }}
              className="text-xs text-gray-300 hover:text-red-500"
              title="Verwijder team"
            >
              &times;
            </button>
          ))}
      </div>

      {/* Staf */}
      {team.staf.length > 0 && (
        <div className="border-b border-gray-50 px-3 py-1">
          {team.staf.map((ts) => (
            <div key={ts.id} className="text-[10px] text-gray-500">
              {ts.staf.naam} <span className="text-gray-400">({ts.rol})</span>
            </div>
          ))}
        </div>
      )}

      {/* Spelers */}
      <div className="min-h-[60px] flex-1 px-1 py-1">
        {team.spelers.length === 0 ? (
          <p className="py-3 text-center text-[10px] text-gray-400">Sleep spelers hierheen</p>
        ) : (
          team.spelers.map((ts) => <TeamSpelerRij key={ts.id} teamSpeler={ts} teamId={team.id} />)
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
        <span>{aantalSpelers} spelers</span>
        <span>
          {aantalM}
          {"\u2642"} {aantalV}
          {"\u2640"}
        </span>
        <span>gem. {gemLeeftijd} jr</span>
        {jNummer && <span className="font-medium text-gray-500">{jNummer}</span>}
      </div>
    </div>
  );
}
