"use client";

import { useDraggable } from "@dnd-kit/core";
import type { SpelerData, HuidigData } from "./types";
import { SEIZOEN_JAAR, STATUS_KLEUREN } from "./types";

interface SpelerKaartProps {
  speler: SpelerData;
  onClick: () => void;
}

export default function SpelerKaart({ speler, onClick }: SpelerKaartProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `pool-${speler.id}`,
      data: { type: "pool-speler", spelerId: speler.id },
    });

  const leeftijd = SEIZOEN_JAAR - speler.geboortejaar;
  const huidig = speler.huidig as HuidigData | null;
  const vorigTeam = huidig?.team ?? null;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Alleen openen bij klik, niet bij drag
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 bg-white cursor-grab hover:border-orange-300 hover:shadow-sm transition-all ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Status dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_KLEUREN[speler.status]}`}
        title={speler.status}
      />

      {/* Naam */}
      <span className="text-sm text-gray-800 truncate flex-1">
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Leeftijd */}
      <span className="text-xs text-gray-400 flex-shrink-0">{leeftijd}</span>

      {/* Geslacht */}
      <span className="text-xs flex-shrink-0" title={speler.geslacht === "M" ? "Man" : "Vrouw"}>
        {speler.geslacht === "M" ? "\u2642" : "\u2640"}
      </span>

      {/* Vorig team */}
      {vorigTeam && (
        <span className="text-[10px] text-gray-400 flex-shrink-0 truncate max-w-[60px]" title={vorigTeam}>
          {vorigTeam}
        </span>
      )}
    </div>
  );
}
