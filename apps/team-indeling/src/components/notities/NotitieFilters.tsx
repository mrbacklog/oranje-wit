"use client";

import type { NotitieStatus, NotitiePrioriteit, NotitieCategorie } from "@oranje-wit/database";

interface Filters {
  status: NotitieStatus | "";
  prioriteit: NotitiePrioriteit | "";
  categorie: NotitieCategorie | "";
}

interface NotitieFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const STATUS_OPTIES: { value: NotitieStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_BESPREKING", label: "In bespreking" },
  { value: "OPGELOST", label: "Opgelost" },
  { value: "GEACCEPTEERD_RISICO", label: "Geaccepteerd risico" },
  { value: "GEARCHIVEERD", label: "Gearchiveerd" },
];

const PRIORITEIT_OPTIES: { value: NotitiePrioriteit; label: string }[] = [
  { value: "BLOCKER", label: "Blocker" },
  { value: "HOOG", label: "Hoog" },
  { value: "MIDDEL", label: "Middel" },
  { value: "LAAG", label: "Laag" },
  { value: "INFO", label: "Info" },
];

const CATEGORIE_OPTIES: { value: NotitieCategorie; label: string }[] = [
  { value: "STRATEGISCH", label: "Strategisch" },
  { value: "DATA", label: "Data" },
  { value: "REGEL", label: "Regel" },
  { value: "TRAINER", label: "Trainer" },
  { value: "SPELER", label: "Speler" },
];

export default function NotitieFilters({ filters, onChange }: NotitieFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="input max-w-[160px]"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as Filters["status"] })}
      >
        <option value="">Alle statussen</option>
        {STATUS_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="input max-w-[160px]"
        value={filters.prioriteit}
        onChange={(e) =>
          onChange({
            ...filters,
            prioriteit: e.target.value as Filters["prioriteit"],
          })
        }
      >
        <option value="">Alle prioriteiten</option>
        {PRIORITEIT_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="input max-w-[160px]"
        value={filters.categorie}
        onChange={(e) =>
          onChange({
            ...filters,
            categorie: e.target.value as Filters["categorie"],
          })
        }
      >
        <option value="">Alle categorieën</option>
        {CATEGORIE_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
