"use client";

import { useCallback, useRef } from "react";

interface SmileyScoreProps {
  /** Label boven de smileys */
  label: string;
  /** Huidige waarde (null = niets geselecteerd) */
  value: number | null;
  /** Change handler */
  onChange: (value: number) => void;
  /** Optionele vraagtekst onder het label */
  vraagTekst?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Optioneel: id voor form-koppeling */
  id?: string;
}

interface SmileyOptie {
  value: 1 | 2 | 3;
  label: string;
  selectedBg: string;
  selectedRing: string;
  selectedIconColor: string;
}

const SMILEY_OPTIES: SmileyOptie[] = [
  {
    value: 1,
    label: "Kan beter",
    selectedBg: "bg-red-100",
    selectedRing: "ring-red-400",
    selectedIconColor: "text-red-500",
  },
  {
    value: 2,
    label: "Gaat wel",
    selectedBg: "bg-yellow-100",
    selectedRing: "ring-yellow-400",
    selectedIconColor: "text-yellow-500",
  },
  {
    value: 3,
    label: "Goed!",
    selectedBg: "bg-green-100",
    selectedRing: "ring-green-400",
    selectedIconColor: "text-green-500",
  },
];

export function SmileyScore({
  label,
  value,
  onChange,
  vraagTekst,
  disabled = false,
  id,
}: SmileyScoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, huidigeIndex: number) => {
      let nieuweIndex = huidigeIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nieuweIndex = Math.min(huidigeIndex + 1, SMILEY_OPTIES.length - 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nieuweIndex = Math.max(huidigeIndex - 1, 0);
      }

      if (nieuweIndex !== huidigeIndex) {
        onChange(SMILEY_OPTIES[nieuweIndex].value);
        // Focus het nieuwe element
        const knoppen = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        knoppen?.[nieuweIndex]?.focus();
      }
    },
    [onChange]
  );

  return (
    <div id={id} className="flex flex-col items-center">
      <span className="text-text-primary text-sm font-medium">{label}</span>
      {vraagTekst && <span className="text-text-secondary mt-0.5 text-xs">{vraagTekst}</span>}

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
        className="mt-3 flex justify-center gap-4"
      >
        {SMILEY_OPTIES.map((optie, index) => {
          const isSelected = value === optie.value;
          const tabIndex = value != null ? (isSelected ? 0 : -1) : index === 0 ? 0 : -1;

          return (
            <div key={optie.value} className="flex flex-col items-center">
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={optie.label}
                tabIndex={disabled ? -1 : tabIndex}
                disabled={disabled}
                onClick={() => onChange(optie.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`focus-visible:ring-ow-oranje flex h-14 min-h-[56px] w-14 min-w-[56px] items-center justify-center rounded-2xl border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-16 sm:w-16 ${
                  disabled
                    ? "cursor-not-allowed border-border-subtle bg-surface-dark opacity-50"
                    : isSelected
                      ? `${optie.selectedBg} ${optie.selectedRing} scale-110 animate-[smiley-bounce_400ms_cubic-bezier(0.34,1.56,0.64,1)] ring-2`
                      : "border-border-subtle bg-surface-dark text-text-muted hover:scale-105 hover:border-gray-300 hover:bg-gray-100 active:scale-95"
                } `}
              >
                <SmileyIcon
                  type={optie.value}
                  selected={isSelected}
                  color={isSelected ? optie.selectedIconColor : "text-text-muted"}
                />
              </button>
              <span className="text-text-muted mt-1 hidden text-[10px] sm:block">
                {optie.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** SVG smileys voor consistente cross-platform weergave */
function SmileyIcon({
  type,
  selected,
  color,
}: {
  type: 1 | 2 | 3;
  selected: boolean;
  color: string;
}) {
  const size = "h-8 w-8";

  if (type === 1) {
    // Droevig
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${size} ${color}`}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={selected ? 2.5 : 2} />
        <circle cx="9" cy="10" r="1.2" fill="currentColor" />
        <circle cx="15" cy="10" r="1.2" fill="currentColor" />
        <path
          d="M8 16c1-1.5 3-2.5 4-2.5s3 1 4 2.5"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  if (type === 2) {
    // Neutraal
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${size} ${color}`}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={selected ? 2.5 : 2} />
        <circle cx="9" cy="10" r="1.2" fill="currentColor" />
        <circle cx="15" cy="10" r="1.2" fill="currentColor" />
        <line
          x1="8.5"
          y1="15"
          x2="15.5"
          y2="15"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Blij
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${size} ${color}`}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={selected ? 2.5 : 2} />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" />
      <path
        d="M8 14c1 1.5 3 2.5 4 2.5s3-1 4-2.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
