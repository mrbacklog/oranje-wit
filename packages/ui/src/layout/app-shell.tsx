"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import type { SidebarConfig } from "./types";

interface AppShellProps {
  children: ReactNode;
  sidebar: SidebarConfig;
  skipRoutes?: string[];
  banner?: ReactNode;
}

export function AppShell({ children, sidebar, skipRoutes = ["/login"], banner }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen, closeMobile]);

  if (skipRoutes.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--surface-page)" }}>
      <div className="hidden md:block">
        <Sidebar {...sidebar} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={closeMobile} />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar {...sidebar} onClose={closeMobile} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className="flex items-center px-4 py-3 md:hidden"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="ml-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {sidebar.branding.title}
          </span>
        </div>

        {banner}

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
