"use client";

import { useCallback, useRef, useState } from "react";

interface SnelkeuzeOptie {
  label: string;
  value: number;
}

interface SliderScoreProps {
  /** Label boven de slider */
  label: string;
  /** Huidige waarde 0-99 (null = niets geselecteerd) */
  value: number | null;
  /** Change handler */
  onChange: (value: number) => void;
  /** Preset-waarden als snelkeuze */
  snelkeuze?: SnelkeuzeOptie[];
  /** Disabled state */
  disabled?: boolean;
  /** Optioneel: id voor form-koppeling */
  id?: string;
}

const DEFAULT_SNELKEUZE: SnelkeuzeOptie[] = [
  { label: "Zwak", value: 25 },
  { label: "Gem", value: 50 },
  { label: "Goed", value: 70 },
  { label: "Top", value: 90 },
];

export function SliderScore({
  label,
  value,
  onChange,
  snelkeuze = DEFAULT_SNELKEUZE,
  disabled = false,
  id,
}: SliderScoreProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = value ?? 50;
  const percentage = (displayValue / 99) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  const handleSnelkeuze = useCallback(
    (waarde: number) => {
      if (disabled) return;
      onChange(waarde);
    },
    [disabled, onChange]
  );

  /** Bepaal de kleur van het waarde-label op basis van de score */
  const kleurClass = disabled
    ? "text-gray-400"
    : displayValue < 30
      ? "text-red-500"
      : displayValue < 55
        ? "text-yellow-500"
        : displayValue < 75
          ? "text-green-500"
          : "text-green-600";

  return (
    <div id={id} className="flex flex-col">
      <span className="text-text-primary text-sm font-medium">{label}</span>

      <div className="relative mt-4 w-full px-1">
        {/* Waarde-bubble boven de slider */}
        <div
          className={`absolute -top-7 -translate-x-1/2 rounded-md border bg-white px-2 py-0.5 shadow-sm transition-all duration-150 ${isDragging ? "border-ow-oranje scale-110 font-extrabold shadow-md" : "border-gray-200"} `}
          style={{ left: `${percentage}%` }}
          aria-live="polite"
        >
          <span className={`text-sm font-bold ${kleurClass}`}>{displayValue}</span>
        </div>

        {/* Slider track achtergrond */}
        <div className="relative h-2 w-full rounded-full bg-gray-200">
          {/* Gevulde track met gradient */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Native range input */}
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={99}
          value={displayValue}
          onChange={handleChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onBlur={() => setIsDragging(false)}
          disabled={disabled}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={99}
          aria-valuenow={displayValue}
          aria-valuetext={`${displayValue} van 99`}
          aria-disabled={disabled || undefined}
          className={`focus-visible:ring-ow-oranje [&::-webkit-slider-thumb]:border-ow-oranje [&::-moz-range-thumb]:border-ow-oranje absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent outline-none focus-visible:ring-2 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 ${isDragging ? "[&::-webkit-slider-thumb]:ring-ow-oranje/20 [&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-4" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""} `}
        />

        {/* Min/max labels */}
        <div className="mt-2 flex justify-between">
          <span className="text-text-muted text-[10px]">0</span>
          <span className="text-text-muted text-[10px]">99</span>
        </div>
      </div>

      {/* Snelkeuze chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {snelkeuze.map((optie) => {
          const isActief = value != null && Math.abs(value - optie.value) <= 2;

          return (
            <button
              key={optie.value}
              type="button"
              role="button"
              aria-label={`Stel in op ${optie.label} (${optie.value})`}
              onClick={() => handleSnelkeuze(optie.value)}
              disabled={disabled}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 ${
                disabled
                  ? "cursor-not-allowed border-gray-200 bg-white text-gray-400 opacity-50"
                  : isActief
                    ? "border-ow-oranje bg-ow-oranje-light/30 text-ow-oranje font-semibold"
                    : "hover:border-ow-oranje hover:text-ow-oranje border-gray-200 bg-white text-gray-700"
              } `}
            >
              {optie.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
