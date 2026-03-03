"use client";

import { useState } from "react";
import type { TeamData, SpelerData, HuidigData } from "../types";
import type { SpelerStatus } from "@oranje-wit/database";
import type { TeamValidatie } from "@/lib/validatie/regels";
import {
  KLEUR_BADGE_KLEUREN,
  CATEGORIE_BADGE,
  CATEGORIE_BADGE_LABEL,
  STATUS_KLEUREN,
  KLEUR_DOT,
  korfbalLeeftijd,
  kleurIndicatie,
  sorteerSpelers,
} from "../types";
import {
  categorieRandKlassen,
  categorieAchtergrond,
  categorieHeaderBorder,
  categorieFooterBorder,
} from "@/lib/teamKaartStijl";
import ValidatieBadge from "../ValidatieBadge";
import ValidatieMeldingen from "../ValidatieMeldingen";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

interface ViewTeamKaartProps {
  team: TeamData;
  validatie?: TeamValidatie;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function ViewTeamKaart({ team, validatie, onSpelerClick }: ViewTeamKaartProps) {
  const [meldingenOpen, setMeldingenOpen] = useState(false);

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

  const gesorteerd = sorteerSpelers(team.spelers);
  const heren = gesorteerd.filter((ts) => ts.speler.geslacht === "M");
  const dames = gesorteerd.filter((ts) => ts.speler.geslacht === "V");

  const jNummer =
    team.categorie === "B_CATEGORIE" && aantalSpelers > 0
      ? `~J${Math.round(
          team.spelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        )}`
      : null;

  const randKlassen = categorieRandKlassen(team.categorie, team.kleur);
  const achtergrond = categorieAchtergrond(team.categorie, team.kleur);
  const headerBorder = categorieHeaderBorder(team.categorie, team.kleur);
  const footerBorder = categorieFooterBorder(team.categorie, team.kleur);

  const weergaveNaam = team.alias ?? team.naam;

  return (
    <div className={`flex flex-col rounded-lg ${randKlassen} ${achtergrond}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 ${headerBorder}`}>
        <div className="relative flex items-center gap-2">
          {validatie && (
            <ValidatieBadge
              status={validatie.status}
              onClick={() => setMeldingenOpen(!meldingenOpen)}
            />
          )}
          <h4 className="text-sm font-semibold text-gray-900">{weergaveNaam}</h4>
          {team.kleur && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {team.kleur}
            </span>
          )}
          {CATEGORIE_BADGE[team.categorie] && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CATEGORIE_BADGE[team.categorie]}`}
            >
              {CATEGORIE_BADGE_LABEL[team.categorie]}
            </span>
          )}
          {meldingenOpen && validatie && (
            <ValidatieMeldingen
              meldingen={validatie.meldingen}
              onClose={() => setMeldingenOpen(false)}
            />
          )}
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
      <div className="min-h-[40px] flex-1 px-1 py-1">
        {aantalSpelers === 0 ? (
          <p className="py-3 text-center text-[10px] text-gray-400">Geen spelers</p>
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
                    statusOverride={ts.statusOverride}
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
                    statusOverride={ts.statusOverride}
                    onSpelerClick={onSpelerClick}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer stats */}
      <div
        className={`flex items-center gap-3 px-3 py-1.5 text-[10px] text-gray-400 ${footerBorder}`}
      >
        <span>{aantalSpelers} spelers</span>
        <span>
          {aantalM}
          {"\u2642"} {aantalV}
          {"\u2640"}
        </span>
        <span>gem. {gemLeeftijd} jr</span>
        {jNummer && (
          <span
            className={`ml-auto rounded px-1.5 py-0.5 font-medium ${
              team.kleur
                ? (KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500")
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {jNummer}
          </span>
        )}
      </div>
    </div>
  );
}

/** Visuele spelerrij zonder drag-and-drop */
function ViewSpelerRij({
  speler,
  statusOverride,
  onSpelerClick,
}: {
  speler: SpelerData;
  statusOverride: SpelerStatus | null;
  onSpelerClick?: (speler: SpelerData) => void;
}) {
  const status = statusOverride ?? speler.status;
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
