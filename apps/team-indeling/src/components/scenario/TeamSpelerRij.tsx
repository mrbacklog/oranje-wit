"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TeamSpelerData } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

interface TeamSpelerRijProps {
  teamSpeler: TeamSpelerData;
  teamId: string;
}

export default function TeamSpelerRij({ teamSpeler, teamId }: TeamSpelerRijProps) {
  const { speler } = teamSpeler;
  const status = teamSpeler.statusOverride ?? speler.status;
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);

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
      <span
        {...listeners}
        {...attributes}
        className="flex-shrink-0 cursor-grab text-xs text-gray-300 hover:text-gray-500"
        title="Versleep"
      >
        &#9776;
      </span>

      {/* Avatar */}
      <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />

      {/* Status dot */}
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />

      {/* Naam */}
      <span className="flex-1 truncate text-xs text-gray-800">
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Korfballeeftijd + kleurindicatie */}
      <span
        className="inline-flex shrink-0 items-center gap-0.5"
        title={`Geboortejaar ${speler.geboortejaar}`}
      >
        {kleur && <span className={`h-1 w-1 rounded-full ${KLEUR_DOT[kleur]}`} />}
        <span className="text-[10px] text-gray-400">{leeftijd.toFixed(2)}</span>
      </span>

      {/* Geslacht */}
      <span className="shrink-0 text-[10px]">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
    </div>
  );
}
