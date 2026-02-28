"use client";

import { useDraggable } from "@dnd-kit/core";
import type { SpelerData, HuidigData } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

interface SpelerKaartProps {
  speler: SpelerData;
  onClick: () => void;
}

export default function SpelerKaart({ speler, onClick }: SpelerKaartProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${speler.id}`,
    data: { type: "pool-speler", spelerId: speler.id },
  });

  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
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
      className={`flex cursor-grab items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 transition-all hover:border-orange-300 hover:shadow-sm ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Avatar */}
      <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="sm" />

      {/* Status dot */}
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_KLEUREN[speler.status]}`}
        title={speler.status}
      />

      {/* Naam */}
      <span className="flex-1 truncate text-sm text-gray-800">
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Korfballeeftijd + kleurindicatie */}
      <span
        className="inline-flex flex-shrink-0 items-center gap-0.5"
        title={`Geboortejaar ${speler.geboortejaar}`}
      >
        {kleur && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleur]}`} />}
        <span className="text-xs text-gray-400">{leeftijd.toFixed(2)}</span>
      </span>

      {/* Geslacht */}
      <span className="flex-shrink-0 text-xs" title={speler.geslacht === "M" ? "Man" : "Vrouw"}>
        {speler.geslacht === "M" ? "\u2642" : "\u2640"}
      </span>

      {/* Vorig team */}
      {vorigTeam && (
        <span
          className="max-w-[60px] flex-shrink-0 truncate text-[10px] text-gray-400"
          title={vorigTeam}
        >
          {vorigTeam}
        </span>
      )}
    </div>
  );
}
