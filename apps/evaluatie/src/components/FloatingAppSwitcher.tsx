"use client";

import { useState } from "react";
import { AppSwitcher } from "@oranje-wit/ui";

/**
 * Floating "Apps" knop rechtsonder met AppSwitcher overlay.
 * Bedoeld voor apps zonder sidebar/shell (zoals Evaluatie).
 */
export function FloatingAppSwitcher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating knop */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200"
        style={{
          backgroundColor: "var(--surface-raised)",
          border: "1px solid var(--border-default)",
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          color: open ? "var(--ow-oranje-500)" : "var(--text-tertiary)",
        }}
        aria-label="Open apps"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth={1.8}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
        </svg>
      </button>

      {/* AppSwitcher bottom sheet */}
      <AppSwitcher open={open} onClose={() => setOpen(false)} />
    </>
  );
}
