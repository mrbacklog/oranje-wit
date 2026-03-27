import type { HTMLAttributes, ReactNode } from "react";

type BadgeColor = "gray" | "green" | "orange" | "red" | "blue" | "yellow";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  children?: ReactNode;
}

const colorStyles: Record<BadgeColor, { bg: string; text: string }> = {
  gray: { bg: "rgba(107, 114, 128, 0.15)", text: "var(--text-secondary)" },
  green: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
  orange: { bg: "rgba(249, 115, 22, 0.15)", text: "#f97316" },
  red: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
  blue: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  yellow: { bg: "rgba(234, 179, 8, 0.15)", text: "#eab308" },
};

export function Badge({ color = "gray", className = "", style, ...props }: BadgeProps) {
  const colors = colorStyles[color];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text, ...style }}
      {...props}
    />
  );
}
