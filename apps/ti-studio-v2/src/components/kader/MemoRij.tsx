// apps/ti-studio-v2/src/components/kader/MemoRij.tsx

import type { KaderMemoItem } from "./types";

interface MemoRijProps {
  memo: KaderMemoItem;
  onClick?: () => void;
}

const PRIORITEIT_KLEUR: Record<string, string> = {
  BLOCKER: "#ef4444",
  HOOG: "#f97316",
  MIDDEL: "#eab308",
  LAAG: "#8b5cf6",
  INFO: "#8b5cf6",
};

const PRIORITEIT_LABEL: Record<string, string> = {
  BLOCKER: "!",
  HOOG: "H",
  MIDDEL: "M",
  LAAG: "L",
  INFO: "i",
};

function statusDotKleur(status: string): string {
  if (status === "OPEN") return "#eab308";
  if (status === "IN_BESPREKING") return "#60a5fa";
  if (status === "RISICO") return "#f59e0b";
  return "#6b7280";
}

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export function MemoRij({ memo, onClick }: MemoRijProps) {
  const tekst = memo.titel ?? memo.beschrijving;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid var(--border-light)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 100ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "";
      }}
    >
      {/* Status dot */}
      <span
        aria-label={`Status: ${memo.status}`}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          flexShrink: 0,
          background: statusDotKleur(memo.status),
        }}
      />

      {/* Prioriteit badge */}
      <span
        aria-label={`Prioriteit: ${memo.prioriteit}`}
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 7,
          fontWeight: 900,
          color: "#fff",
          background: PRIORITEIT_KLEUR[memo.prioriteit] ?? "#6b7280",
        }}
      >
        {PRIORITEIT_LABEL[memo.prioriteit] ?? "?"}
      </span>

      {/* Tekst */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {tekst}
      </span>

      {/* Doelgroep chip */}
      {memo.doelgroep && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "1px 5px",
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            background: "rgba(255,255,255,.04)",
            border: "1px solid var(--border-light)",
            flexShrink: 0,
          }}
        >
          {memo.doelgroep}
        </span>
      )}

      {/* Datum */}
      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {formatDatum(memo.createdAt)}
      </span>
    </div>
  );
}
