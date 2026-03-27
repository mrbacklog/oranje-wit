"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { drawerSlide, overlayBackdrop } from "../motion/variants";

// ─── Types ──────────────────────────────────────────────────────

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
  /** Desktop breedte in px (default: 400). Mobile is altijd fullscreen. */
  width?: number;
}

// ─── Component ──────────────────────────────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  width = 400,
}: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape-toets, focus, scroll lock
  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      closeRef.current?.focus();
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

  const variants = drawerSlide(side);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          {/* Backdrop */}
          <motion.div
            variants={overlayBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0"
            style={{ backgroundColor: "var(--surface-scrim)" }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} flex h-full flex-col`}
            style={{
              width: "100%",
              maxWidth: `${width}px`,
              backgroundColor: "rgba(26, 29, 35, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderLeft: side === "right" ? "1px solid var(--border-default)" : "none",
              borderRight: side === "left" ? "1px solid var(--border-default)" : "none",
              boxShadow: "var(--shadow-modal)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            <div
              className="flex flex-shrink-0 items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
              <motion.button
                ref={closeRef}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-raised)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                }}
                aria-label="Sluiten"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
