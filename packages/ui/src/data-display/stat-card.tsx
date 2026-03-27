import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  color?: "default" | "orange" | "red" | "green" | "blue";
  className?: string;
}

const colorStyles = {
  default: "var(--text-primary)",
  orange: undefined as string | undefined,
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
};

export function StatCard({ label, value, color = "default", className = "" }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${className}`}
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className={`text-2xl font-bold ${color === "orange" ? "text-ow-oranje" : ""}`}
        style={color !== "orange" ? { color: colorStyles[color] } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
    </div>
  );
}
