import type { GezienStatus } from "@oranje-wit/database";

interface GezienStatusBadgeProps {
  status: GezienStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  GezienStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  ONGEZIEN: {
    label: "Ongezien",
    bg: "rgba(107, 114, 128, 0.15)",
    text: "#9ca3af",
    border: "rgba(107, 114, 128, 0.3)",
    dot: "#6b7280",
  },
  GROEN: {
    label: "Beschikbaar",
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#22c55e",
    border: "rgba(34, 197, 94, 0.3)",
    dot: "#22c55e",
  },
  GEEL: {
    label: "Onzeker",
    bg: "rgba(234, 179, 8, 0.15)",
    text: "#eab308",
    border: "rgba(234, 179, 8, 0.3)",
    dot: "#eab308",
  },
  ORANJE: {
    label: "Stop-signaal",
    bg: "rgba(249, 115, 22, 0.15)",
    text: "#f97316",
    border: "rgba(249, 115, 22, 0.3)",
    dot: "#f97316",
  },
  ROOD: {
    label: "Stopt",
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
    dot: "#ef4444",
  },
};

export function GezienStatusBadge({ status, compact }: GezienStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (compact) {
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: config.dot }}
        title={config.label}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dot }}
      />
      {config.label}
    </span>
  );
}

export function GezienStatusDot({ status }: { status: GezienStatus }) {
  return <GezienStatusBadge status={status} compact />;
}
