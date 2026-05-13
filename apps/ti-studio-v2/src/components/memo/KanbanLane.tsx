"use client";

// apps/ti-studio-v2/src/components/memo/KanbanLane.tsx

import type { MemoKaartData, MemoStatus, MemoEntiteitType } from "./types";
import { MemoKaart } from "./MemoKaart";

interface KanbanLaneProps {
  status: MemoStatus;
  label: string;
  dotVariant: "open" | "bespreking" | "risico" | "opgelost" | "archief";
  memos: MemoKaartData[];
  isDone: boolean;
  zoekterm: string;
  catFilter: MemoEntiteitType | "TC" | "Alles";
  onKaartKlik: (id: string) => void;
}

function isZichtbaar(
  memo: MemoKaartData,
  zoekterm: string,
  catFilter: MemoEntiteitType | "TC" | "Alles"
): boolean {
  if (catFilter !== "Alles") {
    if (catFilter === "TC") {
      // TC = entiteit null of BLAUWDRUK
      if (memo.entiteit !== null && memo.entiteit !== "BLAUWDRUK") return false;
    } else {
      if (memo.entiteit !== catFilter) return false;
    }
  }
  if (!zoekterm) return true;
  const q = zoekterm.toLowerCase();
  const tekst = ((memo.titel ?? "") + " " + memo.beschrijving).toLowerCase();
  return tekst.includes(q);
}

export function KanbanLane({
  status,
  label,
  dotVariant,
  memos,
  isDone,
  zoekterm,
  catFilter,
  onKaartKlik,
}: KanbanLaneProps) {
  const zichtbareMemos = memos.filter((m) => isZichtbaar(m, zoekterm, catFilter));

  const laneKlasse = ["kanban-lane", isDone ? "done" : ""].filter(Boolean).join(" ");

  return (
    <div className={laneKlasse} data-status={status}>
      <div className="lane-header">
        <span className={`lane-dot ${dotVariant}`} />
        <span className="lane-title">{label}</span>
        <span className="lane-count">{zichtbareMemos.length}</span>
      </div>
      <div className="lane-body ow-scroll">
        {zichtbareMemos.length === 0 ? (
          <div className="lane-leeg">Geen memo&apos;s</div>
        ) : (
          zichtbareMemos.map((memo) => (
            <MemoKaart key={memo.id} memo={memo} isDone={isDone} onKlik={onKaartKlik} />
          ))
        )}
      </div>
    </div>
  );
}
