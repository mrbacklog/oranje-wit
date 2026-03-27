"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type IconButtonVariant = "default" | "ghost" | "accent";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps {
  /** Het icon als React node (SVG, emoji, etc.) */
  icon: ReactNode;
  /** Visuele variant */
  variant?: IconButtonVariant;
  /** Grootte */
  size?: IconButtonSize;
  /** Aria-label voor toegankelijkheid (verplicht) */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Extra CSS class */
  className?: string;
}

const SIZE_MAP: Record<IconButtonSize, { px: number; iconSize: string }> = {
  sm: { px: 36, iconSize: "text-base" },
  md: { px: 44, iconSize: "text-lg" },
  lg: { px: 52, iconSize: "text-xl" },
};

const VARIANT_STYLES: Record<
  IconButtonVariant,
  {
    bg: string;
    border: string;
    color: string;
    hoverBg: string;
    glowColor: string;
  }
> = {
  default: {
    bg: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border-default)",
    color: "var(--text-secondary)",
    hoverBg: "rgba(255,255,255,0.08)",
    glowColor: "rgba(255,255,255,0.06)",
  },
  ghost: {
    bg: "transparent",
    border: "1px solid transparent",
    color: "var(--text-secondary)",
    hoverBg: "rgba(255,255,255,0.06)",
    glowColor: "transparent",
  },
  accent: {
    bg: "rgba(255,133,51,0.08)",
    border: "1px solid rgba(255,133,51,0.2)",
    color: "var(--ow-oranje-500)",
    hoverBg: "rgba(255,133,51,0.15)",
    glowColor: "rgba(255,133,51,0.15)",
  },
};

/**
 * IconButton — Vierkante touch-target knop voor toolbars en navigatie.
 *
 * Features:
 * - Glassmorphism achtergrond met backdrop-blur
 * - Subtiele glow op hover
 * - Haptic tap feedback (scale 0.95)
 * - 44px minimum touch target (md)
 */
export function IconButton({
  icon,
  variant = "default",
  size = "md",
  label,
  onClick,
  disabled = false,
  className = "",
}: IconButtonProps) {
  const config = SIZE_MAP[size];
  const style = VARIANT_STYLES[variant];

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-40 ${config.iconSize} ${className}`}
      style={{
        width: config.px,
        height: config.px,
        backgroundColor: style.bg,
        border: style.border,
        color: style.color,
        backdropFilter: variant !== "ghost" ? "blur(12px)" : undefined,
        WebkitBackdropFilter: variant !== "ghost" ? "blur(12px)" : undefined,
      }}
      whileHover={
        disabled
          ? undefined
          : {
              backgroundColor: style.hoverBg,
              boxShadow: `0 0 16px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.2)`,
            }
      }
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
    >
      {icon}
    </motion.button>
  );
}
