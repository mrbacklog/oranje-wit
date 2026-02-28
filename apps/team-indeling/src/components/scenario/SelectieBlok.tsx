"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import { KLEUR_BADGE_KLEUREN, korfbalLeeftijd } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";
import TeamDetail from "./TeamDetail";
import ValidatieBadge from "./ValidatieBadge";
import ValidatieMeldingen from "./ValidatieMeldingen";

interface SelectieBlokProps {
  teams: TeamData[];
  validatieMap?: Map<string, TeamValidatie>;
  onOntkoppel: (groepLeiderId: string) => void;
  onDelete: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
}

function SelectieTeamSectie({
  team,
  validatie,
  onDelete,
  onSpelerClick,
}: {
  team: TeamData;
  validatie?: TeamValidatie;
  onDelete: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
}) {
  const [meldingenOpen, setMeldingenOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `team-${team.id}`,
    data: { type: "team", teamId: team.id },
  });

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

  const borderKleur = isOver
    ? "border-orange-400 ring-2 ring-orange-200"
    : validatie && validatie.status === "ROOD"
      ? "border-red-400"
      : validatie && validatie.status === "ORANJE"
        ? "border-orange-400"
        : "border-gray-200";

  return (
    <div ref={setNodeRef} className={`rounded-md border bg-white transition-colors ${borderKleur}`}>
      {/* Sub-header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5">
        <div className="relative flex items-center gap-2">
          {validatie && (
            <ValidatieBadge
              status={validatie.status}
              onClick={() => setMeldingenOpen(!meldingenOpen)}
            />
          )}
          <h5 className="text-xs font-semibold text-gray-700">{team.naam}</h5>
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailOpen(true)}
            className="p-0.5 text-gray-300 transition-colors hover:text-gray-600"
            title="Team details"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            onClick={() => onDelete(team.id)}
            className="text-xs text-gray-300 hover:text-red-500"
            title="Verwijder team"
          >
            &times;
          </button>
        </div>
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
      <div className="min-h-[40px] px-1 py-1">
        {team.spelers.length === 0 ? (
          <p className="py-2 text-center text-[10px] text-gray-400">Sleep spelers hierheen</p>
        ) : (
          team.spelers.map((ts) => (
            <TeamSpelerRij
              key={ts.id}
              teamSpeler={ts}
              teamId={team.id}
              onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, team.id) : undefined}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 border-t border-gray-100 px-3 py-1 text-[10px] text-gray-400">
        <span>{aantalSpelers} spelers</span>
        <span>
          {aantalM}
          {"\u2642"} {aantalV}
          {"\u2640"}
        </span>
        <span>gem. {gemLeeftijd} jr</span>
      </div>

      {/* Team detail popup */}
      {detailOpen && (
        <TeamDetail
          team={team}
          validatie={validatie}
          onClose={() => setDetailOpen(false)}
          onSpelerClick={onSpelerClick ? (speler) => onSpelerClick(speler, team.id) : undefined}
        />
      )}
    </div>
  );
}

export default function SelectieBlok({
  teams,
  validatieMap,
  onOntkoppel,
  onDelete,
  onSpelerClick,
}: SelectieBlokProps) {
  // Eerste team is de leider (heeft geen selectieGroepId, de rest verwijst ernaar)
  const leider = teams.find((t) => t.selectieGroepId === null) ?? teams[0];
  const teamNamen = teams.map((t) => t.naam).join(" + ");

  // Totaal staf (gedeeld)
  const alleStaf = teams.flatMap((t) => t.staf);
  const uniekeStaf = alleStaf.filter(
    (s, i, arr) => arr.findIndex((x) => x.stafId === s.stafId) === i
  );

  return (
    <div className="col-span-1 flex flex-col rounded-lg border-2 border-dashed border-orange-300 bg-orange-50/50 md:col-span-2">
      {/* Selectie header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-orange-200 bg-orange-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-wide text-orange-600 uppercase">
            Selectie
          </span>
          <h4 className="text-sm font-semibold text-gray-900">{teamNamen}</h4>
        </div>
        <button
          onClick={() => onOntkoppel(leider.id)}
          className="rounded px-2 py-1 text-[10px] font-medium text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-800"
          title="Ontkoppel selectie"
        >
          Ontkoppel
        </button>
      </div>

      {/* Gedeelde staf */}
      {uniekeStaf.length > 0 && (
        <div className="border-b border-orange-100 px-3 py-1">
          <span className="text-[10px] font-medium text-gray-500">Staf: </span>
          {uniekeStaf.map((ts, i) => (
            <span key={ts.id} className="text-[10px] text-gray-500">
              {i > 0 && ", "}
              {ts.staf.naam} <span className="text-gray-400">({ts.rol})</span>
            </span>
          ))}
        </div>
      )}

      {/* Team secties */}
      <div className="grid flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-2">
        {teams.map((team) => (
          <SelectieTeamSectie
            key={team.id}
            team={team}
            validatie={validatieMap?.get(team.id)}
            onDelete={onDelete}
            onSpelerClick={onSpelerClick}
          />
        ))}
      </div>
    </div>
  );
}
