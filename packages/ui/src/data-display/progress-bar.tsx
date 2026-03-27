"use client";

import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Label displayed on the left */
  label?: string;
  /** Show numeric value on the right */
  showValue?: boolean;
  /** Value format: percentage or absolute */
  valueFormat?: "percentage" | "absolute";
  /**
   * Color mode:
   * - "auto": gradient based on value (red→yellow→green)
   * - CSS color string for custom single-color gradient
   * - { from: string, to: string } for custom gradient
   */
  color?: "auto" | string | { from: string; to: string };
  /** Track height */
  size?: ProgressSize;
  /** Animation delay in seconds */
  delay?: number;
  /** Additional CSS class for the wrapper */
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

const sizeMap: Record<ProgressSize, { height: number; radius: number }> = {
  sm: { height: 4, radius: 2 },
  md: { height: 8, radius: 4 },
  lg: { height: 12, radius: 6 },
};

function getAutoGradient(percentage: number): { from: string; to: string; glow: string } {
  if (percentage <= 33) {
    return {
      from: "#dc2626",
      to: "#ef4444",
      glow: "rgba(239, 68, 68, 0.4)",
    };
  }
  if (percentage <= 66) {
    return {
      from: "#d97706",
      to: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.4)",
    };
  }
  return {
    from: "#16a34a",
    to: "#22c55e",
    glow: "rgba(34, 197, 94, 0.4)",
  };
}

function resolveColors(
  color: ProgressBarProps["color"],
  percentage: number
): { from: string; to: string; glow: string } {
  if (!color || color === "auto") {
    return getAutoGradient(percentage);
  }
  if (typeof color === "string") {
    return { from: color, to: color, glow: `${color}66` };
  }
  return { from: color.from, to: color.to, glow: `${color.to}66` };
}

// ─── ProgressBar Component ──────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  valueFormat = "percentage",
  color = "auto",
  size = "md",
  delay = 0,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const { height, radius } = sizeMap[size];
  const { from, to, glow } = resolveColors(color, percentage);

  const displayValue =
    valueFormat === "percentage" ? `${Math.round(percentage)}%` : `${value}/${max}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label and value row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {label}
            </span>
          )}
          {showValue && (
            <motion.span
              className="text-xs font-semibold tabular-nums"
              style={{ color: "var(--text-primary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.6 }}
            >
              {displayValue}
            </motion.span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height,
          borderRadius: radius,
          backgroundColor: "var(--surface-raised)",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            borderRadius: radius,
            background: `linear-gradient(90deg, ${from}, ${to})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            delay,
            ease: [0.4, 0, 0.2, 1],
          }}
        />

        {/* Glow on the leading edge */}
        {percentage > 3 && (
          <motion.div
            className="absolute inset-y-0"
            style={{
              width: 12,
              borderRadius: radius,
              background: `radial-gradient(circle at right, ${glow}, transparent)`,
              filter: "blur(2px)",
            }}
            initial={{ right: "100%" }}
            animate={{ right: `${100 - percentage}%` }}
            transition={{
              duration: 1,
              delay,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        )}

        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            borderRadius: radius,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            backgroundPosition: ["200% 0", "-200% 0"],
          }}
          transition={{
            opacity: { duration: 0.3, delay: delay + 0.8 },
            backgroundPosition: {
              duration: 3,
              delay: delay + 1.2,
              repeat: Infinity,
              repeatDelay: 4,
              ease: "linear",
            },
          }}
        />
      </div>
    </div>
  );
}
