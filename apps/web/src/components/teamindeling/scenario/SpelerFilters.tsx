"use client";

import type { SpelerFilter } from "./types";

interface SpelerFiltersProps {
  zoekterm: string;
  onZoektermChange: (term: string) => void;
  filter: SpelerFilter;
  onFilterChange: (filter: SpelerFilter) => void;
}

const FILTERS: { waarde: SpelerFilter; label: string }[] = [
  { waarde: "zonder_team", label: "Zonder team" },
  { waarde: "passend", label: "Passend" },
  { waarde: "ingedeeld", label: "Al ingedeeld" },
  { waarde: "alle", label: "Alle" },
];

export default function SpelerFilters({
  zoekterm,
  onZoektermChange,
  filter,
  onFilterChange,
}: SpelerFiltersProps) {
  return (
    <div className="space-y-2">
      {/* Zoekbalk */}
      <input
        type="text"
        value={zoekterm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onZoektermChange(e.target.value)}
        placeholder="Zoek speler..."
        className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        style={{
          background: "var(--surface-sunken)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
        }}
      />

      {/* Filterradio's */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map(({ waarde, label }) => (
          <label
            key={waarde}
            className="inline-flex cursor-pointer items-center rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors"
            style={
              filter === waarde
                ? {
                    borderColor: "var(--ow-oranje-500)",
                    background: "#FF6B0022",
                    color: "var(--ow-oranje-500)",
                  }
                : {
                    borderColor: "var(--border-default)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                  }
            }
          >
            <input
              type="radio"
              name="speler-filter"
              value={waarde}
              checked={filter === waarde}
              onChange={() => onFilterChange(waarde)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
