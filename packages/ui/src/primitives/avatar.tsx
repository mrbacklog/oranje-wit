"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarProps {
  /** Afbeeldings-URL */
  src?: string | null;
  /** Alternatieve tekst */
  alt?: string;
  /** Grootte van de avatar */
  size?: AvatarSize;
  /** Initialen als fallback (2 karakters) */
  initials?: string;
  /** Toon online indicator */
  online?: boolean;
  /** Kleur voor de gradient border/fallback — KNKV leeftijdskleur */
  ageColor?: string;
  /** Actieve staat toont gradient border ring */
  active?: boolean;
  /** Extra CSS class */
  className?: string;
}

const SIZE_MAP: Record<AvatarSize, { px: number; text: string; dot: number }> = {
  xs: { px: 24, text: "text-[8px]", dot: 6 },
  sm: { px: 32, text: "text-[10px]", dot: 7 },
  md: { px: 40, text: "text-xs", dot: 8 },
  lg: { px: 48, text: "text-sm", dot: 9 },
  xl: { px: 64, text: "text-base", dot: 10 },
  "2xl": { px: 80, text: "text-lg", dot: 12 },
};

/** Genereer een deterministische gradient op basis van initialen */
function initialsGradient(initials: string, ageColor?: string): string {
  if (ageColor) {
    return `linear-gradient(135deg, ${ageColor}, ${ageColor}88)`;
  }
  // Fallback: oranje gradient
  return "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))";
}

/**
 * Avatar — Circular afbeelding of initialen met premium styling.
 *
 * Features:
 * - Gradient border ring bij actieve staat
 * - Groene pulserende online indicator
 * - Initialen op gradient achtergrond als fallback
 * - Glassmorphism shadow voor diepte
 */
export function Avatar({
  src,
  alt = "",
  size = "md",
  initials,
  online,
  ageColor,
  active = false,
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const config = SIZE_MAP[size];
  const showImage = src && !imgError;
  const displayInitials = initials?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: config.px, height: config.px }}
    >
      {/* Gradient border ring (actieve staat) */}
      {active && (
        <motion.div
          className="absolute -inset-[3px] rounded-full"
          style={{
            background: ageColor
              ? `linear-gradient(135deg, ${ageColor}, ${ageColor}66, ${ageColor})`
              : "linear-gradient(135deg, var(--ow-oranje-400), var(--ow-oranje-600), var(--ow-oranje-400))",
            opacity: 0.8,
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Outer container met glassmorphism shadow */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: config.px,
          height: config.px,
          boxShadow: active
            ? `0 0 16px ${ageColor ?? "var(--ow-oranje-500)"}33, 0 2px 8px rgba(0,0,0,0.3)`
            : "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
          border: active ? "none" : "1px solid var(--border-default)",
        }}
      >
        {showImage ? (
          <motion.img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center font-bold ${config.text}`}
            style={{
              background: initialsGradient(displayInitials, ageColor),
              color: "#ffffff",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {displayInitials}
          </div>
        )}

        {/* Subtiele glassmorphism overlay voor diepte */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)",
          }}
        />
      </div>

      {/* Online indicator */}
      {online && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: config.dot,
            height: config.dot,
            right: size === "xs" || size === "sm" ? -1 : 0,
            bottom: size === "xs" || size === "sm" ? -1 : 0,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            border: "2px solid var(--surface-card)",
            boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
          }}
          animate={{
            boxShadow: [
              "0 0 4px rgba(34, 197, 94, 0.3)",
              "0 0 10px rgba(34, 197, 94, 0.6)",
              "0 0 4px rgba(34, 197, 94, 0.3)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );
}
