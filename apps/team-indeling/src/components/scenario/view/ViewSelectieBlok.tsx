"use client";

import type {
  TeamData,
  SpelerData,
  HuidigData,
  DetailLevel,
  SelectieGroepData,
  TeamSpelerData,
} from "../types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import { KLEUR_DOT, korfbalLeeftijd, kleurIndicatie, sorteerSpelers } from "../types";
import { getCardSize } from "../editor/cardSizes";
import { useZoomScale } from "../editor/ZoomScaleContext";

interface ViewSelectieBlokProps {
  teams: TeamData[];
  selectieGroep?: SelectieGroepData;
  validatieMap?: Map<string, TeamValidatie>;
  detailLevel?: DetailLevel;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function ViewSelectieBlok({
  teams,
  selectieGroep,
  validatieMap,
  detailLevel,
  onSpelerClick,
}: ViewSelectieBlokProps) {
  const dl = detailLevel ?? "detail";
  const teamNamen = teams.map((t) => t.alias ?? t.naam).join(" + ");

  const alleSpelers: TeamSpelerData[] = selectieGroep
    ? (selectieGroep.spelers as TeamSpelerData[])
    : (teams[0]?.spelers ?? []);
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
        ).toFixed(1)
      : "-";

  // Splits in 4 kolommen
  const dames1 = dames.slice(0, Math.ceil(dames.length / 2));
  const dames2 = dames.slice(Math.ceil(dames.length / 2));
  const heren1 = heren.slice(0, Math.ceil(heren.length / 2));
  const heren2 = heren.slice(Math.ceil(heren.length / 2));

  const eersteTeam = teams[0];
  const validatie = validatieMap?.get(eersteTeam?.id ?? "");
  const meldingen = validatie?.meldingen ?? [];

  const { w: cardWidth, h: cardHeight } = getCardSize("ACHTAL", true);

  const zoomScale = useZoomScale();
  const textScale = zoomScale < 1 ? 1 / Math.max(zoomScale, 0.5) : 1;

  return (
    <div
      style={{ width: cardWidth, height: cardHeight }}
      className="flex flex-col rounded-lg border-2 border-dashed border-orange-300 bg-orange-50/50 ring-2 ring-orange-100 ring-offset-1"
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
        <div className="flex items-center justify-between rounded-t-lg border-b border-orange-200 bg-orange-50 px-1.5 py-1">
          <div className="flex min-w-0 items-center gap-1">
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
            ) : (
              <div className="grid grid-cols-4 gap-x-0.5">
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
                    <ViewSpelerRij
                      key={ts.id}
                      speler={ts.speler}
                      status={ts.statusOverride ?? ts.speler.status}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
                <div>
                  <div className="h-4" />
                  {dames2.map((ts) => (
                    <ViewSpelerRij
                      key={ts.id}
                      speler={ts.speler}
                      status={ts.statusOverride ?? ts.speler.status}
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
                  {heren1.map((ts) => (
                    <ViewSpelerRij
                      key={ts.id}
                      speler={ts.speler}
                      status={ts.statusOverride ?? ts.speler.status}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
                <div>
                  <div className="h-4" />
                  {heren2.map((ts) => (
                    <ViewSpelerRij
                      key={ts.id}
                      speler={ts.speler}
                      status={ts.statusOverride ?? ts.speler.status}
                      onSpelerClick={onSpelerClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
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

function ViewSpelerRij({
  speler,
  status,
  onSpelerClick,
}: {
  speler: SpelerData;
  status: import("@oranje-wit/database").SpelerStatus;
  onSpelerClick?: (speler: SpelerData) => void;
}) {
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
      <span
        className={`min-w-0 flex-1 truncate text-[10px] leading-none text-gray-800 ${
          onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
        }`}
        onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
      >
        {speler.roepnaam} {speler.achternaam}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {kleur && (
          <span className={`h-1.5 w-1.5 rounded-full ring-1 ring-white ${KLEUR_DOT[kleur]}`} />
        )}
        <span className="text-[8px] text-gray-400 tabular-nums">{leeftijd.toFixed(1)}</span>
      </div>
      {vorigTeam && (
        <span className="max-w-[40px] shrink-0 truncate text-[7px] text-gray-400" title={vorigTeam}>
          {vorigTeam}
        </span>
      )}
    </div>
  );
}
