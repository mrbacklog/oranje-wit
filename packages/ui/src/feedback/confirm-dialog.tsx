"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dialogScale, overlayBackdrop } from "../motion/variants";

// ─── Types ──────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
}

// ─── Variant kleuren ────────────────────────────────────────────

const variantConfig = {
  danger: {
    iconColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.15)",
    buttonBg: "#ef4444",
    buttonHover: "#dc2626",
    iconPath: "M12 9v4m0 4h.01M12 3L2 21h20L12 3z",
  },
  warning: {
    iconColor: "var(--ow-oranje-500)",
    glowColor: "rgba(255, 133, 51, 0.15)",
    buttonBg: "var(--ow-oranje-500)",
    buttonHover: "var(--ow-oranje-600)",
    iconPath: "M12 9v4m0 4h.01M12 3L2 21h20L12 3z",
  },
};

// ─── Component ──────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bevestigen",
  variant = "danger",
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];

  // Escape-toets, focus trap, body scroll lock
  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      confirmRef.current?.focus();
    });

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-6">
          {/* Backdrop */}
          <motion.div
            variants={overlayBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0"
            style={{
              backgroundColor: "var(--surface-scrim)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            onClick={onClose}
          />

          {/* Dialog panel */}
          <motion.div
            variants={dialogScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "rgba(26, 29, 35, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-modal)",
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={description ? "confirm-desc" : undefined}
          >
            <div className="px-6 pt-8 pb-6 text-center">
              {/* Icon met glow */}
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor: config.glowColor,
                  boxShadow: `0 0 30px ${config.glowColor}`,
                }}
              >
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: config.iconColor }}
                >
                  <path d={config.iconPath} />
                </svg>
              </div>

              {/* Titel */}
              <h2
                id="confirm-title"
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h2>

              {/* Beschrijving */}
              {description && (
                <p
                  id="confirm-desc"
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Knoppen */}
            <div
              className="flex gap-3 px-6 pb-6"
              style={{ borderTop: "1px solid var(--border-default)", paddingTop: "1.25rem" }}
            >
              {/* Annuleren */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-strong)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-raised)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                Annuleren
              </motion.button>

              {/* Bevestigen */}
              <motion.button
                ref={confirmRef}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: config.buttonBg }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = config.buttonHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = config.buttonBg;
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
