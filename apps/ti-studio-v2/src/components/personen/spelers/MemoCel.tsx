"use client";

import type { MemoBadge } from "@/components/personen/types";

const MEMO_CONFIG: Record<MemoBadge, { icoon: string; label: string; stijl: React.CSSProperties }> =
  {
    geen: {
      icoon: "",
      label: "—",
      stijl: { color: "var(--text-muted)", paddingLeft: 0 },
    },
    open: {
      icoon: "●",
      label: "Open",
      stijl: {
        color: "var(--memo-open)",
        background: "rgba(253,224,71,.1)",
        border: "1px solid rgba(253,224,71,.3)",
      },
    },
    bespreking: {
      icoon: "◐",
      label: "Bespreking",
      stijl: {
        color: "var(--memo-bespreking)",
        background: "rgba(250,204,21,.12)",
        border: "1px solid rgba(250,204,21,.4)",
      },
    },
    risico: {
      icoon: "⚠",
      label: "Risico",
      stijl: {
        color: "#c29a5c",
        background: "rgba(194,154,92,.1)",
        border: "1px solid rgba(225,29,72,.4)",
      },
    },
    opgelost: {
      icoon: "✓",
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

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 4,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...config.stijl,
      }}
    >
      {config.icoon && (
        <span
          style={{ width: 14, height: 14, fontSize: 13, flexShrink: 0, textAlign: "center" }}
          aria-hidden="true"
        >
          {config.icoon}
        </span>
      )}
      {config.label}
    </span>
  );
}
