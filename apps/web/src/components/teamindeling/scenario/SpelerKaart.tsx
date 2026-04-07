"use client";

import { useDraggable } from "@dnd-kit/core";
import type { SpelerData, HuidigData } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import SpelerAvatar from "@/components/teamindeling/ui/SpelerAvatar";
import AfmeldBadge from "./AfmeldBadge";

interface SpelerKaartProps {
  speler: SpelerData;
  isPinned?: boolean;
  onClick: () => void;
}

/** Geeft de HEX kleur voor de linker-border-band op basis van KNKV leeftijdskleur */
function kleurBorderKleur(kleur: string | null): string {
  const map: Record<string, string> = {
    PAARS: "#a855f7",
    BLAUW: "#3b82f6",
    GROEN: "#22c55e",
    GEEL: "#eab308",
    ORANJE: "#f97316",
    ROOD: "#ef4444",
  };
  return map[kleur ?? ""] ?? "var(--border-default)";
}

export default function SpelerKaart({ speler, isPinned, onClick }: SpelerKaartProps) {
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
      data-speler-id={speler.id}
      data-dnd-draggable
      style={{
        ...style,
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderLeft: `3px solid ${kleurBorderKleur(kleur)}`,
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Alleen openen bij klik, niet bij drag
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`hover:border-ow-oranje flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 transition-all hover:shadow-[0_0_8px_rgba(255,107,0,0.15)] ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Avatar */}
      <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="sm" />

      {/* Twee regels: naam bovenaan, metadata onderaan */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Regel 1: status dot + naam + afmeldbadge */}
        <div className="flex items-center gap-1">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${STATUS_KLEUREN[speler.status]}`}
            title={speler.status}
          />
          <span className="text-text-primary truncate text-sm">
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

        {/* Regel 2: leeftijd, geslacht, vorig team */}
        <div className="flex items-center gap-1.5 pl-3">
          <span
            className="inline-flex items-center gap-0.5"
            title={`Geboortejaar ${speler.geboortejaar}`}
          >
            {kleur && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleur]}`} />}
            <span className="text-text-secondary text-[11px]">{leeftijd.toFixed(2)}</span>
          </span>
          <span
            className="text-text-secondary text-[11px]"
            title={speler.geslacht === "M" ? "Man" : "Vrouw"}
          >
            {speler.geslacht === "M" ? "\u2642" : "\u2640"}
          </span>
          {vorigTeam && (
            <span
              className="text-text-secondary max-w-[60px] truncate text-[10px]"
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
