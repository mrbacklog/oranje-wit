"use client";

import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData, DetailLevel, SelectieGroepData, TeamSpelerData } from "./types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";
import type { SelectieValidatie } from "@/lib/teamindeling/validatie/selectie-regels";
import { korfbalLeeftijd, sorteerSpelers } from "./types";
import { getCardSize } from "./editor/cardSizes";
import { useZoomScale } from "./editor/ZoomScaleContext";
import SelectieSpelerGrid from "./SelectieSpelerGrid";

export interface SelectieBlokProps {
  teams: TeamData[];
  selectieGroep?: SelectieGroepData;
  validatieMap?: Map<string, TeamValidatie>;
  selectieValidatie?: SelectieValidatie;
  detailLevel?: DetailLevel;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  onOntkoppel: (groepId: string) => void;
  onUpdateNaam?: (groepId: string, naam: string | null) => void;
  onDelete: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
  onEditTeam?: (teamId: string) => void;
  jIndicatie?: string;
  teamSterkte?: number;
}

export default function SelectieBlok({
  teams,
  selectieGroep,
  validatieMap: _validatieMap,
  selectieValidatie,
  detailLevel,
  pinnedSpelerIds,
  showRanking,
  onOntkoppel,
  onUpdateNaam,
  onDelete,
  onSpelerClick,
  onEditTeam,
  jIndicatie,
  teamSterkte,
}: SelectieBlokProps) {
  const dl = detailLevel ?? "detail";
  const [deleteBevestig, setDeleteBevestig] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [naamEdit, setNaamEdit] = useState(false);
  const [naamWaarde, setNaamWaarde] = useState("");

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const eersteTeam = teams[0];
  const teamNamen = teams.map((t) => t.alias ?? t.naam).join(" + ");
  const weergaveNaam = selectieGroep?.naam ?? teamNamen;

  const alleSpelers = selectieGroep
    ? sorteerSpelers(selectieGroep.spelers as TeamSpelerData[])
    : sorteerSpelers(eersteTeam?.spelers ?? []);
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

  const alleStaf = selectieGroep ? selectieGroep.staf : (eersteTeam?.staf ?? []);
  const meldingen = selectieValidatie?.meldingen ?? [];

  const { setNodeRef, isOver } = useDroppable({
    id: `team-${eersteTeam?.id}`,
    data: { type: "team", teamId: eersteTeam?.id },
  });

  const { w: cardWidth, h: cardHeight } = getCardSize("ACHTAL", true);

  const zoomScale = useZoomScale();
  const textScale = zoomScale < 1 ? 1 / Math.max(zoomScale, 0.5) : 1;

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        border: isOver ? "2px dashed rgba(255,107,0,0.7)" : "2px dashed rgba(255,107,0,0.35)",
        boxShadow: isOver
          ? "0 0 0 2px rgba(255,107,0,0.15), 0 4px 16px rgba(0,0,0,0.4)"
          : "0 2px 4px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.35)",
      }}
      className="bg-surface-card flex flex-col rounded-lg"
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
        {/* ── Header: [drag] Selectie NAAM [acties] ── */}
        <div
          className="border-border-default flex items-center justify-between rounded-t-lg border-b px-1.5 py-1"
          style={{ height: 36 }}
        >
          <div className="flex min-w-0 items-center gap-1">
            {dl === "detail" && (
              <span className="text-text-muted shrink-0">
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
            <span className="text-ow-oranje shrink-0 text-[7px] font-medium tracking-wide uppercase">
              Selectie
            </span>
            {naamEdit && onUpdateNaam && selectieGroep ? (
              <input
                autoFocus
                className="border-border-default bg-surface-raised text-text-primary min-w-0 flex-1 rounded border px-1 text-[11px] font-semibold outline-none focus:ring-1 focus:ring-orange-400"
                value={naamWaarde}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNaamWaarde(e.target.value)}
                onBlur={() => {
                  setNaamEdit(false);
                  const trimmed = naamWaarde.trim();
                  onUpdateNaam(selectieGroep.id, trimmed || null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setNaamWaarde(selectieGroep.naam ?? "");
                    setNaamEdit(false);
                  }
                }}
              />
            ) : (
              <h4
                className={`text-text-primary hover:text-ow-oranje truncate font-extrabold transition-colors ${
                  dl === "compact" ? "text-xs" : "text-[11px]"
                } ${dl === "detail" && onUpdateNaam ? "cursor-pointer" : ""}`}
                title={teamNamen}
                onClick={
                  dl === "detail" && onUpdateNaam && selectieGroep
                    ? () => {
                        setNaamWaarde(selectieGroep.naam ?? "");
                        setNaamEdit(true);
                      }
                    : undefined
                }
              >
                {weergaveNaam}
              </h4>
            )}
          </div>
          {dl === "detail" && (
            <div className="flex shrink-0 items-center gap-0.5">
              {/* Ontkoppel selectie */}
              {selectieGroep && (
                <button
                  onClick={() => onOntkoppel(selectieGroep.id)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                  title="Ontkoppel selectie"
                >
                  <svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </button>
              )}
              {/* Bewerk selectie */}
              {eersteTeam && (
                <button
                  onClick={() => onEditTeam?.(eersteTeam.id)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                  title="Bewerk selectie"
                >
                  <svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}
              {/* Verwijder selectie */}
              {eersteTeam &&
                onDelete &&
                (deleteBevestig ? (
                  <button
                    onClick={() => {
                      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                      setDeleteBevestig(false);
                      onDelete(eersteTeam.id);
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

        {/* Staf (compact) */}
        {dl === "detail" && alleStaf.length > 0 && (
          <div className="border-border-default border-b px-1.5 py-px">
            <span className="text-text-tertiary text-[7px]">
              Staf:{" "}
              {alleStaf.map((ts, i) => (
                <span key={ts.id}>
                  {i > 0 && ", "}
                  {ts.staf.naam}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* ── Body: compact = grote stats, normaal/detail = spelerrijen ── */}
        {dl === "compact" ? (
          <div
            ref={setNodeRef}
            className="flex flex-1 flex-col items-center justify-center gap-2 px-2"
          >
            <div className="flex items-center gap-3 text-base">
              <span className="font-bold text-pink-400">♀ {aantalV}</span>
              <span className="font-bold text-blue-400">♂ {aantalM}</span>
            </div>
            <span className="text-text-secondary text-sm">gem. {gemLeeftijd}</span>
          </div>
        ) : (
          <div ref={setNodeRef} className="min-h-6 flex-1 overflow-hidden px-0.5">
            {alleSpelers.length === 0 ? (
              <p className="text-text-secondary py-2 text-center text-[9px]">
                Sleep spelers hierheen
              </p>
            ) : (
              <SelectieSpelerGrid
                dames={dames}
                heren={heren}
                teamId={eersteTeam?.id ?? ""}
                detailLevel={dl}
                pinnedSpelerIds={pinnedSpelerIds}
                showRanking={showRanking}
                onSpelerClick={onSpelerClick}
              />
            )}
          </div>
        )}

        {/* ── Footer: alerts + gem. leeftijd ── */}
        {dl !== "compact" && (
          <div
            className="border-border-default mt-auto flex items-center justify-between border-t px-1.5 py-0.5"
            style={{ height: 28 }}
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
