"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { popoverScale } from "../motion/variants";

// ─── Types ──────────────────────────────────────────────────────

export interface PopoverProps {
  /** Het element dat de popover triggert (wordt in een wrapper gerenderd) */
  trigger: ReactNode;
  /** De popover-inhoud */
  children: ReactNode;
  /** Horizontale uitlijning ten opzichte van trigger */
  align?: "start" | "center" | "end";
}

// ─── Component ──────────────────────────────────────────────────

export function Popover({ trigger, children, align = "center" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Bepaal positie: onder of boven
  const calculatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom");
  }, []);

  // Click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!open) calculatePosition();
    setOpen((prev) => !prev);
  }, [open, calculatePosition]);

  // Uitlijning CSS
  const alignStyles: Record<string, React.CSSProperties> = {
    start: { left: 0 },
    center: { left: "50%", transform: "translateX(-50%)" },
    end: { right: 0 },
  };

  // Arrow positie
  const arrowAlignStyles: Record<string, React.CSSProperties> = {
    start: { left: "16px" },
    center: { left: "50%", marginLeft: "-6px" },
    end: { right: "16px" },
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Popover content */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            variants={popoverScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-[70] min-w-[200px]"
            style={{
              ...alignStyles[align],
              ...(position === "bottom"
                ? { top: "calc(100% + 10px)" }
                : { bottom: "calc(100% + 10px)" }),
              // Popover center alignment moet transform niet overschrijven
              ...(align === "center" ? {} : {}),
            }}
          >
            {/* Arrow */}
            <div
              className="absolute h-3 w-3 rotate-45"
              style={{
                backgroundColor: "rgba(34, 38, 46, 0.95)",
                border: "1px solid var(--border-default)",
                ...(position === "bottom"
                  ? { top: "-6px", borderBottom: "none", borderRight: "none" }
                  : { bottom: "-6px", borderTop: "none", borderLeft: "none" }),
                ...arrowAlignStyles[align],
              }}
            />

            {/* Content panel */}
            <div
              className="relative overflow-hidden rounded-xl p-4"
              style={{
                backgroundColor: "rgba(34, 38, 46, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-modal), 0 0 0 1px rgba(255, 133, 51, 0.05)",
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
