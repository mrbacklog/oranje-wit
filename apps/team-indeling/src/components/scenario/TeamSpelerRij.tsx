"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TeamSpelerData, SpelerData, HuidigData, DetailLevel } from "./types";
import { kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import AfmeldBadge from "./AfmeldBadge";

/** Status → linkerrand kleur */
const STATUS_BORDER: Record<string, string> = {
  BESCHIKBAAR: "border-l-emerald-400",
  TWIJFELT: "border-l-amber-400",
  GAAT_STOPPEN: "border-l-red-400",
  NIEUW_POTENTIEEL: "border-l-sky-400",
  NIEUW_DEFINITIEF: "border-l-blue-500",
  ALGEMEEN_RESERVE: "border-l-gray-400",
};

/** Status → achtergrondtint voor waarschuwingen */
const STATUS_BG: Record<string, string> = {
  TWIJFELT: "bg-amber-50/60",
  GAAT_STOPPEN: "bg-red-50/60",
};

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
  const heeftNotitie = !!(teamSpeler.notitie || speler.notitie);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `team-${teamId}-${speler.id}`,
    data: {
      type: "team-speler",
      spelerId: speler.id,
      teamId,
    },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const heeftAfmelding = !!speler.afmelddatum;
  const borderLeft = heeftAfmelding
    ? "border-l-red-400"
    : (STATUS_BORDER[status] ?? "border-l-gray-200");
  const bgWarning = heeftAfmelding ? "bg-red-50/60" : (STATUS_BG[status] ?? "");
  const isWarning = heeftAfmelding || status === "TWIJFELT" || status === "GAAT_STOPPEN";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-r border-l-2 px-1 ${borderLeft} ${
        isDragging ? "bg-gray-100 opacity-40" : bgWarning || "hover:bg-gray-50/80"
      } py-px`}
    >
      {/* Drag handle — SVG grip dots */}
      {dl === "detail" && (
        <span
          {...listeners}
          {...attributes}
          data-dnd-draggable
          className="shrink-0 cursor-grab touch-none text-gray-300 hover:text-gray-500"
          title="Versleep"
        >
          <svg className="h-2 w-2" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="3" cy="2" r="1" />
            <circle cx="7" cy="2" r="1" />
            <circle cx="3" cy="6" r="1" />
            <circle cx="7" cy="6" r="1" />
            <circle cx="3" cy="10" r="1" />
            <circle cx="7" cy="10" r="1" />
          </svg>
        </span>
      )}

      {/* Naam + metadata */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Regel 1: naam — volledige regelhoogte */}
        <span
          className={`truncate text-[10px] leading-none font-medium text-gray-800 ${
            onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
          } ${isWarning ? "italic" : ""}`}
          onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
        >
          {speler.roepnaam} {speler.achternaam}
          {heeftAfmelding && <AfmeldBadge afmelddatum={speler.afmelddatum!} />}
        </span>

        {/* Regel 2: vorig team — halve regelhoogte */}
        {dl === "detail" && (
          <div className="text-[8px] leading-none text-gray-400">
            <span className="truncate">{vorigTeam ?? "\u2014"}</span>
          </div>
        )}
      </div>

      {/* Rechter indicatoren */}
      <div className="flex shrink-0 items-center gap-0.5">
        {/* Leeftijd */}
        {dl === "detail" && (
          <span className="shrink-0 text-[8px] text-gray-500 tabular-nums">
            {leeftijd.toFixed(2)}
          </span>
        )}

        {/* Notitie indicator */}
        {heeftNotitie && (
          <svg
            className="h-2 w-2 text-amber-400"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-label="Heeft notitie"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}

        {/* Waarschuwing icoon bij TWIJFELT/GAAT_STOPPEN */}
        {status === "GAAT_STOPPEN" && (
          <svg
            className="h-2.5 w-2.5 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-label="Gaat stoppen"
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        )}
        {status === "TWIJFELT" && (
          <svg
            className="h-2.5 w-2.5 text-amber-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-label="Twijfelt"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        )}

        {/* Kleurindicatie dot */}
        {dl === "detail" && kleur && (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-white ${KLEUR_DOT[kleur]}`}
          />
        )}
      </div>
    </div>
  );
}
