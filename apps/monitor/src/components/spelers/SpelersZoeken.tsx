"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SpelerOverzicht } from "@/lib/queries/spelers";
import { formatNaam } from "@/lib/utils/format";

interface Props {
  spelers: SpelerOverzicht[];
}

export function SpelersZoeken({ spelers }: Props) {
  const [zoek, setZoek] = useState("");
  const [geslachtFilter, setGeslachtFilter] = useState<"alle" | "M" | "V">("alle");
  const [statusFilter, setStatusFilter] = useState<"alle" | "actief" | "inactief">("actief");

  const params = useSearchParams();
  const qs = params.get("seizoen") ? `?seizoen=${params.get("seizoen")}` : "";

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
      if (statusFilter === "actief" && s.afmelddatum) return false;
      if (statusFilter === "inactief" && !s.afmelddatum) return false;
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
          onChange={(e) => setStatusFilter(e.target.value as "alle" | "actief" | "inactief")}
          aria-label="Filter op status"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="actief">Actief</option>
          <option value="inactief">Uitgeschreven</option>
          <option value="alle">Alle</option>
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
              <th className="px-4 py-3 text-right">Seizoenen</th>
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
                      href={`/spelers/${s.relCode}${qs}`}
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
                    {s.hudigTeam || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{s.seizoenenActief}</td>
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
