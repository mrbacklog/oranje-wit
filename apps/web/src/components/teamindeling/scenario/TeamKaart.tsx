"use client";

import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData, DetailLevel } from "./types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";
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
  teamKleurGradient,
} from "@/lib/teamindeling/teamKaartStijl";
import TeamSpelerRij from "./TeamSpelerRij";
import ValidatieBadge from "./ValidatieBadge";
import ValidatieMeldingen from "./ValidatieMeldingen";
import { getCardSize } from "./editor/cardSizes";
import { useZoomScale } from "./editor/ZoomScaleContext";

export interface TeamKaartProps {
  team: TeamData;
  validatie?: TeamValidatie;
  notitieCount?: number;
  detailLevel?: DetailLevel;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  jIndicatie?: string;
  teamSterkte?: number;
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
  pinnedSpelerIds,
  showRanking,
  jIndicatie,
  teamSterkte,
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

  const gesorteerd = sorteerSpelers(team.spelers);
  const heren = gesorteerd.filter((ts) => ts.speler.geslacht === "M");
  const dames = gesorteerd.filter((ts) => ts.speler.geslacht === "V");

  // Twee-laags stijl: categorie-rand + validatie-ring
  const randKlassen = categorieRandKlassen(team.categorie, team.kleur);
  const achtergrond = categorieAchtergrond(team.categorie, team.kleur);
  const headerBorder = categorieHeaderBorder(team.categorie, team.kleur);
  const footerBorder = categorieFooterBorder(team.categorie, team.kleur);
  const ringKlassen = validatieRingKlassen(validatie?.status, isOver);
  const weergaveNaam = team.alias ?? team.naam;

  const { w: cardWidth, h: cardHeight } = getCardSize(team.teamType ?? "ACHTAL", false);
  const isDouble = (team.teamType ?? "ACHTAL") !== "VIERTAL";

  // Compenseer tekst voor zoom
  const zoomScale = useZoomScale();
  const textScale = zoomScale < 1 ? 1 / Math.max(zoomScale, 0.5) : 1;

  // Validatie meldingen voor footer
  const meldingen = validatie?.meldingen ?? [];

  return (
    <div
      ref={setNodeRef}
      data-team-id={team.id}
      style={{ width: cardWidth, height: cardHeight, position: "relative" }}
      className={`flex flex-col rounded-lg transition-colors ${randKlassen} ${achtergrond} ${ringKlassen}`}
    >
      {/* KNKV kleurband — 3px verticaal links */}
      <div
        style={{
          background: teamKleurGradient(team.kleur),
          width: "3px",
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          borderRadius: "8px 0 0 8px",
        }}
      />
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
        {/* ── Header: [drag] TEAMNAAM [badges] [acties] ── */}
        <div className={`flex items-center justify-between px-1.5 py-1 ${headerBorder}`}>
          <div className="relative flex min-w-0 items-center gap-1">
            {dl === "detail" && (
              <span className="shrink-0 text-[var(--text-tertiary)]">
                <svg className="h-2.5 w-2.5" viewBox="0 0 10 16" fill="currentColor">
                  <circle cx="3" cy="2" r="1.2" />
                  <circle cx="7" cy="2" r="1.2" />
                  <circle cx="3" cy="8" r="1.2" />
                  <circle cx="7" cy="8" r="1.2" />
                  <circle cx="3" cy="14" r="1.2" />
                  <circle cx="7" cy="14" r="1.2" />
                </svg>
              </span>
            )}
            {dl === "detail" && validatie && (
              <ValidatieBadge
                status={validatie.status}
                onClick={() => setMeldingenOpen(!meldingenOpen)}
              />
            )}
            <h4
              onClick={() => onEditTeam?.(team.id)}
              className={`text-text-primary hover:text-ow-oranje cursor-pointer truncate font-semibold transition-colors ${
                dl === "overzicht" ? "text-xs" : "text-[11px]"
              }`}
            >
              {weergaveNaam}
            </h4>
            {/* Kleur/categorie badges inline — alleen bij detail */}
            {dl === "detail" && team.kleur && (
              <span
                className={`shrink-0 rounded-full px-1 py-px text-[7px] ${
                  KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-surface-raised text-text-secondary"
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
          {dl === "detail" && (
            <div className="flex shrink-0 items-center gap-0.5">
              {notitieCount != null && notitieCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotitiesClick?.(team.alias ?? team.naam);
                  }}
                  className="inline-flex h-3 min-w-3 items-center justify-center rounded-full bg-orange-500 px-0.5 text-[7px] font-bold text-white hover:bg-orange-600"
                  title={`${notitieCount} notitie(s)`}
                >
                  {notitieCount}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTeam?.(team.id);
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
                title="Bewerk team"
              >
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
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
                    className="animate-pulse text-[8px] font-medium text-red-600 hover:text-red-700"
                  >
                    Bevestig?
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDeleteBevestig(true);
                      deleteTimerRef.current = setTimeout(() => setDeleteBevestig(false), 3000);
                    }}
                    className="text-text-muted text-[10px] hover:text-red-500"
                    title="Verwijder team"
                  >
                    &times;
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* ── Body: overzicht = grote stats, detail = spelerrijen ── */}
        {dl === "overzicht" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
            <div className="flex items-center gap-3 text-base">
              <span className="font-semibold text-pink-500">♀ {aantalV}</span>
              <span className="font-semibold text-blue-500">♂ {aantalM}</span>
            </div>
            <span className="text-text-secondary text-sm">gem. {gemLeeftijd}</span>
          </div>
        ) : (
          <div className="min-h-6 flex-1 overflow-hidden px-0.5">
            {team.spelers.length === 0 ? (
              <p className="text-text-secondary py-2 text-center text-[9px]">
                Sleep spelers hierheen
              </p>
            ) : !isDouble ? (
              /* Viertal: gestapeld */
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
                      <TeamSpelerRij
                        key={ts.id}
                        teamSpeler={ts}
                        teamId={team.id}
                        detailLevel={dl}
                        isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                        showRanking={showRanking}
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
                      <TeamSpelerRij
                        key={ts.id}
                        teamSpeler={ts}
                        teamId={team.id}
                        detailLevel={dl}
                        isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                        showRanking={showRanking}
                        onSpelerClick={onSpelerClick}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              /* Achtal: side-by-side kolommen */
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
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={team.id}
                      detailLevel={dl}
                      isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                      showRanking={showRanking}
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
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={team.id}
                      detailLevel={dl}
                      isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                      showRanking={showRanking}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer: alerts + gem. leeftijd ── */}
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
              <span className="text-text-secondary text-[7px]">{aantalSpelers} sp</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {jIndicatie && (
                <span className="rounded bg-indigo-900/30 px-1 text-[8px] font-bold text-indigo-300">
                  {jIndicatie}
                  {teamSterkte != null && (
                    <span className="font-normal text-indigo-400"> ({teamSterkte})</span>
                  )}
                </span>
              )}
              <span className="text-text-secondary text-[8px] tabular-nums">
                gem. {gemLeeftijd}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
