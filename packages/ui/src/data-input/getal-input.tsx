"use client";

import { useCallback } from "react";

interface GetalInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  label?: string;
  placeholder?: string;
  compact?: boolean;
}

export function GetalInput({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  placeholder = "—",
  compact,
}: GetalInputProps) {
  const handleDecrement = useCallback(() => {
    const next = (value ?? 0) - 1;
    if (next >= min) onChange(next);
  }, [value, min, onChange]);

  const handleIncrement = useCallback(() => {
    const next = (value ?? 0) + 1;
    if (next <= max) onChange(next);
  }, [value, max, onChange]);

  return (
    <div>
      {label && (
        <label
          className="mb-1 block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value !== null && value <= min}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors disabled:opacity-30"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          −
        </button>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
            if (v === null || (!isNaN(v) && v >= min && v <= max)) onChange(v);
          }}
          placeholder={placeholder}
          className={`${compact ? "w-12" : "w-16"} [appearance:textfield] rounded-lg border px-2 py-1.5 text-center text-lg font-bold tabular-nums focus:ring-2 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-strong)",
            color: "var(--text-primary)",
          }}
          min={min}
          max={max}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value !== null && value >= max}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors disabled:opacity-30"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
