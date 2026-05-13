"use client";

import type { MemoBadge } from "@/components/personen/types";

const MEMO_CONFIG: Record<MemoBadge, { label: string; stijl: React.CSSProperties }> = {
  geen: {
    label: "",
    stijl: { color: "var(--text-muted)" },
  },
  open: {
    label: "Open",
    stijl: {
      color: "var(--memo-open)",
      background: "rgba(253,224,71,.1)",
      border: "1px solid rgba(253,224,71,.3)",
    },
  },
  bespreking: {
    label: "Bespreking",
    stijl: {
      color: "var(--memo-bespreking)",
      background: "rgba(250,204,21,.12)",
      border: "1px solid rgba(250,204,21,.4)",
    },
  },
  risico: {
    label: "Risico",
    stijl: {
      color: "#c29a5c",
      background: "rgba(194,154,92,.1)",
      border: "1px solid rgba(225,29,72,.4)",
    },
  },
  opgelost: {
    label: "Opgelost",
    stijl: {
      color: "#8a7a5c",
      background: "rgba(68,64,60,.4)",
      border: "1px solid rgba(255,255,255,.08)",
    },
  },
};

interface MemoCelProps {
  badge: MemoBadge;
}

export function MemoCel({ badge }: MemoCelProps) {
  const config = MEMO_CONFIG[badge];

  if (badge === "geen") {
    return (
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
        }}
      >
        —
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 4,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...config.stijl,
      }}
    >
      {config.label}
    </span>
  );
}
