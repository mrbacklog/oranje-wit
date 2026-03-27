"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  /** Large icon element (64px recommended) */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Call-to-action button */
  action?: EmptyStateAction;
  /** Additional CSS class */
  className?: string;
}

// ─── Default icon ───────────────────────────────────────────────

function DefaultIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <circle
        cx="32"
        cy="32"
        r="12"
        stroke="var(--text-tertiary)"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle cx="32" cy="32" r="3" fill="var(--text-tertiary)" opacity="0.6" />
    </svg>
  );
}

// ─── EmptyState Component ───────────────────────────────────────

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Icon with glow and floating animation */}
      <motion.div
        className="relative mb-5"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Glow behind icon */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255, 133, 51, 0.12), transparent 70%)",
            transform: "scale(1.8)",
            filter: "blur(8px)",
          }}
        />
        <div className="relative">{icon || <DefaultIcon />}</div>
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          className="mt-2 max-w-sm text-sm"
          style={{
            color: "var(--text-secondary)",
            lineHeight: "var(--leading-relaxed)",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {description}
        </motion.p>
      )}

      {/* Action button */}
      {action && (
        <motion.button
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-600))",
            boxShadow: "0 0 16px rgba(255, 133, 51, 0.2), var(--shadow-sm)",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 0 24px rgba(255, 133, 51, 0.3), var(--shadow-md)",
          }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
