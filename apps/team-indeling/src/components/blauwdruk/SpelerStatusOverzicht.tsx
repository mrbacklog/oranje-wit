"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import type { SpelerStatus, Geslacht } from "@oranje-wit/database";

import { updateSpelerStatus } from "@/app/blauwdruk/actions";
import SpelerStatusBadge from "./SpelerStatusBadge";

interface HuidigInfo {
  team?: string | null;
  categorie?: string | null;
  kleur?: string | null;
}

interface SpelerRij {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: Geslacht;
  status: SpelerStatus;
  huidig: HuidigInfo | null;
}

interface SpelerStatusOverzichtProps {
  spelers: SpelerRij[];
}

const STATUS_OPTIES: { waarde: SpelerStatus; label: string }[] = [
  { waarde: "BESCHIKBAAR", label: "Beschikbaar" },
  { waarde: "TWIJFELT", label: "Twijfelt" },
  { waarde: "GAAT_STOPPEN", label: "Gaat stoppen" },
  { waarde: "NIEUW", label: "Nieuw" },
];

type StatusFilter = SpelerStatus | "ALLE";
type KleurFilter = string | "ALLE";

export default function SpelerStatusOverzicht({
  spelers: initieleSpelers,
}: SpelerStatusOverzichtProps) {
  const [spelers, setSpelers] = useState<SpelerRij[]>(initieleSpelers);
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALLE");
  const [kleurFilter, setKleurFilter] = useState<KleurFilter>("ALLE");
  const [isPending, startTransition] = useTransition();

  // Unieke kleuren/categorieen uit de data
  const uniekeKleuren = useMemo(() => {
    const kleuren = new Set<string>();
    for (const s of spelers) {
      const kleur = s.huidig?.kleur;
      if (kleur) kleuren.add(kleur);
    }
    return Array.from(kleuren).sort();
  }, [spelers]);

  // Samenvatting
  const samenvatting = useMemo(() => {
    const telling: Record<SpelerStatus, number> = {
      BESCHIKBAAR: 0,
      TWIJFELT: 0,
      GAAT_STOPPEN: 0,
      NIEUW: 0,
    };
    for (const s of spelers) {
      telling[s.status]++;
    }
    return telling;
  }, [spelers]);

  // Gefilterde spelers
  const gefilterd = useMemo(() => {
    let resultaat = spelers;

    if (zoekterm) {
      const term = zoekterm.toLowerCase();
      resultaat = resultaat.filter(
        (s) =>
          s.roepnaam.toLowerCase().includes(term) ||
          s.achternaam.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "ALLE") {
      resultaat = resultaat.filter((s) => s.status === statusFilter);
    }

    if (kleurFilter !== "ALLE") {
      resultaat = resultaat.filter((s) => s.huidig?.kleur === kleurFilter);
    }

    return resultaat;
  }, [spelers, zoekterm, statusFilter, kleurFilter]);

  const wijzigStatus = useCallback(
    (spelerId: string, nieuweStatus: SpelerStatus) => {
      // Optimistic update
      setSpelers((prev) =>
        prev.map((s) =>
          s.id === spelerId ? { ...s, status: nieuweStatus } : s
        )
      );

      startTransition(async () => {
        await updateSpelerStatus(spelerId, nieuweStatus);
      });
    },
    []
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Samenvatting */}
      <div className="flex flex-wrap gap-4 mb-4">
        <SamenvattingBadge
          kleur="bg-green-100 text-green-800"
          label="Beschikbaar"
          aantal={samenvatting.BESCHIKBAAR}
        />
        <SamenvattingBadge
          kleur="bg-orange-100 text-orange-800"
          label="Twijfelt"
          aantal={samenvatting.TWIJFELT}
        />
        <SamenvattingBadge
          kleur="bg-red-100 text-red-800"
          label="Gaat stoppen"
          aantal={samenvatting.GAAT_STOPPEN}
        />
        <SamenvattingBadge
          kleur="bg-blue-100 text-blue-800"
          label="Nieuw"
          aantal={samenvatting.NIEUW}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoek op naam..."
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        >
          <option value="ALLE">Alle statussen</option>
          {STATUS_OPTIES.map((o) => (
            <option key={o.waarde} value={o.waarde}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={kleurFilter}
          onChange={(e) => setKleurFilter(e.target.value as KleurFilter)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        >
          <option value="ALLE">Alle kleuren</option>
          {uniekeKleuren.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 pr-3 font-medium">Naam</th>
              <th className="pb-2 pr-3 font-medium">Geb.jaar</th>
              <th className="pb-2 pr-3 font-medium">M/V</th>
              <th className="pb-2 pr-3 font-medium">Huidig team</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 font-medium">Wijzig</th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.map((speler) => (
              <tr
                key={speler.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-2 pr-3 text-gray-800">
                  {speler.roepnaam} {speler.achternaam}
                </td>
                <td className="py-2 pr-3 text-gray-600">
                  {speler.geboortejaar}
                </td>
                <td className="py-2 pr-3 text-gray-600">{speler.geslacht}</td>
                <td className="py-2 pr-3 text-gray-600">
                  {speler.huidig?.team ?? "—"}
                </td>
                <td className="py-2 pr-3">
                  <SpelerStatusBadge status={speler.status} />
                </td>
                <td className="py-2">
                  <select
                    value={speler.status}
                    onChange={(e) =>
                      wijzigStatus(speler.id, e.target.value as SpelerStatus)
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                  >
                    {STATUS_OPTIES.map((o) => (
                      <option key={o.waarde} value={o.waarde}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {gefilterd.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center text-gray-400 italic"
                >
                  Geen spelers gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isPending && (
        <p className="mt-2 text-xs text-gray-400">Opslaan...</p>
      )}

      <p className="mt-3 text-xs text-gray-400">
        {gefilterd.length} van {spelers.length} spelers getoond
      </p>
    </div>
  );
}

function SamenvattingBadge({
  kleur,
  label,
  aantal,
}: {
  kleur: string;
  label: string;
  aantal: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${kleur}`}
    >
      {label}: {aantal}
    </span>
  );
}
