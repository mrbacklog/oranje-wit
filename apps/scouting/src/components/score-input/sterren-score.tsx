"use client";

import { useCallback, useRef, useState } from "react";

interface SterrenScoreProps {
  /** Label boven de sterren */
  label: string;
  /** Huidige waarde 1-5 (null = niets geselecteerd) */
  value: number | null;
  /** Change handler */
  onChange: (value: number) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Alleen-lezen (voor gemiddelden) */
  readOnly?: boolean;
  /** Optioneel: id voor form-koppeling */
  id?: string;
}

const STERREN_TOTAAL = 5;

export function SterrenScore({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  id,
}: SterrenScoreProps) {
  const [hoverWaarde, setHoverWaarde] = useState<number | null>(null);
  const [animeerSter, setAnimeerSter] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (ster: number) => {
      if (disabled || readOnly) return;
      onChange(ster);
      setAnimeerSter(ster);
      // Reset animatie na 300ms
      setTimeout(() => setAnimeerSter(null), 300);
    },
    [disabled, readOnly, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || readOnly) return;

      const huidige = value ?? 0;
      let nieuw = huidige;

      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        nieuw = Math.min(huidige + 1, STERREN_TOTAAL);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        nieuw = Math.max(huidige - 1, 1);
      }

      if (nieuw !== huidige && nieuw >= 1) {
        handleSelect(nieuw);
      }
    },
    [disabled, readOnly, value, handleSelect]
  );

  const displayWaarde = hoverWaarde ?? value;

  return (
    <div id={id} className="flex flex-col">
      <span className="text-text-primary text-sm font-medium">{label}</span>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={label}
        aria-valuenow={value ?? undefined}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-disabled={disabled || undefined}
        className="mt-2 flex gap-1"
        onMouseLeave={() => !disabled && !readOnly && setHoverWaarde(null)}
      >
        {Array.from({ length: STERREN_TOTAAL }, (_, i) => i + 1).map((ster) => {
          const isGevuld = displayWaarde != null && ster <= displayWaarde;
          const isActief = value != null && ster <= value;
          const isHover = hoverWaarde != null && ster <= hoverWaarde;
          const isExactHover = hoverWaarde === ster;
          const moetAnimeren = animeerSter != null && ster <= animeerSter;
          const tabIndex = value != null ? (ster === value ? 0 : -1) : ster === 1 ? 0 : -1;

          return (
            <button
              key={ster}
              type="button"
              role="radio"
              aria-checked={value === ster}
              aria-label={`${ster} van 5 sterren`}
              tabIndex={disabled ? -1 : tabIndex}
              disabled={disabled}
              onClick={() => handleSelect(ster)}
              onMouseEnter={() => !disabled && !readOnly && setHoverWaarde(ster)}
              onKeyDown={handleKeyDown}
              className={`focus-visible:ring-ow-oranje h-10 w-10 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                disabled
                  ? "cursor-not-allowed text-gray-300 opacity-40"
                  : readOnly
                    ? "cursor-default"
                    : "cursor-pointer"
              } ${isExactHover && !disabled ? "scale-125" : isHover && !disabled ? "scale-105" : ""} ${
                moetAnimeren ? "animate-[star-fill_300ms_ease-out]" : ""
              } `}
              style={
                moetAnimeren
                  ? { animationDelay: `${(ster - 1) * 50}ms`, animationFillMode: "both" }
                  : undefined
              }
            >
              <SterIcon gevuld={isGevuld || false} actief={isActief || false} />
            </button>
          );
        })}
      </div>

      {value != null && (
        <span className="text-text-muted sr-only mt-1 text-xs sm:not-sr-only">{value} van 5</span>
      )}
    </div>
  );
}

function SterIcon({ gevuld, actief }: { gevuld: boolean; actief: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={gevuld ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        className={
          actief
            ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
            : gevuld
              ? "text-yellow-300"
              : "text-gray-300"
        }
      />
    </svg>
  );
}
