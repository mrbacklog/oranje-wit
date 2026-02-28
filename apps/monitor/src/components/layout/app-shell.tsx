"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Focus trap voor mobiele sidebar
  useEffect(() => {
    if (!mobileOpen) return;

    // Focus naar sidebar bij openen
    const sidebar = sidebarRef.current;
    if (sidebar) {
      const firstFocusable = sidebar.querySelector<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !sidebar) return;

      const focusable = sidebar.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
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
  }, [mobileOpen, close]);

  // Focus terug naar hamburger bij sluiten
  useEffect(() => {
    if (!mobileOpen) {
      hamburgerRef.current?.focus();
    }
  }, [mobileOpen]);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex">
        <Suspense>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigatiemenu"
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={close} aria-hidden="true" />
          {/* Sidebar panel */}
          <div className="relative z-50" ref={sidebarRef}>
            <Suspense>
              <Sidebar onClose={close} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile hamburger */}
        <div className="sticky top-0 z-40 flex items-center border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Menu openen"
            aria-expanded={mobileOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="text-ow-oranje ml-3 text-sm font-bold">Oranje Wit</span>
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
