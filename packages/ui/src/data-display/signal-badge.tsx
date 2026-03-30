interface SignalBadgeProps {
  ernst: "kritiek" | "aandacht" | "op_koers" | "opkoers" | string;
  children: React.ReactNode;
}

const ernstStyles: Record<string, { bg: string; text: string; border: string }> = {
  kritiek: {
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
  aandacht: {
    bg: "rgba(234, 179, 8, 0.15)",
    text: "#eab308",
    border: "rgba(234, 179, 8, 0.3)",
  },
  op_koers: {
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#22c55e",
    border: "rgba(34, 197, 94, 0.3)",
  },
  // Legacy alias (zonder underscore)
  opkoers: {
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#22c55e",
    border: "rgba(34, 197, 94, 0.3)",
  },
};

/** Fallback styling voor onbekende ernst-waarden */
const FALLBACK_STYLE = {
  bg: "rgba(156, 163, 175, 0.15)",
  text: "#9ca3af",
  border: "rgba(156, 163, 175, 0.3)",
};

export function SignalBadge({ ernst, children }: SignalBadgeProps) {
  const colors = ernstStyles[ernst] ?? FALLBACK_STYLE;
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {children}
    </span>
  );
}
