"use client";

import type { SpelerData } from "../types";

/**
 * Vaste iconen-kolom per spelerrij in de teamkaart.
 *
 * Kolom-layout (altijd 48px breed, nooit layout shift):
 *   pos 1 — Pin-icoon (altijd zichtbaar)
 *   pos 2 — Gezien-stip (altijd zichtbaar)
 *   pos 3 — Warnings (max 3, daarna +N)
 */

// --- Warning types ---
export type WarningType = "retentie" | "geen-evaluatie" | "opmerking";

export interface SpelerWarning {
  type: WarningType;
  label: string;
}

/** Bereken de warnings voor een speler op basis van zijn data */
export function berekenWarnings(speler: SpelerData): SpelerWarning[] {
  const warnings: SpelerWarning[] = [];

  if (speler.status === "GAAT_STOPPEN") {
    warnings.push({ type: "retentie", label: "Retentierisico: speler overweegt te stoppen" });
  }

  if (speler.rating === null && speler.ratingBerekend === null) {
    warnings.push({ type: "geen-evaluatie", label: "Geen evaluatie beschikbaar" });
  }

  if (speler.notitie) {
    warnings.push({ type: "opmerking", label: `Opmerking: ${speler.notitie}` });
  }

  return warnings;
}

// --- Gezien-status ---
export type GezienStatus = "onbekend" | "gezien" | "beoordeeld";

// --- Props ---
interface SpelerRijIconenProps {
  speler: SpelerData;
  isPinned?: boolean;
  gezienStatus?: GezienStatus;
}

// --- Warning iconen ---
function WarningIcon({ type, label }: SpelerWarning) {
  if (type === "retentie") {
    return (
      <span
        title={label}
        aria-label={label}
        className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500/20 text-[7px] leading-none font-bold text-red-400"
      >
        !
      </span>
    );
  }

  if (type === "geen-evaluatie") {
    return (
      <span
        title={label}
        aria-label={label}
        className="flex h-3 w-3 items-center justify-center text-[8px] leading-none text-amber-400"
      >
        △
      </span>
    );
  }

  // opmerking
  return (
    <span title={label} aria-label={label} className="h-1.5 w-1.5 rounded-full bg-orange-400" />
  );
}

// --- Pin icoon ---
function PinIcoon({ pinned }: { pinned: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-2.5 w-2.5 shrink-0 ${pinned ? "text-orange-400" : "text-gray-500"}`}
      fill={pinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={pinned ? 0 : 1.5}
      aria-label={pinned ? "Gepind" : "Niet gepind"}
    >
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

// --- Gezien-stip ---
function GezienStip({ status }: { status: GezienStatus }) {
  if (status === "onbekend") {
    return (
      <span
        title="Nog niet gezien"
        aria-label="Nog niet gezien"
        className="flex h-3 w-3 items-center justify-center text-[7px] leading-none font-bold text-gray-500"
      >
        ?
      </span>
    );
  }

  if (status === "gezien") {
    return <span title="Gezien" aria-label="Gezien" className="h-2 w-2 rounded-full bg-sky-400" />;
  }

  // beoordeeld — stip met vinkje
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-2.5 w-2.5 text-emerald-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-label="Beoordeeld"
      title="Beoordeeld"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

// --- Hoofd-component ---
export default function SpelerRijIconen({
  speler,
  isPinned = false,
  gezienStatus = "onbekend",
}: SpelerRijIconenProps) {
  const warnings = berekenWarnings(speler);
  const MAX_ICONS = 3;
  const zichtbaar = warnings.slice(0, MAX_ICONS);
  const extra = warnings.length - MAX_ICONS;

  return (
    // Vaste breedte 48px — layout shift is onmogelijk
    <div
      className="flex w-12 shrink-0 items-center justify-end gap-0.5"
      style={{ minWidth: "3rem", maxWidth: "3rem" }}
    >
      {/* Pos 1: Pin */}
      <PinIcoon pinned={isPinned} />

      {/* Pos 2: Gezien */}
      <GezienStip status={gezienStatus} />

      {/* Pos 3: Warnings */}
      <div className="flex items-center gap-px">
        {zichtbaar.map((w, i) => (
          <WarningIcon key={`${w.type}-${i}`} {...w} />
        ))}
        {extra > 0 && (
          <span
            className="text-[7px] leading-none font-bold text-gray-400"
            title={`${extra} meer waarschuwingen`}
          >
            +{extra}
          </span>
        )}
      </div>
    </div>
  );
}
