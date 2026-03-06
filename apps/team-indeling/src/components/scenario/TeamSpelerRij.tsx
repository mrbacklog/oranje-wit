"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TeamSpelerData, SpelerData, HuidigData, DetailLevel } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";

interface TeamSpelerRijProps {
  teamSpeler: TeamSpelerData;
  teamId: string;
  detailLevel?: DetailLevel;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function TeamSpelerRij({
  teamSpeler,
  teamId,
  detailLevel,
  onSpelerClick,
}: TeamSpelerRijProps) {
  const dl = detailLevel ?? "detail";
  const { speler } = teamSpeler;
  const status = teamSpeler.statusOverride ?? speler.status;
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const vorigTeam = huidig?.team ?? null;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `team-${teamId}-${speler.id}`,
    data: {
      type: "team-speler",
      spelerId: speler.id,
      teamId,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col rounded border border-gray-100 px-1.5 py-px ${
        isDragging ? "bg-gray-100 opacity-50" : "hover:bg-gray-50"
      }`}
    >
      {/* Regel 1: drag handle + geslacht + status + naam + kleur-dot */}
      <div className="flex items-center gap-1">
        {(dl === "detail" || dl === "focus") && (
          <span
            {...listeners}
            {...attributes}
            className="shrink-0 cursor-grab text-gray-300 hover:text-gray-500"
            style={{ fontSize: "calc(12px / var(--zoom-scale, 1))" }}
            title="Versleep"
          >
            &#9776;
          </span>
        )}
        <span
          className="shrink-0 text-gray-400"
          style={{ fontSize: "calc(11px / var(--zoom-scale, 1))" }}
        >
          {speler.geslacht === "M" ? "\u2642" : "\u2640"}
        </span>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />
        <span
          className={`flex-1 truncate text-gray-800 ${
            onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
          }`}
          style={{ fontSize: "calc(13px / var(--zoom-scale, 1))" }}
          onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
        >
          {speler.roepnaam} {speler.achternaam}
        </span>
        {(dl === "detail" || dl === "focus") && kleur && (
          <span className={`h-2 w-2 shrink-0 rounded-full ${KLEUR_DOT[kleur]}`} />
        )}
      </div>

      {/* Regel 2: eerder team + leeftijd */}
      {(dl === "detail" || dl === "focus") && (
        <div
          className="flex items-center gap-1 pl-4 text-gray-400"
          style={{ fontSize: "calc(11px / var(--zoom-scale, 1))" }}
        >
          <span className="flex-1 truncate">{vorigTeam ?? "\u2014"}</span>
          <span>{leeftijd.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
