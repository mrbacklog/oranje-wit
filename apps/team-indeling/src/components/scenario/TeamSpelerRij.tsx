"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TeamSpelerData, SpelerData, HuidigData, DetailLevel } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

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
      className={`group flex items-center gap-1.5 rounded px-2 py-1 text-sm ${
        isDragging ? "bg-gray-100 opacity-50" : "hover:bg-gray-50"
      }`}
    >
      {/* Drag handle */}
      {(dl === "detail" || dl === "focus") && (
        <span
          {...listeners}
          {...attributes}
          className="shrink-0 cursor-grab text-xs text-gray-300 hover:text-gray-500"
          title="Versleep"
        >
          &#9776;
        </span>
      )}

      {/* Avatar */}
      {(dl === "detail" || dl === "focus") && (
        <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />
      )}

      {/* Status dot */}
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />

      {/* Naam */}
      <span
        className={`flex-1 truncate text-xs text-gray-800 ${
          onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
        }`}
        onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
      >
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Korfballeeftijd + kleurindicatie */}
      {(dl === "detail" || dl === "focus") && (
        <span
          className="inline-flex shrink-0 items-center gap-0.5"
          title={`Geboortejaar ${speler.geboortejaar}`}
        >
          {kleur && <span className={`h-1 w-1 rounded-full ${KLEUR_DOT[kleur]}`} />}
          <span className="text-[10px] text-gray-400">{leeftijd.toFixed(2)}</span>
        </span>
      )}

      {/* Geslacht */}
      {(dl === "detail" || dl === "focus") && (
        <span className="shrink-0 text-[10px]">
          {speler.geslacht === "M" ? "\u2642" : "\u2640"}
        </span>
      )}

      {/* Huidig team */}
      {(dl === "detail" || dl === "focus") && vorigTeam && (
        <span className="max-w-[50px] shrink-0 truncate text-[9px] text-gray-400" title={vorigTeam}>
          {vorigTeam}
        </span>
      )}
    </div>
  );
}
