"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface BottomSheetProps {
  /** Is het sheet open? */
  open: boolean;
  /** Callback om te sluiten */
  onClose: () => void;
  /** Hoogte als percentage van viewport (default: 85) */
  height?: number;
  /** Titel in de header */
  title?: string;
  /** Content */
  children: ReactNode;
}

export function BottomSheet({ open, onClose, height = 85, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-200"
        style={{ backgroundColor: "var(--surface-scrim)" }}
        onClick={onClose}
        role="presentation"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl transition-transform duration-300"
        style={{
          backgroundColor: "var(--surface-raised)",
          maxHeight: `${height}dvh`,
          transform: open ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Panel"}
      >
        {/* Handle + Header */}
        <div className="flex-shrink-0 px-6 pt-3 pb-2">
          {/* Drag handle */}
          <div
            className="mx-auto mb-3 h-1 w-10 rounded-full"
            style={{ backgroundColor: "var(--border-strong)" }}
          />
          {title && (
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </>
  );
}
