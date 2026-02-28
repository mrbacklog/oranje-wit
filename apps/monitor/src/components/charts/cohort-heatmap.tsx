"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CohortData {
  geboortejaar: number;
  geslacht: string;
  seizoenen: Record<string, { actief: number }>;
}

interface CohortHeatmapProps {
  data: CohortData[];
  seizoenen: string[];
}

type Filter = "Alles" | "M" | "V";

function cellColor(value: number, max: number): string {
  if (value === 0) return "#f9fafb";
  const intensity = Math.min(value / Math.max(max * 0.6, 1), 1);
  // Groen schaal
  const r = Math.round(255 - intensity * 203);
  const g = Math.round(255 - intensity * 72);
  const b = Math.round(255 - intensity * 119);
  return `rgb(${r}, ${g}, ${b})`;
}

export function CohortHeatmap({ data, seizoenen }: CohortHeatmapProps) {
  const [filter, setFilter] = useState<Filter>("Alles");
  const router = useRouter();

  // Aggregeer per geboortejaar op basis van filter
  const geaggregeerd = new Map<
    number,
    Record<string, number>
  >();

  for (const row of data) {
    if (filter !== "Alles" && row.geslacht !== filter) continue;
    if (!geaggregeerd.has(row.geboortejaar)) {
      geaggregeerd.set(row.geboortejaar, {});
    }
    const szMap = geaggregeerd.get(row.geboortejaar)!;
    for (const [sz, d] of Object.entries(row.seizoenen)) {
      szMap[sz] = (szMap[sz] || 0) + d.actief;
    }
  }

  const geboortejaren = [...geaggregeerd.keys()].sort((a, b) => b - a);

  // Filter seizoenen: alleen seizoenen met minstens 1 actief lid
  const activeSeizoenen = seizoenen.filter((sz) => {
    for (const szMap of geaggregeerd.values()) {
      if (szMap[sz] > 0) return true;
    }
    return false;
  });

  // Max waarde voor kleurschaal
  let maxVal = 0;
  for (const szMap of geaggregeerd.values()) {
    for (const v of Object.values(szMap)) {
      if (v > maxVal) maxVal = v;
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["Alles", "M", "V"] as Filter[]).map((f) => (
          <button
            key={f}
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
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold">
                Jaar
              </th>
              {activeSeizoenen.map((sz) => (
                <th key={sz} className="px-2 py-1 text-center font-semibold whitespace-nowrap">
                  {sz.slice(2, 4)}/{sz.slice(7, 9)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {geboortejaren.map((jaar) => {
              const szMap = geaggregeerd.get(jaar)!;
              return (
                <tr key={jaar}>
                  <td
                    className="sticky left-0 z-10 cursor-pointer bg-white px-2 py-1 font-medium hover:text-ow-oranje hover:underline"
                    onClick={() => router.push(`/cohorten/${jaar}`)}
                  >
                    {jaar}
                  </td>
                  {activeSeizoenen.map((sz) => {
                    const val = szMap[sz] || 0;
                    return (
                      <td
                        key={sz}
                        className="px-2 py-1 text-center"
                        style={{
                          backgroundColor: cellColor(val, maxVal),
                          color: val > maxVal * 0.4 ? "#fff" : "#333",
                        }}
                      >
                        {val || ""}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
