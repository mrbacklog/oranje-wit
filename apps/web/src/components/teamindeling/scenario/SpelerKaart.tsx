"use client";

import { useDraggable } from "@dnd-kit/core";
import type { SpelerData, HuidigData } from "./types";
import { korfbalLeeftijd } from "./types";
import AfmeldBadge from "./AfmeldBadge";

interface SpelerKaartProps {
  speler: SpelerData;
  isPinned?: boolean;
  onClick: () => void;
}

export default function SpelerKaart({ speler, isPinned, onClick }: SpelerKaartProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${speler.id}`,
    data: { type: "pool-speler", spelerId: speler.id },
  });

  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const huidig = speler.huidig as HuidigData | null;
  const vorigTeam = huidig?.team ?? null;
  const isVrouw = speler.geslacht === "V";

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      data-speler-id={speler.id}
      data-dnd-draggable
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`flex cursor-grab items-center gap-2 border-l-2 px-3 py-1.5 ${
        isVrouw ? "border-l-pink-400" : "border-l-blue-400"
      } ${isDragging ? "opacity-40" : "hover:bg-surface-raised"}`}
    >
      {/* Avatar cirkel */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
          isVrouw
            ? "border border-pink-400/25 bg-pink-400/5 text-pink-400"
            : "border border-blue-400/25 bg-blue-400/5 text-blue-400"
        }`}
      >
        {speler.roepnaam.charAt(0).toUpperCase()}
      </div>

      {/* Naam + meta */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1">
          <span className="text-text-primary truncate text-[11px] font-semibold">
            {speler.roepnaam} {speler.achternaam}
          </span>
          {speler.afmelddatum && <AfmeldBadge afmelddatum={speler.afmelddatum} />}
          {isPinned && (
            <svg
              className="h-2.5 w-2.5 shrink-0 text-purple-500"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Gepind"
            >
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[10px]">
            {leeftijd.toFixed(1)} · {isVrouw ? "V" : "M"}
          </span>
          {vorigTeam && (
            <span
              className="text-text-tertiary max-w-[60px] truncate text-[10px]"
              title={vorigTeam}
            >
              {vorigTeam}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
