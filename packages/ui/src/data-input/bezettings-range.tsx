"use client";

import { GetalInput } from "./getal-input";

interface BezettingsRangeValue {
  ideaalM: number | null;
  ideaalV: number | null;
  afwijking: number | null;
}

interface BezettingsRangeProps {
  value: BezettingsRangeValue;
  onChange: (value: BezettingsRangeValue) => void;
  label?: string;
}

export function BezettingsRange({ value, onChange, label }: BezettingsRangeProps) {
  return (
    <div>
      {label && (
        <label
          className="mb-2 block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <div className="flex items-end gap-4">
        <GetalInput
          value={value.ideaalM}
          onChange={(v) => onChange({ ...value, ideaalM: v })}
          label="Ideaal M"
          min={0}
          max={20}
          compact
        />
        <GetalInput
          value={value.ideaalV}
          onChange={(v) => onChange({ ...value, ideaalV: v })}
          label="Ideaal V"
          min={0}
          max={20}
          compact
        />
        <GetalInput
          value={value.afwijking}
          onChange={(v) => onChange({ ...value, afwijking: v })}
          label="Afwijking ±"
          min={0}
          max={10}
          compact
        />
      </div>
    </div>
  );
}

export type { BezettingsRangeValue };
