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

  const genderStijl = isVrouw ? { borderLeftColor: "#EC4899" } : { borderLeftColor: "#60A5FA" };

  const avatarStijl = isVrouw
    ? {
        background: "rgba(236,72,153,0.06)",
        border: "1px solid rgba(236,72,153,0.25)",
        color: "#EC4899",
      }
    : {
        background: "rgba(96,165,250,0.06)",
        border: "1px solid rgba(96,165,250,0.25)",
        color: "#60A5FA",
      };

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      data-speler-id={speler.id}
      data-dnd-draggable
      style={{
        ...style,
        borderLeft: "2px solid transparent",
        ...genderStijl,
        transition: "background 120ms",
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`flex cursor-grab items-center gap-2 px-3 py-1.5 ${
        isDragging ? "opacity-40" : "hover:bg-[#262626]"
      }`}
    >
      {/* Avatar cirkel */}
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
        style={avatarStijl}
      >
        {speler.roepnaam.charAt(0).toUpperCase()}
      </div>

      {/* Naam + meta */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1">
          <span className="truncate text-[11px] font-semibold" style={{ color: "#FAFAFA" }}>
            {speler.roepnaam} {speler.achternaam}
          </span>
          {speler.afmelddatum && <AfmeldBadge afmelddatum={speler.afmelddatum} />}
          {isPinned && (
            <svg
              className="h-2.5 w-2.5 shrink-0"
              style={{ color: "#a855f7" }}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Gepind"
            >
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: "#666" }}>
            {leeftijd.toFixed(1)} · {isVrouw ? "V" : "M"}
          </span>
          {vorigTeam && (
            <span
              className="max-w-[60px] truncate text-[10px]"
              style={{ color: "#666" }}
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
