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

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm group ${
        isDragging ? "opacity-50 bg-gray-100" : "hover:bg-gray-50"
      }`}
    >
      {/* Drag handle */}
      <span
        {...listeners}
        {...attributes}
        className="text-gray-300 cursor-grab hover:text-gray-500 text-xs flex-shrink-0"
        title="Versleep"
      >
        &#9776;
      </span>

      {/* Avatar */}
      <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />

      {/* Status dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_KLEUREN[status]}`}
      />

      {/* Naam */}
      <span className="text-gray-800 truncate flex-1 text-xs">
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Korfballeeftijd + kleurindicatie */}
      <span
        className="inline-flex items-center gap-0.5 shrink-0"
        title={`Geboortejaar ${speler.geboortejaar}`}
      >
        {kleur && <span className={`w-1 h-1 rounded-full ${KLEUR_DOT[kleur]}`} />}
        <span className="text-[10px] text-gray-400">{leeftijd.toFixed(2)}</span>
      </span>

      {/* Geslacht */}
      <span className="text-[10px] shrink-0">
        {speler.geslacht === "M" ? "\u2642" : "\u2640"}
      </span>
    </div>
  );
}
