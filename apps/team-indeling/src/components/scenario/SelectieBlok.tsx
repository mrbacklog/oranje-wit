"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import { korfbalLeeftijd, sorteerSpelers } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";
import TeamDetail from "./TeamDetail";

interface SelectieBlokProps {
  teams: TeamData[];
  validatieMap?: Map<string, TeamValidatie>;
  onOntkoppel: (groepLeiderId: string) => void;
  onDelete: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
}

export default function SelectieBlok({
  teams,
  validatieMap,
  onOntkoppel,
  onDelete,
  onSpelerClick,
}: SelectieBlokProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  // Eerste team is de leider (heeft geen selectieGroepId, de rest verwijst ernaar)
  const leider = teams.find((t) => t.selectieGroepId === null) ?? teams[0];
  const teamNamen = teams.map((t) => t.naam).join(" + ");

  // Alle spelers zitten op het leider-team (pool)
  const alleSpelers = leider.spelers;
  const gesorteerd = sorteerSpelers(alleSpelers);
  const heren = gesorteerd.filter((ts) => ts.speler.geslacht === "M");
  const dames = gesorteerd.filter((ts) => ts.speler.geslacht === "V");
  const aantalSpelers = alleSpelers.length;
  const aantalM = heren.length;
  const aantalV = dames.length;
  const gemLeeftijd =
    aantalSpelers > 0
      ? (
          alleSpelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        ).toFixed(2)
      : "-";

  // Droppable zone voor de hele selectie-pool
  const { setNodeRef, isOver } = useDroppable({
    id: `team-${leider.id}`,
    data: { type: "team", teamId: leider.id },
  });

  const borderKleur = isOver ? "border-orange-400 ring-2 ring-orange-200" : "border-orange-300";

  // Virtueel team voor TeamDetail (selectie-overzicht)
  const selectieAlsTeam: TeamData = {
    ...leider,
    naam: teamNamen,
  };

  return (
    <div
      className={`col-span-1 flex flex-col rounded-lg border-2 border-dashed bg-orange-50/50 md:col-span-2 ${borderKleur}`}
    >
      {/* Selectie header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-orange-200 bg-orange-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-wide text-orange-600 uppercase">
            Selectie
          </span>
          <h4 className="text-sm font-semibold text-gray-900">{teamNamen}</h4>
        </div>
        <div className="flex items-center gap-1">
          {/* Selectie-overzicht (oogje) */}
          <button
            onClick={() => setDetailOpen(true)}
            className="p-0.5 text-orange-400 transition-colors hover:text-orange-700"
            title="Selectie-overzicht"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={() => onOntkoppel(leider.id)}
            className="rounded px-2 py-1 text-[10px] font-medium text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-800"
            title="Ontkoppel selectie"
          >
            Ontkoppel
          </button>
        </div>
      </div>

      {/* Staf (allemaal op leider) */}
      {leider.staf.length > 0 && (
        <div className="border-b border-orange-100 px-3 py-1">
          <span className="text-[10px] font-medium text-gray-500">Staf: </span>
          {leider.staf.map((ts, i) => (
            <span key={ts.id} className="text-[10px] text-gray-500">
              {i > 0 && ", "}
              {ts.staf.naam} <span className="text-gray-400">({ts.rol})</span>
            </span>
          ))}
        </div>
      )}

      {/* Pool: één spelerslijst, gegroepeerd op geslacht */}
      <div ref={setNodeRef} className="min-h-[60px] flex-1 px-1 py-1">
        {alleSpelers.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-gray-400">Sleep spelers hierheen</p>
        ) : (
          <>
            {heren.length > 0 && (
              <>
                <div className="px-2 pt-1 text-[9px] font-medium tracking-wide text-blue-500 uppercase">
                  Heren ({heren.length})
                </div>
                {heren.map((ts) => (
                  <TeamSpelerRij
                    key={ts.id}
                    teamSpeler={ts}
                    teamId={leider.id}
                    onSpelerClick={
                      onSpelerClick ? (speler) => onSpelerClick(speler, leider.id) : undefined
                    }
                  />
                ))}
              </>
            )}
            {dames.length > 0 && (
              <>
                <div className="px-2 pt-1 text-[9px] font-medium tracking-wide text-pink-500 uppercase">
                  Dames ({dames.length})
                </div>
                {dames.map((ts) => (
                  <TeamSpelerRij
                    key={ts.id}
                    teamSpeler={ts}
                    teamId={leider.id}
                    onSpelerClick={
                      onSpelerClick ? (speler) => onSpelerClick(speler, leider.id) : undefined
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 border-t border-orange-100 px-3 py-1 text-[10px] text-gray-400">
        <span>{aantalSpelers} spelers</span>
        <span>
          {aantalM}
          {"\u2642"} {aantalV}
          {"\u2640"}
        </span>
        <span>gem. {gemLeeftijd} jr</span>
      </div>

      {/* Selectie-overzicht popup */}
      {detailOpen && (
        <TeamDetail
          team={selectieAlsTeam}
          onClose={() => setDetailOpen(false)}
          onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, leider.id) : undefined}
        />
      )}
    </div>
  );
}
