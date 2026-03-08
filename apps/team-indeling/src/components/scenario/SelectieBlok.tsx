"use client";

import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData, DetailLevel, SelectieGroepData, TeamSpelerData } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import { korfbalLeeftijd, sorteerSpelers } from "./types";
import TeamSpelerRij from "./TeamSpelerRij";

export interface SelectieBlokProps {
  teams: TeamData[];
  selectieGroep?: SelectieGroepData;
  validatieMap?: Map<string, TeamValidatie>;
  detailLevel?: DetailLevel;
  onOntkoppel: (groepId: string) => void;
  onDelete: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
  onEditTeam?: (teamId: string) => void;
}

export default function SelectieBlok({
  teams,
  selectieGroep,
  validatieMap,
  detailLevel,
  onOntkoppel,
  onDelete: _onDelete,
  onSpelerClick,
  onEditTeam,
}: SelectieBlokProps) {
  const dl = detailLevel ?? "detail";

  // Eerste team als referentie (voor droppable)
  const eersteTeam = teams[0];
  const teamNamen = teams.map((t) => t.alias ?? t.naam).join(" + ");

  // Spelers/staf komen van de selectieGroep
  const alleSpelers = selectieGroep
    ? sorteerSpelers(selectieGroep.spelers as TeamSpelerData[])
    : sorteerSpelers(eersteTeam?.spelers ?? []);
  const gesorteerd = alleSpelers;
  const heren = alleSpelers.filter((ts) => ts.speler.geslacht === "M");
  const dames = alleSpelers.filter((ts) => ts.speler.geslacht === "V");
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

  // Staf uit selectieGroep of eersteTeam
  const alleStaf = selectieGroep ? selectieGroep.staf : (eersteTeam?.staf ?? []);

  // Validatie voor het eerste team
  const validatie = validatieMap?.get(eersteTeam?.id ?? "");

  // Droppable zone — elk team in de groep werkt als drop target
  const { setNodeRef, isOver } = useDroppable({
    id: `team-${eersteTeam?.id}`,
    data: { type: "team", teamId: eersteTeam?.id },
  });

  // Dubbele oranje stippelrand: border + ring voor dubbel effect
  const borderKleur = isOver
    ? "border-orange-400 ring-2 ring-orange-200"
    : "border-orange-300 ring-2 ring-orange-100 ring-offset-1";

  return (
    <div
      className={`col-span-1 flex flex-col rounded-lg border-2 border-dashed bg-orange-50/50 md:col-span-2 ${borderKleur}`}
    >
      {/* Selectie header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-orange-200 bg-orange-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="p-0.5 text-orange-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="3" cy="2" r="1.2" />
              <circle cx="7" cy="2" r="1.2" />
              <circle cx="3" cy="8" r="1.2" />
              <circle cx="7" cy="8" r="1.2" />
              <circle cx="3" cy="14" r="1.2" />
              <circle cx="7" cy="14" r="1.2" />
            </svg>
          </span>
          <span
            className="font-medium tracking-wide text-orange-600 uppercase"
            style={{ fontSize: "calc(11px / var(--zoom-scale, 1))" }}
          >
            Selectie
          </span>
          <h4
            className="font-semibold text-gray-900"
            style={{ fontSize: "calc(14px / var(--zoom-scale, 1))" }}
          >
            {teamNamen}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          {/* Potlood-icoon voor selectie bewerken */}
          {(dl === "detail" || dl === "focus") && eersteTeam && (
            <button
              onClick={() => onEditTeam?.(eersteTeam.id)}
              className="p-0.5 text-orange-400 transition-colors hover:text-orange-700"
              title="Bewerk selectie"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
          {(dl === "detail" || dl === "focus") && selectieGroep && (
            <button
              onClick={() => onOntkoppel(selectieGroep.id)}
              className="rounded px-2 py-1 text-[10px] font-medium text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-800"
              title="Ontkoppel selectie"
            >
              Ontkoppel
            </button>
          )}
        </div>
      </div>

      {/* Staf (uit selectieGroep) */}
      {(dl === "detail" || dl === "focus") && alleStaf.length > 0 && (
        <div className="border-b border-orange-100 px-3 py-1">
          <span className="text-[10px] font-medium text-gray-500">Staf: </span>
          {alleStaf.map((ts, i) => (
            <span key={ts.id} className="text-[10px] text-gray-500">
              {i > 0 && ", "}
              {ts.staf.naam} <span className="text-gray-400">({ts.rol})</span>
            </span>
          ))}
        </div>
      )}

      {/* Pool: een spelerslijst, gegroepeerd op geslacht */}
      {dl === "overzicht" ? (
        <div
          ref={setNodeRef}
          className="px-3 py-2 text-center text-gray-500"
          style={{ fontSize: "calc(13px / var(--zoom-scale, 1))" }}
        >
          {aantalSpelers} spelers · {aantalM}
          {"♂"} {aantalV}
          {"♀"}
        </div>
      ) : (
        <div ref={setNodeRef} className="min-h-15 flex-1 px-1 py-1">
          {alleSpelers.length === 0 ? (
            <p className="py-4 text-center text-[10px] text-gray-400">Sleep spelers hierheen</p>
          ) : (
            /* detail/focus: side-by-side — dames links, heren rechts */
            <div className="grid grid-cols-2 gap-x-0.5">
              <div>
                {dames.length > 0 && (
                  <div
                    className="px-2 pt-1 font-medium tracking-wide text-pink-500 uppercase"
                    style={{ fontSize: "calc(11px / var(--zoom-scale, 1))" }}
                  >
                    Dames ({dames.length})
                  </div>
                )}
                {dames.map((ts) => (
                  <TeamSpelerRij
                    key={ts.id}
                    teamSpeler={ts}
                    teamId={eersteTeam?.id ?? ""}
                    detailLevel={dl}
                    onSpelerClick={
                      onSpelerClick ? (speler) => onSpelerClick(speler, eersteTeam?.id) : undefined
                    }
                  />
                ))}
              </div>
              <div>
                {heren.length > 0 && (
                  <div
                    className="px-2 pt-1 font-medium tracking-wide text-blue-500 uppercase"
                    style={{ fontSize: "calc(11px / var(--zoom-scale, 1))" }}
                  >
                    Heren ({heren.length})
                  </div>
                )}
                {heren.map((ts) => (
                  <TeamSpelerRij
                    key={ts.id}
                    teamSpeler={ts}
                    teamId={eersteTeam?.id ?? ""}
                    detailLevel={dl}
                    onSpelerClick={
                      onSpelerClick ? (speler) => onSpelerClick(speler, eersteTeam?.id) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus: inline validatie meldingen */}
      {dl === "focus" && validatie && validatie.meldingen.length > 0 && (
        <div className="border-t border-orange-100 px-3 py-1.5">
          {validatie.meldingen.map((m, i) => (
            <div
              key={i}
              className={`text-[10px] ${m.ernst === "kritiek" ? "text-red-600" : m.ernst === "aandacht" ? "text-orange-500" : "text-blue-500"}`}
            >
              {m.bericht}
            </div>
          ))}
        </div>
      )}

      {/* Footer stats */}
      {dl !== "overzicht" && (
        <div
          className="flex items-center gap-3 border-t border-orange-100 px-3 py-1 text-gray-400"
          style={{ fontSize: "calc(11px / var(--zoom-scale, 1))" }}
        >
          <span>{aantalSpelers} spelers</span>
          <span>
            {aantalM}
            {"\u2642"} {aantalV}
            {"\u2640"}
          </span>
          <span>gem. {gemLeeftijd} jr</span>
        </div>
      )}
    </div>
  );
}
