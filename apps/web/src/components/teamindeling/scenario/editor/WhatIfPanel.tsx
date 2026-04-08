"use client";

import { useEffect, useState, useCallback } from "react";
import type { WhatIfSummary } from "@/lib/teamindeling/whatif/types";
import { getWhatIfs } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-actions";

interface WhatIfPanelProps {
  werkindelingId: string;
  onNieuw: () => void;
  activeWhatIfId?: string | null;
  onActiveer?: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  TOEGEPAST: "Toegepast",
  VERWORPEN: "Verworpen",
};

const STATUS_KLASSEN: Record<string, string> = {
  OPEN: "bg-orange-100 text-orange-700",
  TOEGEPAST: "bg-green-100 text-green-700",
  VERWORPEN: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]",
};

export default function WhatIfPanel({
  werkindelingId,
  onNieuw,
  activeWhatIfId,
  onActiveer,
}: WhatIfPanelProps) {
  const [items, setItems] = useState<WhatIfSummary[]>([]);
  const [laden, setLaden] = useState(true);

  const laadWhatIfs = useCallback(async () => {
    setLaden(true);
    try {
      const data = await getWhatIfs(werkindelingId);
      setItems(data);
    } finally {
      setLaden(false);
    }
  }, [werkindelingId]);

  useEffect(() => {
    void laadWhatIfs();
  }, [laadWhatIfs]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {laden ? (
          <p className="py-4 text-center text-xs text-[var(--text-secondary)]">Laden...</p>
        ) : items.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-[var(--text-secondary)]">Nog geen what-ifs voor dit scenario.</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Gebruik de knop hieronder om een what-if te starten.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((wi) => {
              const isActief = wi.id === activeWhatIfId;
              const kanActiveren = wi.status === "OPEN" && onActiveer;
              return (
                <li
                  key={wi.id}
                  className={`rounded-lg border transition-all ${
                    isActief
                      ? "border-orange-400"
                      : "border-[var(--border-default)] hover:border-orange-200"
                  }`}
                  style={
                    isActief
                      ? { background: "rgba(255,107,0,0.12)", borderLeftWidth: 3, borderLeftColor: "#f97316" }
                      : {}
                  }
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1 text-xs leading-snug font-medium text-[var(--text-primary)]">
                        {wi.vraag}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_KLASSEN[wi.status] ?? "bg-[var(--surface-sunken)] text-[var(--text-secondary)]"}`}
                      >
                        {STATUS_LABELS[wi.status] ?? wi.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                      <span>
                        {wi.aantalTeams} team{wi.aantalTeams !== 1 ? "s" : ""}
                      </span>
                      {wi.isStale && (
                        <span className="rounded bg-amber-50 px-1 text-amber-600">verouderd</span>
                      )}
                    </div>
                    {kanActiveren && (
                      <button
                        onClick={() => onActiveer(wi.id)}
                        className={`mt-2 w-full rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                          isActief
                            ? "bg-orange-500 text-white"
                            : "text-[var(--text-secondary)] hover:text-orange-700"
                        }`}
                        style={!isActief ? { background: "var(--surface-sunken)" } : undefined}
                      >
                        {isActief ? "Actief" : "Activeer"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border-default)] p-3">
        <button
          onClick={onNieuw}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe what-if
        </button>
      </div>
    </div>
  );
}
