"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SpelerOverzicht, SpelerStatus } from "@/lib/monitor/queries/spelers";
import { formatNaam } from "@/lib/monitor/utils/format";

interface Props {
  spelers: SpelerOverzicht[];
}

const STATUS_LABELS: Record<SpelerStatus | "alle", string> = {
  in_team: "In team",
  reserve: "Reserves",
  historisch: "Ooit actief",
  alle: "Alle",
};

function SpelerAvatar({ speler }: { speler: SpelerOverzicht }) {
  if (speler.heeftFoto) {
    return (
      <img
        src={`/api/monitor/foto/${speler.relCode}`}
        alt=""
        className="h-20 w-20 rounded-xl object-cover"
      />
    );
  }
  return (
    <span className="bg-surface-tertiary text-text-muted flex h-20 w-20 items-center justify-center rounded-xl text-xl font-semibold">
      {speler.roepnaam[0]}
      {speler.achternaam[0]}
    </span>
  );
}

export function SpelersZoeken({ spelers }: Props) {
  const [zoek, setZoek] = useState("");
  const [geslachtFilter, setGeslachtFilter] = useState<"alle" | "M" | "V">("alle");
  const [statusFilter, setStatusFilter] = useState<SpelerStatus | "alle">("in_team");

  const gefilterd = useMemo(() => {
    return spelers.filter((s) => {
      if (zoek) {
        const volledigeNaam = `${s.roepnaam} ${s.tussenvoegsel || ""} ${s.achternaam}`
          .toLowerCase()
          .replace(/\s+/g, " ");
        if (!volledigeNaam.includes(zoek.toLowerCase())) return false;
      }
      if (geslachtFilter !== "alle" && s.geslacht !== geslachtFilter) return false;
      if (statusFilter !== "alle" && s.status !== statusFilter) return false;
      return true;
    });
  }, [spelers, zoek, geslachtFilter, statusFilter]);

  return (
    <>
      {/* Zoekbalk */}
      <input
        type="text"
        placeholder="Zoek op naam..."
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        aria-label="Zoek speler"
        autoFocus
        className="focus:border-ow-oranje focus:ring-ow-oranje border-border-default bg-surface-card text-text-primary w-full rounded-xl border px-4 py-3 text-base focus:ring-1 focus:outline-none"
      />

      {/* Filters + teller */}
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-2">
        <select
          value={geslachtFilter}
          onChange={(e) => setGeslachtFilter(e.target.value as "alle" | "M" | "V")}
          aria-label="Filter op geslacht"
          className="border-border-default bg-surface-card text-text-primary rounded-lg border px-3 py-1.5 text-sm"
        >
          <option value="alle">Heren &amp; Dames</option>
          <option value="M">Heren</option>
          <option value="V">Dames</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SpelerStatus | "alle")}
          aria-label="Filter op status"
          className="border-border-default bg-surface-card text-text-primary rounded-lg border px-3 py-1.5 text-sm"
        >
          {(Object.keys(STATUS_LABELS) as (SpelerStatus | "alle")[]).map((k) => (
            <option key={k} value={k}>
              {STATUS_LABELS[k]}
            </option>
          ))}
        </select>
        <span className="text-text-muted ml-auto text-xs">{gefilterd.length} spelers</span>
      </div>

      {/* Fotogrid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {gefilterd.map((s) => (
          <Link
            key={s.relCode}
            href={`/monitor/spelers/${s.relCode}`}
            className="group bg-surface-card hover:bg-surface-hover flex flex-col items-center rounded-xl p-3 transition-colors"
          >
            <SpelerAvatar speler={s} />
            <span className="group-hover:text-ow-oranje text-text-primary mt-2 w-full truncate text-center text-sm leading-tight font-semibold transition-colors">
              {s.roepnaam}
            </span>
            <span className="text-text-primary w-full truncate text-center text-sm leading-tight font-semibold">
              {s.tussenvoegsel ? `${s.tussenvoegsel} ${s.achternaam}` : s.achternaam}
            </span>
            <span className="text-text-muted mt-0.5 w-full truncate text-center text-xs leading-tight">
              {s.huidigTeam ?? "–"}
            </span>
          </Link>
        ))}
      </div>

      {gefilterd.length === 0 && (
        <p className="text-text-muted mt-8 text-center text-sm">Geen spelers gevonden</p>
      )}
    </>
  );
}
