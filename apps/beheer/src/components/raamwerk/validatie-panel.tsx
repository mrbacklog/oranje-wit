"use client";

import type { ValidatieResultaat } from "@/lib/raamwerk/validatie";
import { CircleIcon, CheckFilledIcon } from "@/components/icons";

interface ValidatiePanelProps {
  resultaten: ValidatieResultaat[];
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; iconColor: string }> = {
  ERROR: { bg: "bg-red-900/20", text: "text-red-400", iconColor: "text-red-500" },
  WARNING: { bg: "bg-yellow-900/20", text: "text-yellow-400", iconColor: "text-yellow-500" },
  INFO: { bg: "bg-blue-900/20", text: "text-blue-400", iconColor: "text-blue-500" },
};

export function ValidatiePanel({ resultaten }: ValidatiePanelProps) {
  if (resultaten.length === 0) {
    return (
      <div className="rounded-lg border border-green-800/30 bg-green-900/20 p-4">
        <div className="flex items-center gap-2">
          <CheckFilledIcon className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-400">Geen problemen gevonden</span>
        </div>
      </div>
    );
  }

  const errors = resultaten.filter((r) => r.level === "ERROR");
  const warnings = resultaten.filter((r) => r.level === "WARNING");
  const infos = resultaten.filter((r) => r.level === "INFO");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm">
        {errors.length > 0 && (
          <span className="rounded-full bg-red-900/30 px-2.5 py-0.5 font-medium text-red-400">
            {errors.length} fouten
          </span>
        )}
        {warnings.length > 0 && (
          <span className="rounded-full bg-yellow-900/30 px-2.5 py-0.5 font-medium text-yellow-400">
            {warnings.length} waarschuwingen
          </span>
        )}
        {infos.length > 0 && (
          <span className="rounded-full bg-blue-900/30 px-2.5 py-0.5 font-medium text-blue-400">
            {infos.length} info
          </span>
        )}
      </div>

      <div className="space-y-1">
        {resultaten.map((r, i) => {
          const style = LEVEL_STYLES[r.level];
          return (
            <div
              key={`${r.regel}-${r.band}-${r.item}-${i}`}
              className={`rounded-md ${style.bg} px-3 py-2`}
            >
              <div className="flex items-start gap-2">
                <CircleIcon className={`mt-0.5 h-2.5 w-2.5 shrink-0 ${style.iconColor}`} />
                <div>
                  <span className={`text-sm ${style.text}`}>{r.bericht}</span>
                  <span className="text-text-muted ml-2 text-xs">{r.regel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
