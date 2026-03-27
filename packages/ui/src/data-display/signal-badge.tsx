interface SignalBadgeProps {
  ernst: "kritiek" | "aandacht" | "opkoers";
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
  opkoers: {
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#22c55e",
    border: "rgba(34, 197, 94, 0.3)",
  },
};

export function SignalBadge({ ernst, children }: SignalBadgeProps) {
  const colors = ernstStyles[ernst];
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
