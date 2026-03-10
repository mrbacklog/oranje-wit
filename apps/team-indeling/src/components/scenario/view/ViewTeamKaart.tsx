"use client";

import { useState } from "react";
import type { TeamData, SpelerData, HuidigData, DetailLevel } from "../types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import {
  KLEUR_BADGE_KLEUREN,
  CATEGORIE_BADGE,
  CATEGORIE_BADGE_LABEL,
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
import { getCardSize } from "../editor/cardSizes";
import { useZoomScale } from "../editor/ZoomScaleContext";

interface ViewTeamKaartProps {
  team: TeamData;
  validatie?: TeamValidatie;
  detailLevel?: DetailLevel;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function ViewTeamKaart({
  team,
  validatie,
  detailLevel,
  onSpelerClick,
}: ViewTeamKaartProps) {
  const dl = detailLevel ?? "detail";
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

  const randKlassen = categorieRandKlassen(team.categorie, team.kleur);
  const achtergrond = categorieAchtergrond(team.categorie, team.kleur);
  const headerBorder = categorieHeaderBorder(team.categorie, team.kleur);
  const footerBorder = categorieFooterBorder(team.categorie, team.kleur);
  const weergaveNaam = team.alias ?? team.naam;

  const { w: cardWidth, h: cardHeight } = getCardSize(team.teamType ?? "VIERTAL", false);
  const isDouble = (team.teamType ?? "VIERTAL") !== "VIERTAL";

  const zoomScale = useZoomScale();
  const textScale = zoomScale < 1 ? 1 / Math.max(zoomScale, 0.5) : 1;

  const meldingen = validatie?.meldingen ?? [];

  return (
    <div
      style={{ width: cardWidth, height: cardHeight }}
      className={`flex flex-col rounded-lg ${randKlassen} ${achtergrond}`}
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
        <div className={`flex items-center justify-between px-1.5 py-1 ${headerBorder}`}>
          <div className="relative flex min-w-0 items-center gap-1">
            {dl === "detail" && validatie && (
              <ValidatieBadge
                status={validatie.status}
                onClick={() => setMeldingenOpen(!meldingenOpen)}
              />
            )}
            <h4
              className={`truncate font-semibold text-gray-900 ${
                dl === "overzicht" ? "text-xs" : "text-[11px]"
              }`}
            >
              {weergaveNaam}
            </h4>
            {dl === "detail" && team.kleur && (
              <span
                className={`shrink-0 rounded-full px-1 py-px text-[7px] ${
                  KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {team.kleur}
              </span>
            )}
            {dl === "detail" && CATEGORIE_BADGE[team.categorie] && (
              <span
                className={`shrink-0 rounded-full px-1 py-px text-[7px] font-medium ${CATEGORIE_BADGE[team.categorie]}`}
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

        {/* Body */}
        {dl === "overzicht" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
            <div className="flex items-center gap-3 text-base">
              <span className="font-semibold text-pink-500">♀ {aantalV}</span>
              <span className="font-semibold text-blue-500">♂ {aantalM}</span>
            </div>
            <span className="text-sm text-gray-400">gem. {gemLeeftijd}</span>
          </div>
        ) : (
          <div className="min-h-6 flex-1 overflow-hidden px-0.5">
            {aantalSpelers === 0 ? (
              <p className="py-2 text-center text-[9px] text-gray-400">Geen spelers</p>
            ) : isDouble ? (
              <div className="grid grid-cols-2 gap-x-0.5">
                <div>
                  <div className="flex items-center gap-0.5 px-1 pt-0.5">
                    <svg
                      className="h-2 w-2 text-pink-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="10" r="6" />
                      <path d="M12 16v6M9 20h6" />
                    </svg>
                    <span className="text-[8px] font-medium text-pink-500">{dames.length}</span>
                  </div>
                  {dames.map((ts) => (
                    <ViewSpelerRij
                      key={ts.id}
                      speler={ts.speler}
                      statusOverride={ts.statusOverride}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 px-1 pt-0.5">
                    <svg
                      className="h-2 w-2 text-blue-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="10" cy="14" r="6" />
                      <path d="M21 3l-6.5 6.5M21 3h-5M21 3v5" />
                    </svg>
                    <span className="text-[8px] font-medium text-blue-500">{heren.length}</span>
                  </div>
                  {heren.map((ts) => (
                    <ViewSpelerRij
                      key={ts.id}
                      speler={ts.speler}
                      statusOverride={ts.statusOverride}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {dames.length > 0 && (
                  <>
                    <div className="flex items-center gap-0.5 px-1 pt-0.5">
                      <svg
                        className="h-2 w-2 text-pink-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="10" r="6" />
                        <path d="M12 16v6M9 20h6" />
                      </svg>
                      <span className="text-[8px] font-medium text-pink-500">{dames.length}</span>
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
                {heren.length > 0 && (
                  <>
                    <div className="flex items-center gap-0.5 px-1 pt-0.5">
                      <svg
                        className="h-2 w-2 text-blue-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="10" cy="14" r="6" />
                        <path d="M21 3l-6.5 6.5M21 3h-5M21 3v5" />
                      </svg>
                      <span className="text-[8px] font-medium text-blue-500">{heren.length}</span>
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
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {dl !== "overzicht" && (
          <div
            className={`mt-auto flex items-center justify-between px-1.5 py-0.5 ${footerBorder}`}
          >
            <div className="flex items-center gap-1">
              {meldingen.length > 0 && (
                <span className="group relative" title={meldingen.map((m) => m.bericht).join("\n")}>
                  <svg
                    className={`h-3 w-3 ${meldingen.some((m) => m.ernst === "kritiek") ? "text-red-500" : meldingen.some((m) => m.ernst === "aandacht") ? "text-orange-400" : "text-blue-400"}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  {meldingen.length > 1 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[6px] font-bold text-white">
                      {meldingen.length}
                    </span>
                  )}
                </span>
              )}
              <span className="text-[7px] text-gray-400">{aantalSpelers} sp</span>
            </div>
            <span className="shrink-0 text-[8px] text-gray-400 tabular-nums">
              gem. {gemLeeftijd}
            </span>
          </div>
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
  statusOverride: import("@oranje-wit/database").SpelerStatus | null;
  onSpelerClick?: (speler: SpelerData) => void;
}) {
  const status = statusOverride ?? speler.status;
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const vorigTeam = huidig?.team ?? null;

  const STATUS_BORDER: Record<string, string> = {
    BESCHIKBAAR: "border-l-emerald-400",
    TWIJFELT: "border-l-amber-400",
    GAAT_STOPPEN: "border-l-red-400",
    NIEUW_POTENTIEEL: "border-l-sky-400",
    NIEUW_DEFINITIEF: "border-l-blue-500",
  };

  return (
    <div
      className={`flex items-center gap-0.5 rounded-r border-l-2 px-1 py-px ${STATUS_BORDER[status] ?? "border-l-gray-200"}`}
    >
      {vorigTeam && (
        <span className="max-w-[40px] shrink-0 truncate text-[7px] text-gray-400" title={vorigTeam}>
          {vorigTeam}
        </span>
      )}
      <span
        className={`min-w-0 flex-1 truncate text-[10px] leading-none text-gray-800 ${
          onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
        }`}
        onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
      >
        {speler.roepnaam} {speler.achternaam}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-[8px] text-gray-500 tabular-nums">{leeftijd.toFixed(2)}</span>
        {kleur && (
          <span className={`h-1.5 w-1.5 rounded-full ring-1 ring-white ${KLEUR_DOT[kleur]}`} />
        )}
      </div>
    </div>
  );
}
