"use client";

import { useEffect, useRef } from "react";

interface InfoDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Ref naar het element dat de drawer opende, voor focus-herstel */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function InfoDrawer({ open, onClose, title, children, triggerRef }: InfoDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyOpen = useRef(false);

  // Escape-toets en focus trap
  useEffect(() => {
    if (!open) return;

    // Focus naar sluitknop bij openen
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"]), input, select, textarea'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus terug naar trigger bij sluiten
  useEffect(() => {
    if (previouslyOpen.current && !open) {
      triggerRef?.current?.focus();
    }
    previouslyOpen.current = open;
  }, [open, triggerRef]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 z-40 flex h-full w-[85vw] flex-col border-t-2 border-t-[var(--color-ow-oranje,#ff6b00)] bg-white shadow-xl transition-transform duration-200 ease-out md:w-[20vw] md:max-w-[360px] md:min-w-[280px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-gray-600">
          {children}
        </div>
      </aside>
    </>
  );
}
