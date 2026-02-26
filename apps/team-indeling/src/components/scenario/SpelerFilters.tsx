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
        onChange={(e) => onZoektermChange(e.target.value)}
        placeholder="Zoek speler..."
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      />

      {/* Filterradio's */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map(({ waarde, label }) => (
          <label
            key={waarde}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
              filter === waarde
                ? "bg-orange-50 border-orange-400 text-orange-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
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
