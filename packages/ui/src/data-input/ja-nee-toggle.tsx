"use client";

import { Toggle } from "../primitives/toggle";

interface JaNeeToggleProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  label?: string;
}

export function JaNeeToggle({ value, onChange, label }: JaNeeToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {label && (
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span
          className="text-xs"
          style={{ color: value === false ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          Nee
        </span>
        <Toggle checked={value === true} onChange={onChange} />
        <span
          className="text-xs"
          style={{ color: value === true ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          Ja
        </span>
      </div>
    </div>
  );
}
