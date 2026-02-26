"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TeamSpelerData } from "./types";
import { SEIZOEN_JAAR, STATUS_KLEUREN } from "./types";

interface TeamSpelerRijProps {
  teamSpeler: TeamSpelerData;
  teamId: string;
}

export default function TeamSpelerRij({ teamSpeler, teamId }: TeamSpelerRijProps) {
  const { speler } = teamSpeler;
  const status = teamSpeler.statusOverride ?? speler.status;
  const leeftijd = SEIZOEN_JAAR - speler.geboortejaar;

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

      {/* Status dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_KLEUREN[status]}`}
      />

      {/* Naam */}
      <span className="text-gray-800 truncate flex-1 text-xs">
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Leeftijd */}
      <span className="text-[10px] text-gray-400 flex-shrink-0">{leeftijd}</span>

      {/* Geslacht */}
      <span className="text-[10px] flex-shrink-0">
        {speler.geslacht === "M" ? "\u2642" : "\u2640"}
      </span>
    </div>
  );
}
