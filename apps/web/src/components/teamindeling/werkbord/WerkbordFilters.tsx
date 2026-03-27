"use client";

import type { WerkitemPrioriteit, WerkitemType, Besluitniveau, Doelgroep, Entiteit } from "./types";

export interface WerkbordFilterState {
  prioriteit: WerkitemPrioriteit | "";
  type: WerkitemType | "";
  besluitniveau: Besluitniveau | "";
  doelgroep: Doelgroep | "";
  entiteit: Entiteit | "";
}

interface WerkbordFiltersProps {
  filters: WerkbordFilterState;
  onChange: (filters: WerkbordFilterState) => void;
}

const PRIORITEIT_OPTIES: { value: WerkitemPrioriteit; label: string }[] = [
  { value: "BLOCKER", label: "Blocker" },
  { value: "HOOG", label: "Hoog" },
  { value: "MIDDEL", label: "Middel" },
  { value: "LAAG", label: "Laag" },
  { value: "INFO", label: "Info" },
];

const TYPE_OPTIES: { value: WerkitemType; label: string }[] = [
  { value: "BESLUIT", label: "Besluit" },
  { value: "STRATEGISCH", label: "Strategisch" },
  { value: "DATA", label: "Data" },
  { value: "REGEL", label: "Regel" },
  { value: "TRAINER", label: "Trainer" },
  { value: "SPELER", label: "Speler" },
];

const BESLUITNIVEAU_OPTIES: { value: Besluitniveau; label: string }[] = [
  { value: "BESTUUR", label: "Bestuur" },
  { value: "TC", label: "TC" },
  { value: "DOELGROEP", label: "Doelgroep" },
];

const DOELGROEP_OPTIES: { value: Doelgroep; label: string }[] = [
  { value: "KWEEKVIJVER", label: "Kweekvijver" },
  { value: "ONTWIKKELHART", label: "Ontwikkelhart" },
  { value: "TOP", label: "Top" },
  { value: "WEDSTRIJDSPORT", label: "Wedstrijdsport" },
  { value: "KORFBALPLEZIER", label: "Korfbalplezier" },
];

const ENTITEIT_OPTIES: { value: Entiteit; label: string }[] = [
  { value: "BELEID", label: "Beleid" },
  { value: "SELECTIE", label: "Selectie" },
  { value: "TEAM", label: "Team" },
  { value: "STAF", label: "Staf" },
  { value: "SPELER", label: "Speler" },
];

export default function WerkbordFilters({ filters, onChange }: WerkbordFiltersProps) {
  const heeftFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input max-w-[140px]"
        value={filters.besluitniveau}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...filters,
            besluitniveau: e.target.value as WerkbordFilterState["besluitniveau"],
          })
        }
      >
        <option value="">Besluitniveau</option>
        {BESLUITNIVEAU_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {(filters.besluitniveau === "DOELGROEP" || filters.besluitniveau === "TC") && (
        <select
          className="input max-w-[140px]"
          value={filters.doelgroep}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange({ ...filters, doelgroep: e.target.value as WerkbordFilterState["doelgroep"] })
          }
        >
          <option value="">Doelgroep</option>
          {DOELGROEP_OPTIES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      <select
        className="input max-w-[130px]"
        value={filters.prioriteit}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange({ ...filters, prioriteit: e.target.value as WerkbordFilterState["prioriteit"] })
        }
      >
        <option value="">Prioriteit</option>
        {PRIORITEIT_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="input max-w-[130px]"
        value={filters.entiteit}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange({ ...filters, entiteit: e.target.value as WerkbordFilterState["entiteit"] })
        }
      >
        <option value="">Entiteit</option>
        {ENTITEIT_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="input max-w-[130px]"
        value={filters.type}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange({ ...filters, type: e.target.value as WerkbordFilterState["type"] })
        }
      >
        <option value="">Type</option>
        {TYPE_OPTIES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {heeftFilters && (
        <button
          className="btn-ghost btn-sm text-gray-500"
          onClick={() =>
            onChange({ prioriteit: "", type: "", besluitniveau: "", doelgroep: "", entiteit: "" })
          }
        >
          Reset
        </button>
      )}
    </div>
  );
}
