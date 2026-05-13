"use client";

// apps/ti-studio-v2/src/components/memo/MemoKaart.tsx

import type { MemoKaartData } from "./types";
import { PRIO_LABEL, PRIO_KLEUR } from "@/lib/constants/memo-constants";

interface MemoKaartProps {
  memo: MemoKaartData;
  isDone: boolean;
  onKlik: (id: string) => void;
}

function entiteitKlasse(entiteit: string | null): string {
  if (!entiteit || entiteit === "BLAUWDRUK") return "ENTITEIT_TC";
  return entiteit;
}

export function MemoKaart({ memo, isDone, onKlik }: MemoKaartProps) {
  const prioKleur = PRIO_KLEUR[memo.prioriteit] ?? "#666";
  const prioLabel = PRIO_LABEL[memo.prioriteit] ?? "?";
  const entType = entiteitKlasse(memo.entiteit);
  const heeftEntiteit =
    memo.entiteit !== null && memo.entiteit !== "BLAUWDRUK" && memo.entiteitLabel;
  const titelTekst = memo.titel ?? memo.beschrijving.slice(0, 60);

  return (
    <div
      className="memo-kaart"
      style={
        {
          "--prio-kleur": prioKleur,
          opacity: isDone ? 0.6 : 1,
        } as React.CSSProperties
      }
      onClick={() => onKlik(memo.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onKlik(memo.id);
      }}
      aria-label={`Memo: ${titelTekst}`}
    >
      <div className="mk-prio" style={{ background: prioKleur }} title={memo.prioriteit}>
        {prioLabel}
      </div>
      <div className="mk-body">
        <div className="mk-titel">{titelTekst}</div>
        {memo.beschrijving && memo.titel && (
          <div className="mk-beschrijving">{memo.beschrijving}</div>
        )}
        <div className="mk-meta">
          <span className={`mk-entiteit ${entType}`} data-entiteit-type={memo.entiteit ?? "TC"}>
            {memo.entiteit ?? "TC"}
          </span>
          {heeftEntiteit && <span className="mk-naam">{memo.entiteitLabel}</span>}
        </div>
      </div>
    </div>
  );
}
