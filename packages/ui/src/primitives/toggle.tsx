"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  /** Is de toggle aan? */
  checked: boolean;
  /** Callback bij state change */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Aria-label of zichtbaar label */
  label?: string;
  /** Extra CSS class */
  className?: string;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_PADDING = 3;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING * 2;

/**
 * Toggle — iOS-style toggle switch met premium animaties.
 *
 * Features:
 * - Oranje gradient track bij actieve staat
 * - Witte thumb met subtiele shadow en smooth spring transition
 * - Glow effect wanneer aan (subtiele oranje glow rond track)
 * - Keyboard accessible (Space/Enter)
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  className = "",
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Track */}
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
        }}
        animate={{
          background: checked
            ? "linear-gradient(135deg, #ff8533, #ff6b00)"
            : "var(--surface-sunken, #0a0c0f)",
          boxShadow: checked
            ? "0 0 20px rgba(255,133,51,0.25), inset 0 1px 2px rgba(0,0,0,0.1)"
            : "inset 0 2px 4px rgba(0,0,0,0.3), inset 0 0 0 1px var(--border-default)",
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Glow achter de track wanneer aan */}
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-full"
          animate={{
            opacity: checked ? 1 : 0,
            boxShadow: checked ? "0 0 24px rgba(255,133,51,0.2)" : "0 0 0px rgba(255,133,51,0)",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            top: THUMB_PADDING,
          }}
          animate={{
            left: checked ? THUMB_PADDING + THUMB_TRAVEL : THUMB_PADDING,
            background: checked
              ? "linear-gradient(180deg, #ffffff, #f0f0f0)"
              : "linear-gradient(180deg, #e5e5e5, #cccccc)",
            boxShadow: checked
              ? "0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)"
              : "0 1px 4px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.2)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          {/* Subtiele highlight op de thumb */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 60%)",
            }}
          />
        </motion.div>
      </motion.button>

      {/* Label tekst */}
      {label && (
        <span
          className="text-sm font-medium select-none"
          style={{
            color: disabled ? "var(--text-tertiary)" : "var(--text-secondary)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
