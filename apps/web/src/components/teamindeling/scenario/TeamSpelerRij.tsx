"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TeamSpelerData, SpelerData, HuidigData, DetailLevel } from "./types";
import { kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import AfmeldBadge from "./AfmeldBadge";
import RankingBadge from "./RankingBadge";

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
  TWIJFELT: "bg-amber-900/20",
  GAAT_STOPPEN: "bg-red-900/20",
};

interface TeamSpelerRijProps {
  teamSpeler: TeamSpelerData;
  teamId: string;
  detailLevel?: DetailLevel;
  isPinned?: boolean;
  showRanking?: boolean;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function TeamSpelerRij({
  teamSpeler,
  teamId,
  detailLevel,
  isPinned,
  showRanking,
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
    : (STATUS_BORDER[status] ?? "border-l-[var(--border-default)]");
  const bgWarning = heeftAfmelding ? "bg-red-900/20" : (STATUS_BG[status] ?? "");
  const isWarning = heeftAfmelding || status === "TWIJFELT" || status === "GAAT_STOPPEN";

  return (
    <div
      ref={setNodeRef}
      data-speler-id={speler.id}
      style={style}
      className={`flex items-center gap-1 rounded-r border-l-2 px-1 ${borderLeft} ${
        isDragging ? "bg-surface-raised opacity-40" : bgWarning || "hover:bg-surface-raised"
      } py-px`}
    >
      {/* Drag handle — SVG grip dots */}
      {dl === "detail" && (
        <span
          {...listeners}
          {...attributes}
          data-dnd-draggable
          className="text-text-muted hover:text-text-secondary shrink-0 cursor-grab touch-none"
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
          className={`text-text-primary truncate text-[10px] leading-none font-medium ${
            onSpelerClick ? "cursor-pointer hover:text-orange-600" : ""
          } ${isWarning ? "italic" : ""}`}
          onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
        >
          {speler.roepnaam} {speler.achternaam}
          {heeftAfmelding && <AfmeldBadge afmelddatum={speler.afmelddatum!} />}
        </span>

        {/* Regel 2: vorig team — halve regelhoogte */}
        {dl === "detail" && (
          <div className="text-text-secondary text-[8px] leading-none">
            <span className="truncate">{vorigTeam ?? "\u2014"}</span>
          </div>
        )}
      </div>

      {/* Rechter indicatoren */}
      <div className="flex shrink-0 items-center gap-0.5">
        {/* Ranking badge */}
        {showRanking && leeftijd < 20 && <RankingBadge rating={speler.rating} size="compact" />}

        {/* Leeftijd */}
        {dl === "detail" && (
          <span className="text-text-secondary shrink-0 text-[8px] tabular-nums">
            {leeftijd.toFixed(2)}
          </span>
        )}

        {/* Pin indicator */}
        {isPinned && (
          <svg
            className="h-2 w-2 text-purple-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-label="Gepind"
          >
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
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
            className={`h-1.5 w-1.5 shrink-0 rounded-full ring-1 ${KLEUR_DOT[kleur]}`}
            style={{ outline: "1px solid var(--surface-card)" }}
          />
        )}
      </div>
    </div>
  );
}
