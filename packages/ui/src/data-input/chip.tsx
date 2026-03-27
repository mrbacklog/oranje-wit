"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ChipProps {
  /** Tekst op de chip */
  label: string;
  /** Is de chip geselecteerd? */
  selected?: boolean;
  /** Callback bij selectie/deselectie */
  onSelect?: () => void;
  /** Callback bij verwijderen (toont X knop) */
  onRemove?: () => void;
  /** Custom kleur (bijv. KNKV leeftijdskleur) */
  color?: string;
  /** Extra CSS class */
  className?: string;
  /** Layout ID voor smooth reordering animaties */
  layoutId?: string;
}

/**
 * Chip — Filter chip / tag met pill-shaped premium styling.
 *
 * Features:
 * - Varianten: default (border), selected (oranje fill), colored (leeftijdskleur)
 * - Remove knop (X) met fade animatie via AnimatePresence
 * - Selected state: subtiele oranje gradient achtergrond
 * - Smooth spring animaties voor alle state changes
 * - Framer Motion layoutId voor smooth list reordering
 */
export function Chip({
  label,
  selected = false,
  onSelect,
  onRemove,
  color,
  className = "",
  layoutId,
}: ChipProps) {
  const hasColor = !!color;

  // Stijl bepalen op basis van state
  const getStyles = (): {
    bg: string;
    border: string;
    text: string;
    shadow: string;
  } => {
    if (selected) {
      return {
        bg: "linear-gradient(135deg, rgba(255,133,51,0.2), rgba(255,107,0,0.15))",
        border: "1px solid rgba(255,133,51,0.4)",
        text: "var(--ow-oranje-400, #fb923c)",
        shadow: "0 0 12px rgba(255,133,51,0.1), 0 1px 3px rgba(0,0,0,0.2)",
      };
    }
    if (hasColor) {
      return {
        bg: `linear-gradient(135deg, ${color}18, ${color}10)`,
        border: `1px solid ${color}33`,
        text: color,
        shadow: "0 1px 3px rgba(0,0,0,0.15)",
      };
    }
    return {
      bg: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      text: "var(--text-secondary)",
      shadow: "0 1px 2px rgba(0,0,0,0.1)",
    };
  };

  const styles = getStyles();

  return (
    <motion.div
      layout
      layoutId={layoutId}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${className}`}
      style={{
        background: styles.bg,
        border: styles.border,
        color: styles.text,
        boxShadow: styles.shadow,
        cursor: onSelect ? "pointer" : "default",
      }}
      onClick={onSelect}
      whileHover={
        onSelect
          ? {
              scale: 1.03,
              boxShadow: selected
                ? "0 0 20px rgba(255,133,51,0.15), 0 2px 6px rgba(0,0,0,0.25)"
                : "0 2px 8px rgba(0,0,0,0.2)",
            }
          : undefined
      }
      whileTap={onSelect ? { scale: 0.97 } : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      role={onSelect ? "button" : undefined}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={onSelect ? `${label} ${selected ? "geselecteerd" : "niet geselecteerd"}` : label}
    >
      {/* Selectie-indicator dot */}
      <AnimatePresence>
        {selected && (
          <motion.span
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "var(--ow-oranje-500, #ff8533)",
              boxShadow: "0 0 6px rgba(255,133,51,0.4)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
          />
        )}
      </AnimatePresence>

      {/* Label tekst */}
      <span className="whitespace-nowrap select-none">{label}</span>

      {/* Remove knop */}
      <AnimatePresence>
        {onRemove && (
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 transition-colors"
            style={{
              color: styles.text,
              opacity: 0.6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.6";
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
            initial={{ opacity: 0, scale: 0.5, width: 0 }}
            animate={{ opacity: 0.6, scale: 1, width: "auto" }}
            exit={{ opacity: 0, scale: 0.5, width: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            aria-label={`${label} verwijderen`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
