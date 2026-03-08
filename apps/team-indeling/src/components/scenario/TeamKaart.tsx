"use client";

import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData, DetailLevel } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import {
  KLEUR_BADGE_KLEUREN,
  CATEGORIE_BADGE,
  CATEGORIE_BADGE_LABEL,
  korfbalLeeftijd,
  sorteerSpelers,
} from "./types";
import {
  categorieRandKlassen,
  categorieAchtergrond,
  categorieHeaderBorder,
  categorieFooterBorder,
  validatieRingKlassen,
} from "@/lib/teamKaartStijl";
import TeamSpelerRij from "./TeamSpelerRij";
import ValidatieBadge from "./ValidatieBadge";
import ValidatieMeldingen from "./ValidatieMeldingen";
import {
  CARD_WIDTH_SINGLE,
  CARD_WIDTH_DOUBLE,
  CARD_HEIGHT_SINGLE,
  CARD_HEIGHT_DOUBLE,
} from "./editor/cardSizes";
import { useZoomScale } from "./editor/ZoomScaleContext";

export interface TeamKaartProps {
  team: TeamData;
  validatie?: TeamValidatie;
  notitieCount?: number;
  detailLevel?: DetailLevel;
  onDelete?: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData) => void;
  onEditTeam?: (teamId: string) => void;
  onNotitiesClick?: (teamNaam: string) => void;
}

