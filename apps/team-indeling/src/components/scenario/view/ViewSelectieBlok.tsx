"use client";

import type { TeamData, SpelerData, HuidigData } from "../types";
import type { SpelerStatus } from "@oranje-wit/database";
import type { TeamValidatie } from "@/lib/validatie/regels";
import {
  STATUS_KLEUREN,
  KLEUR_DOT,
  korfbalLeeftijd,
  kleurIndicatie,
  sorteerSpelers,
} from "../types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

interface ViewSelectieBlokProps {
  teams: TeamData[];
  validatieMap?: Map<string, TeamValidatie>;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function ViewSelectieBlok({ teams, onSpelerClick }: ViewSelectieBlokProps) {
  const leider = teams.find((t) => t.selectieGroepId === null) ?? teams[0];
  const teamNamen = teams.map((t) => t.alias ?? t.naam).join(" + ");

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

  return (
    <div className="col-span-1 flex flex-col rounded-lg border-2 border-dashed border-orange-300 bg-orange-50/50 ring-2 ring-orange-100 ring-offset-1 md:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-orange-200 bg-orange-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-wide text-orange-600 uppercase">
            Selectie
          </span>
          <h4 className="text-sm font-semibold text-gray-900">{teamNamen}</h4>
        </div>
      </div>

      {/* Staf */}
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

      {/* Spelers */}
      <div className="min-h-[40px] flex-1 px-1 py-1">
        {aantalSpelers === 0 ? (
          <p className="py-4 text-center text-[10px] text-gray-400">Geen spelers</p>
        ) : (
          <>
            {heren.length > 0 && (
              <>
                <div className="px-2 pt-1 text-[9px] font-medium tracking-wide text-blue-500 uppercase">
                  Heren ({heren.length})
                </div>
                {heren.map((ts) => (
                  <ViewSpelerRij
                    key={ts.id}
                    speler={ts.speler}
                    status={ts.statusOverride ?? ts.speler.status}
                    onSpelerClick={onSpelerClick}
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
                  <ViewSpelerRij
                    key={ts.id}
                    speler={ts.speler}
                    status={ts.statusOverride ?? ts.speler.status}
                    onSpelerClick={onSpelerClick}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 border-t border-orange-100 px-3 py-1 text-[10px] text-gray-400">
        <span>{aantalSpelers} spelers</span>
        <span>
          {aantalM}
          {"\u2642"} {aantalV}
          {"\u2640"}
        </span>
        <span>gem. {gemLeeftijd} jr</span>
      </div>
    </div>
  );
}

function ViewSpelerRij({
  speler,
  status,
  onSpelerClick,
}: {
  speler: SpelerData;
  status: SpelerStatus;
  onSpelerClick?: (speler: SpelerData) => void;
}) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const vorigTeam = huidig?.team ?? null;

  return (
    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-sm">
      <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />
      <span
        className={`flex-1 truncate text-xs text-gray-800 ${
          onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
        }`}
        onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
      >
        {speler.roepnaam} {speler.achternaam}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5">
        {kleur && <span className={`h-1 w-1 rounded-full ${KLEUR_DOT[kleur]}`} />}
        <span className="text-[10px] text-gray-400">{leeftijd.toFixed(2)}</span>
      </span>
      <span className="shrink-0 text-[10px]">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
      {vorigTeam && (
        <span className="max-w-[50px] shrink-0 truncate text-[9px] text-gray-400" title={vorigTeam}>
          {vorigTeam}
        </span>
      )}
    </div>
  );
}
