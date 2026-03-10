"use client";

import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData, DetailLevel, SelectieGroepData, TeamSpelerData } from "./types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import { korfbalLeeftijd, sorteerSpelers } from "./types";
import { getCardSize } from "./editor/cardSizes";
import { useZoomScale } from "./editor/ZoomScaleContext";
import TeamSpelerRij from "./TeamSpelerRij";

export interface SelectieBlokProps {
  teams: TeamData[];
  selectieGroep?: SelectieGroepData;
  validatieMap?: Map<string, TeamValidatie>;
  detailLevel?: DetailLevel;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
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
  pinnedSpelerIds,
  showRanking,
  onOntkoppel: _onOntkoppel,
  onDelete: _onDelete,
  onSpelerClick,
  onEditTeam,
}: SelectieBlokProps) {
  const dl = detailLevel ?? "detail";

  const eersteTeam = teams[0];
  const teamNamen = teams.map((t) => t.alias ?? t.naam).join(" + ");

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

  // Splits dames en heren elk in 2 kolommen
  const dames1 = dames.slice(0, Math.ceil(dames.length / 2));
  const dames2 = dames.slice(Math.ceil(dames.length / 2));
  const heren1 = heren.slice(0, Math.ceil(heren.length / 2));
  const heren2 = heren.slice(Math.ceil(heren.length / 2));

  const alleStaf = selectieGroep ? selectieGroep.staf : (eersteTeam?.staf ?? []);
  const validatie = validatieMap?.get(eersteTeam?.id ?? "");
  const meldingen = validatie?.meldingen ?? [];

  const { setNodeRef, isOver } = useDroppable({
    id: `team-${eersteTeam?.id}`,
    data: { type: "team", teamId: eersteTeam?.id },
  });

  const borderKleur = isOver
    ? "border-orange-400 ring-2 ring-orange-200"
    : "border-orange-300 ring-2 ring-orange-100 ring-offset-1";

  const { w: cardWidth, h: cardHeight } = getCardSize("ACHTAL", true);

  const zoomScale = useZoomScale();
  const textScale = zoomScale < 1 ? 1 / Math.max(zoomScale, 0.5) : 1;

  return (
    <div
      style={{ width: cardWidth, height: cardHeight }}
      className={`flex flex-col rounded-lg border-2 border-dashed bg-orange-50/50 ${borderKleur}`}
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
        {/* ── Header: [drag] Selectie TEAMNAMEN [acties] ── */}
        <div className="flex items-center justify-between rounded-t-lg border-b border-orange-200 bg-orange-50 px-1.5 py-1">
          <div className="flex min-w-0 items-center gap-1">
            {dl === "detail" && (
              <span className="shrink-0 text-orange-300">
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
            <span className="shrink-0 text-[7px] font-medium tracking-wide text-orange-600 uppercase">
              Selectie
            </span>
            <h4
              className={`truncate font-semibold text-gray-900 ${
                dl === "overzicht" ? "text-xs" : "text-[11px]"
              }`}
            >
              {teamNamen}
            </h4>
          </div>
          {dl === "detail" && (
            <div className="flex shrink-0 items-center gap-0.5">
              {eersteTeam && (
                <button
                  onClick={() => onEditTeam?.(eersteTeam.id)}
                  className="text-orange-400 transition-colors hover:text-orange-700"
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
            </div>
          )}
        </div>

        {/* Staf (compact) */}
        {dl === "detail" && alleStaf.length > 0 && (
          <div className="border-b border-orange-100 px-1.5 py-px">
            <span className="text-[7px] text-gray-500">
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

        {/* ── Body: overzicht = grote stats, detail = spelerrijen ── */}
        {dl === "overzicht" ? (
          <div
            ref={setNodeRef}
            className="flex flex-1 flex-col items-center justify-center gap-2 px-2"
          >
            <div className="flex items-center gap-3 text-base">
              <span className="font-semibold text-pink-500">♀ {aantalV}</span>
              <span className="font-semibold text-blue-500">♂ {aantalM}</span>
            </div>
            <span className="text-sm text-gray-400">gem. {gemLeeftijd}</span>
          </div>
        ) : (
          <div ref={setNodeRef} className="min-h-6 flex-1 overflow-hidden px-0.5">
            {alleSpelers.length === 0 ? (
              <p className="py-2 text-center text-[9px] text-gray-400">Sleep spelers hierheen</p>
            ) : (
              <div className="grid grid-cols-4 gap-x-0.5">
                {/* Dames kolom 1 */}
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
                  {dames1.map((ts) => (
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={eersteTeam?.id ?? ""}
                      detailLevel={dl}
                      isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                      showRanking={showRanking}
                      onSpelerClick={
                        onSpelerClick
                          ? (speler) => onSpelerClick(speler, eersteTeam?.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
                {/* Dames kolom 2 */}
                <div>
                  <div className="h-4" />
                  {dames2.map((ts) => (
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={eersteTeam?.id ?? ""}
                      detailLevel={dl}
                      isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                      showRanking={showRanking}
                      onSpelerClick={
                        onSpelerClick
                          ? (speler) => onSpelerClick(speler, eersteTeam?.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
                {/* Heren kolom 1 */}
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
                  {heren1.map((ts) => (
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={eersteTeam?.id ?? ""}
                      detailLevel={dl}
                      isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                      showRanking={showRanking}
                      onSpelerClick={
                        onSpelerClick
                          ? (speler) => onSpelerClick(speler, eersteTeam?.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
                {/* Heren kolom 2 */}
                <div>
                  <div className="h-4" />
                  {heren2.map((ts) => (
                    <TeamSpelerRij
                      key={ts.id}
                      teamSpeler={ts}
                      teamId={eersteTeam?.id ?? ""}
                      detailLevel={dl}
                      isPinned={pinnedSpelerIds?.has(ts.speler.id)}
                      showRanking={showRanking}
                      onSpelerClick={
                        onSpelerClick
                          ? (speler) => onSpelerClick(speler, eersteTeam?.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer: alerts + gem. leeftijd ── */}
        {dl !== "overzicht" && (
          <div className="mt-auto flex items-center justify-between border-t border-orange-100 px-1.5 py-0.5">
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
