"use client";

import { useState } from "react";
import Link from "next/link";
import type { CohortLid } from "@/lib/queries/cohorten";
import { formatNaam } from "@/lib/utils/format";

type Filter = "Alles" | "M" | "V";

const STATUS_KLEUREN: Record<string, string> = {
  behouden: "bg-green-100 text-green-800",
  nieuw: "bg-blue-100 text-blue-800",
  herinschrijver: "bg-purple-100 text-purple-800",
  uitgestroomd: "bg-red-100 text-red-800",
  niet_spelend_geworden: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABEL: Record<string, string> = {
  behouden: "●",
  nieuw: "★",
  herinschrijver: "↩",
  uitgestroomd: "✕",
  niet_spelend_geworden: "⊘",
};

interface CohortDetailTabelProps {
  leden: CohortLid[];
  seizoenen: string[];
  samenvatting: Record<string, { actief: number; M: number; V: number }>;
}

export function CohortDetailTabel({ leden, seizoenen, samenvatting }: CohortDetailTabelProps) {
  const [filter, setFilter] = useState<Filter>("Alles");

  // Filter seizoenen met data
  const actieveSeizoenen = seizoenen.filter((sz) => samenvatting[sz]);

  // Filter leden op geslacht
  const gefilterd = filter === "Alles" ? leden : leden.filter((l) => l.geslacht === filter);

  return (
    <div>
      {/* Filter + legenda */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["Alles", "M", "V"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                filter === f
                  ? "bg-ow-oranje text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "Alles" ? "Alles" : f === "M" ? "\u2642 Jongens" : "\u2640 Meisjes"}
            </button>
          ))}
          <span className="ml-2 self-center text-sm text-gray-500">{gefilterd.length} leden</span>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-green-100" /> behouden
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-100" /> nieuw
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-purple-100" /> herinschrijver
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-100" /> uitgestroomd
          </span>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold">
                Naam
              </th>
              {actieveSeizoenen.map((sz) => (
                <th key={sz} className="px-2 py-2 text-center font-semibold whitespace-nowrap">
                  {sz.slice(2, 4)}/{sz.slice(7, 9)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gefilterd.map((lid) => {
              const seizoenMap = new Map(lid.seizoenen.map((s) => [s.seizoen, s]));
              const naam = formatNaam(lid);

              return (
                <tr key={lid.relCode} className="border-b border-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium whitespace-nowrap">
                    <Link
                      href={`/spelers/${lid.relCode}`}
                      className="hover:text-ow-oranje text-gray-900 hover:underline"
                    >
                      {naam}
                    </Link>
                    <span
                      className={`ml-1.5 ${lid.geslacht === "M" ? "text-blue-500" : "text-pink-500"}`}
                    >
                      {lid.geslacht === "M" ? "♂" : "♀"}
                    </span>
                  </td>
                  {actieveSeizoenen.map((sz) => {
                    const data = seizoenMap.get(sz);
                    if (!data || !data.team) {
                      // Niet actief dit seizoen
                      return <td key={sz} className="px-2 py-1.5 text-center" />;
                    }
                    const statusClass = data.status
                      ? STATUS_KLEUREN[data.status] || "bg-gray-50 text-gray-700"
                      : "bg-gray-50 text-gray-700";
                    const statusIcon = data.status ? STATUS_LABEL[data.status] || "" : "";

                    return (
                      <td key={sz} className="px-1 py-1 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass}`}
                          title={`${data.team}${data.status ? ` (${data.status})` : ""}`}
                        >
                          {statusIcon} {data.team}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* Samenvatting */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2">Totaal</td>
              {actieveSeizoenen.map((sz) => {
                const s = samenvatting[sz];
                if (!s) return <td key={sz} className="px-2 py-2 text-center" />;
                const filtered = filter === "Alles" ? s.actief : filter === "M" ? s.M : s.V;
                return (
                  <td key={sz} className="px-2 py-2 text-center text-gray-700">
                    {filtered}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>

        {gefilterd.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Geen leden gevonden</p>
        )}
      </div>
    </div>
  );
}
