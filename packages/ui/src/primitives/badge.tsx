import type { HTMLAttributes, ReactNode } from "react";

type BadgeColor = "gray" | "green" | "orange" | "red" | "blue" | "yellow";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  children?: ReactNode;
}

const colorStyles: Record<BadgeColor, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

export function Badge({ color = "gray", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorStyles[color]} ${className}`}
      {...props}
    />
  );
}