export default function TeamKaart({
  team,
  validatie,
  notitieCount,
  detailLevel,
  onDelete,
  onSpelerClick,
  onEditTeam,
  onNotitiesClick,
}: TeamKaartProps) {
  const dl = detailLevel ?? "detail";
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

  // Gesorteerde spelers: heren eerst, dan dames, oudste eerst
  const gesorteerd = sorteerSpelers(team.spelers);
  const heren = gesorteerd.filter((ts) => ts.speler.geslacht === "M");
  const dames = gesorteerd.filter((ts) => ts.speler.geslacht === "V");

  // J-nummer indicatie (alleen bij B-categorie jeugd)
  const jNummer =
    team.categorie === "B_CATEGORIE" && aantalSpelers > 0
      ? `~J${Math.round(
          team.spelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        )}`
      : null;

  // Twee-laags stijl: categorie-rand + validatie-ring
  const randKlassen = categorieRandKlassen(team.categorie, team.kleur);
  const achtergrond = categorieAchtergrond(team.categorie, team.kleur);
  const headerBorder = categorieHeaderBorder(team.categorie, team.kleur);
  const footerBorder = categorieFooterBorder(team.categorie, team.kleur);
  const ringKlassen = validatieRingKlassen(validatie?.status, isOver);

  // Weergavenaam: alias valt terug op naam
  const weergaveNaam = team.alias ?? team.naam;

  const isDouble = team.teamType !== "VIERTAL";
  const cardWidth = isDouble ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE;
  const cardHeight = isDouble ? CARD_HEIGHT_DOUBLE : CARD_HEIGHT_SINGLE;

  // Compenseer tekst voor zoom: bij uitzoomen wordt tekst groter zodat het leesbaar blijft
  const zoomScale = useZoomScale();
  const textScale = zoomScale < 1 ? 1 / Math.max(zoomScale, 0.5) : 1;

  return (
    <div
      ref={setNodeRef}
      style={{ width: cardWidth, height: cardHeight }}
      className={`flex flex-col overflow-hidden rounded-lg transition-colors ${randKlassen} ${achtergrond} ${ringKlassen}`}
    >
      <div
        style={
          textScale > 1
            ? {
                transform: `scale(${textScale})`,
                transformOrigin: "top left",
                width: `${100 / textScale}%`,
                height: `${100 / textScale}%`,
              }
            : undefined
        }
        className="flex h-full flex-col"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2 ${headerBorder}`}>
          <div className="relative flex items-center gap-2">
            <span className="p-0.5 text-gray-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 10 16" fill="currentColor">
                <circle cx="3" cy="2" r="1.2" />
                <circle cx="7" cy="2" r="1.2" />
                <circle cx="3" cy="8" r="1.2" />
                <circle cx="7" cy="8" r="1.2" />
                <circle cx="3" cy="14" r="1.2" />
                <circle cx="7" cy="14" r="1.2" />
              </svg>
            </span>
            {validatie && (
              <ValidatieBadge
                status={validatie.status}
                onClick={() => setMeldingenOpen(!meldingenOpen)}
              />
            )}
            <h4 className="text-sm font-semibold text-gray-900">{weergaveNaam}</h4>
            {/* Notitie-badge */}
            {(dl === "detail" || dl === "focus") && notitieCount != null && notitieCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNotitiesClick?.(team.alias ?? team.naam);
                }}
                className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white hover:bg-orange-600"
                title={`${notitieCount} notitie(s)`}
              >
                {notitieCount}
              </button>
            )}
            {/* Kleur-badge (B-categorie) */}
            {team.kleur && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {team.kleur}
              </span>
            )}
            {/* Categorie-badge (A-categorie en Senioren) */}
            {CATEGORIE_BADGE[team.categorie] && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CATEGORIE_BADGE[team.categorie]}`}
              >
                {CATEGORIE_BADGE_LABEL[team.categorie]}
              </span>
            )}
            {dl !== "focus" && meldingenOpen && validatie && (
              <ValidatieMeldingen
                meldingen={validatie.meldingen}
                onClose={() => setMeldingenOpen(false)}
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Potlood-icoon voor team bewerken */}
            {(dl === "detail" || dl === "focus") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTeam?.(team.id);
                }}
                className="p-0.5 text-gray-300 transition-colors hover:text-gray-600"
                title="Bewerk team"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
            {(dl === "detail" || dl === "focus") &&
              onDelete &&
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
        </div>

        {/* Staf */}
        {(dl === "detail" || dl === "focus") && team.staf.length > 0 && (
          <div className="border-b border-gray-50 px-3 py-1">
            {team.staf.map((ts) => (
              <div key={ts.id} className="text-[10px] text-gray-500">
                {ts.staf.naam} <span className="text-gray-400">({ts.rol})</span>
              </div>
            ))}
          </div>
        )}

        {/* Spelers */}
        {dl === "overzicht" ? (
          <div className="px-3 py-2 text-center text-sm text-gray-500">
            {aantalSpelers} spelers · {aantalM}
            {"♂"} {aantalV}
            {"♀"}
          </div>
        ) : (
          <div className="min-h-15 flex-1 px-1 py-1">
            {team.spelers.length === 0 ? (
              <p className="py-3 text-center text-xs text-gray-400">Sleep spelers hierheen</p>
            ) : team.teamType === "VIERTAL" ? (
              /* 4-tal: gestapeld — dames boven, heren onder */
              <>
                {dames.length > 0 && (
                  <>
                    <div className="px-2 pt-1 text-[11px] font-medium tracking-wide text-pink-500 uppercase">
                      Dames ({dames.length})
                    </div>
                    {dames.map((ts) => (
                      <TeamSpelerRij
                        key={ts.id}
                        teamSpeler={ts}
                        teamId={team.id}
                        detailLevel={dl}
                        onSpelerClick={onSpelerClick}
                      />
                    ))}
                  </>
                )}
                {heren.length > 0 && (
                  <>
                    <div className="px-2 pt-1 text-[11px] font-medium tracking-wide text-blue-500 uppercase">
                      Heren ({heren.length})
                    </div>
                    {heren.map((ts) => (
                      <TeamSpelerRij
                        key={ts.id}
                        teamSpeler={ts}
                        teamId={team.id}
                        detailLevel={dl}
                        onSpelerClick={onSpelerClick}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              /* 8-tal: side-by-side — dames links, heren rechts */
              <div className="grid grid-cols-2 gap-x-0.5">
                <div>
                  {dames.length > 0 && (
                    <div className="px-2 pt-1 text-[11px] font-medium tracking-wide text-pink-500 uppercase">
                      Dames ({dames.length})
                    </div>
                  )}
                  {dames.map((ts) => (
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={team.id}
                      detailLevel={dl}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
                <div>
                  {heren.length > 0 && (
                    <div className="px-2 pt-1 text-[11px] font-medium tracking-wide text-blue-500 uppercase">
                      Heren ({heren.length})
                    </div>
                  )}
                  {heren.map((ts) => (
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={team.id}
                      detailLevel={dl}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Focus: inline validatie meldingen */}
        {dl === "focus" && validatie && validatie.meldingen.length > 0 && (
          <div className="border-t border-gray-100 px-3 py-1.5">
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
            className={`flex items-center gap-3 px-3 py-1.5 text-[11px] text-gray-400 ${footerBorder}`}
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
        )}
      </div>
    </div>
  );
}
