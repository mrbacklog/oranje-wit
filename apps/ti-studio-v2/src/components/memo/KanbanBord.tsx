"use client";

// apps/ti-studio-v2/src/components/memo/KanbanBord.tsx

import { useState } from "react";
import type { MemoKaartData, MemoEntiteitType } from "./types";
import { KANBAN_KOLOMMEN, PRIO_VOLGORDE } from "@/lib/constants/memo-constants";
import type { MemoPrioriteit } from "@/lib/constants/memo-constants";
import { KanbanLane } from "./KanbanLane";
import { MemoDrawer } from "./MemoDrawer";

type CatFilter = "Alles" | MemoEntiteitType | "TC";

const CAT_FILTER_OPTIES: { label: string; value: CatFilter }[] = [
  { label: "Alles", value: "Alles" },
  { label: "Spelers", value: "SPELER" },
  { label: "Staf", value: "STAF" },
  { label: "Teams", value: "TEAM" },
  { label: "TC", value: "TC" },
];

interface KanbanBordProps {
  memos: MemoKaartData[];
  kadersId: string;
}

export function KanbanBord({ memos }: KanbanBordProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [catFilter, setCatFilter] = useState<CatFilter>("Alles");
  const [gekozenMemoId, setGekozenMemoId] = useState<string | null>(null);

  // Sorteer op prioriteit, dan op updatedAt desc
  const gesorteerd = [...memos].sort((a, b) => {
    const prio =
      PRIO_VOLGORDE[a.prioriteit as MemoPrioriteit] - PRIO_VOLGORDE[b.prioriteit as MemoPrioriteit];
    if (prio !== 0) return prio;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="kanban-page">
      {/* Header */}
      <div className="kanban-header">
        <div className="kh-links">
          {/* Zoekbalk */}
          <div className="memo-zoek">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="memo-zoek-input"
              type="search"
              placeholder="Zoek memo's…"
              autoComplete="off"
              value={zoekterm}
              onChange={(e) => setZoekterm(e.target.value)}
              aria-label="Memo's doorzoeken"
            />
          </div>

          {/* Categorie-filter chips */}
          <div className="kanban-filters" role="group" aria-label="Filter op categorie">
            {CAT_FILTER_OPTIES.map((opt) => (
              <button
                key={opt.value}
                className={`kanban-filter${catFilter === opt.value ? "active" : ""}`}
                onClick={() => setCatFilter(opt.value)}
                aria-pressed={catFilter === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nieuwe memo — Backlog */}
        <button
          className="btn-nieuwe-memo"
          disabled
          title="Aanmaken wordt binnenkort toegevoegd"
          aria-label="Nieuwe memo aanmaken (nog niet beschikbaar)"
        >
          + Nieuwe memo
        </button>
      </div>

      {/* Kanban board + drawer wrapper */}
      <div className="kanban-area">
        <div className="kanban-board">
          {KANBAN_KOLOMMEN.map((kolom) => (
            <KanbanLane
              key={kolom.status}
              status={kolom.status}
              label={kolom.label}
              dotVariant={kolom.dotVariant}
              memos={gesorteerd.filter((m) => m.status === kolom.status)}
              isDone={kolom.isDone}
              zoekterm={zoekterm}
              catFilter={catFilter}
              onKaartKlik={setGekozenMemoId}
            />
          ))}
        </div>

        <MemoDrawer memoId={gekozenMemoId} onSluiten={() => setGekozenMemoId(null)} />
      </div>
    </div>
  );
}
