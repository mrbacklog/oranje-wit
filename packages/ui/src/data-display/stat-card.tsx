import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  color?: "default" | "orange" | "red" | "green" | "blue";
  className?: string;
}

const colorStyles = {
  default: "text-gray-900",
  orange: "text-ow-oranje",
  red: "text-red-600",
  green: "text-green-600",
  blue: "text-blue-600",
};

export function StatCard({ label, value, color = "default", className = "" }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm ${className}`}>
      <div className={`text-2xl font-bold ${colorStyles[color]}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}
