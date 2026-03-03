"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SpelerOverzicht, SpelerStatus } from "@/lib/queries/spelers";
import { formatNaam } from "@/lib/utils/format";

interface Props {
  spelers: SpelerOverzicht[];
}

const STATUS_LABELS: Record<SpelerStatus | "alle", string> = {
  in_team: "In team",
  reserve: "Algemeen Reserves",
  historisch: "Ooit actief",
  alle: "Alle",
};

function formatMaandJaar(d: Date | string) {
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function AfmeldBadge({ afmelddatum }: { afmelddatum: Date | string }) {
  const datum = new Date(afmelddatum);
  const isVerleden = datum < new Date();

  return (
    <span
      className={`ml-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-tight font-medium ${
        isVerleden ? "text-signal-rood bg-red-50" : "text-ow-oranje bg-orange-50"
      }`}
      title={isVerleden ? "Niet meer lid" : "Afmelding gepland"}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {isVerleden ? (
          // Kruis-icoon
          <path
            d="M3 3l6 6M9 3l-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ) : (
          // Klok-icoon
          <>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M6 3.5V6l2 1.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {formatMaandJaar(datum)}
    </span>
  );
}

export function SpelersZoeken({ spelers }: Props) {
  const [zoek, setZoek] = useState("");
  const [geslachtFilter, setGeslachtFilter] = useState<"alle" | "M" | "V">("alle");
  const [statusFilter, setStatusFilter] = useState<SpelerStatus | "alle">("in_team");

  const gefilterd = useMemo(() => {
    return spelers.filter((s) => {
      // Zoek op naam
      if (zoek) {
        const volledigeNaam = `${s.roepnaam} ${s.tussenvoegsel || ""} ${s.achternaam}`
          .toLowerCase()
          .replace(/\s+/g, " ");
        if (!volledigeNaam.includes(zoek.toLowerCase())) return false;
      }
      // Geslacht
      if (geslachtFilter !== "alle" && s.geslacht !== geslachtFilter) return false;
      // Status
      if (statusFilter !== "alle" && s.status !== statusFilter) return false;
      return true;
    });
  }, [spelers, zoek, geslachtFilter, statusFilter]);

  const mannen = gefilterd.filter((s) => s.geslacht === "M").length;
  const vrouwen = gefilterd.filter((s) => s.geslacht === "V").length;

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Zoek op naam..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          aria-label="Zoek speler"
          className="focus:border-ow-oranje focus:ring-ow-oranje rounded-lg border border-gray-200 px-4 py-2 text-sm focus:ring-1 focus:outline-none"
        />
        <select
          value={geslachtFilter}
          onChange={(e) => setGeslachtFilter(e.target.value as "alle" | "M" | "V")}
          aria-label="Filter op geslacht"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="alle">&#9794;/&#9792; alle</option>
          <option value="M">&#9794; Heren</option>
          <option value="V">&#9792; Dames</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SpelerStatus | "alle")}
          aria-label="Filter op status"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="in_team">{STATUS_LABELS.in_team}</option>
          <option value="reserve">{STATUS_LABELS.reserve}</option>
          <option value="historisch">{STATUS_LABELS.historisch}</option>
          <option value="alle">{STATUS_LABELS.alle}</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">
          {gefilterd.length} spelers (<span className="text-blue-500">&#9794; {mannen}</span> /{" "}
          <span className="text-pink-500">&#9792; {vrouwen}</span>)
        </span>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
              <th className="px-4 py-3">Naam</th>
              <th className="px-4 py-3">Geb.jaar</th>
              <th className="px-4 py-3">&#9794;/&#9792;</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-right">Lid sinds</th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.map((s) => {
              const naam = formatNaam(s);
              return (
                <tr
                  key={s.relCode}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/spelers/${s.relCode}`}
                      className="hover:text-ow-oranje flex items-center gap-3 font-medium text-gray-900"
                    >
                      {s.heeftFoto ? (
                        <img
                          src={`/api/foto/${s.relCode}`}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
                          {s.roepnaam[0]}
                          {s.achternaam[0]}
                        </span>
                      )}
                      {naam}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{s.geboortejaar || "-"}</td>
                  <td
                    className={`px-4 py-2.5 ${s.geslacht === "M" ? "text-blue-500" : "text-pink-500"}`}
                  >
                    {s.geslacht === "M" ? "\u2642" : "\u2640"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    <span className="flex flex-col">
                      {s.huidigTeam || <span className="text-gray-400">-</span>}
                      {s.selectie && s.huidigTeam !== s.selectie && (
                        <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          {s.selectie}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-600">
                    <span className="inline-flex items-center justify-end gap-1">
                      {s.lidSinds ? formatMaandJaar(s.lidSinds) : "-"}
                      {s.afmelddatum && <AfmeldBadge afmelddatum={s.afmelddatum} />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {gefilterd.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Geen spelers gevonden</p>
        )}
      </div>
    </>
  );
}
