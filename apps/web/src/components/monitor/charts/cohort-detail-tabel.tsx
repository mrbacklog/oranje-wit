"use client";

import { useState } from "react";
import Link from "next/link";
import type { CohortLid } from "@/lib/monitor/queries/cohorten";
import { formatNaam } from "@/lib/monitor/utils/format";

type Filter = "Alles" | "M" | "V";

const STATUS_KLEUREN: Record<string, string> = {
  behouden: "text-signal-groen",
  nieuw: "text-ow-oranje",
  herinschrijver: "text-ow-oranje",
  uitgestroomd: "text-signal-rood",
  niet_spelend_geworden: "text-signal-geel",
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
                  : "bg-surface-sunken text-text-secondary hover:bg-surface-raised"
              }`}
            >
              {f === "Alles" ? "Alles" : f === "M" ? "\u2642 Jongens" : "\u2640 Meisjes"}
            </button>
          ))}
          <span className="text-text-muted ml-2 self-center text-sm">{gefilterd.length} leden</span>
        </div>
        <div className="text-text-muted flex gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="bg-signal-groen inline-block h-3 w-3 rounded-sm" /> behouden
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: "var(--color-info-400)" }}
            />{" "}
            nieuw
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: "var(--knkv-paars-400)" }}
            />{" "}
            herinschrijver
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="bg-signal-rood inline-block h-3 w-3 rounded-sm" /> uitgestroomd
          </span>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-surface-card overflow-x-auto rounded-xl shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="border-border-light border-b">
              <th className="bg-surface-card sticky left-0 z-10 px-3 py-2 text-left font-semibold">
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
                <tr key={lid.relCode} className="border-border-light border-b">
                  <td className="bg-surface-card sticky left-0 z-10 px-3 py-1.5 font-medium whitespace-nowrap">
                    <Link
                      href={`/monitor/spelers/${lid.relCode}`}
                      className="hover:text-ow-oranje text-text-primary hover:underline"
                    >
                      {naam}
                    </Link>
                    <span
                      className="ml-1.5"
                      style={{
                        color:
                          lid.geslacht === "M" ? "var(--color-info-500)" : "var(--knkv-rood-400)",
                      }}
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
                      ? STATUS_KLEUREN[data.status] || "bg-surface-sunken text-text-secondary"
                      : "bg-surface-sunken text-text-secondary";
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
            <tr className="border-border-default bg-surface-sunken border-t-2 font-semibold">
              <td className="bg-surface-sunken sticky left-0 z-10 px-3 py-2">Totaal</td>
              {actieveSeizoenen.map((sz) => {
                const s = samenvatting[sz];
                if (!s) return <td key={sz} className="px-2 py-2 text-center" />;
                const filtered = filter === "Alles" ? s.actief : filter === "M" ? s.M : s.V;
                return (
                  <td key={sz} className="text-text-secondary px-2 py-2 text-center">
                    {filtered}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>

        {gefilterd.length === 0 && (
          <p className="text-text-muted px-4 py-8 text-center text-sm">Geen leden gevonden</p>
        )}
      </div>
    </div>
  );
}
