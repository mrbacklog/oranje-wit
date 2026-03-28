"use client";

import type { ReactNode } from "react";
import { DomainShell, resolveBottomNav, MONITOR } from "@oranje-wit/ui";

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(MONITOR);

// ─── MonitorDomainShell ──────────────────────────────────────
export function MonitorDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell domain="monitor" bottomNav={bottomNavItems} skipRoutes={MONITOR.skipRoutes}>
      {children}
    </DomainShell>
  );
}
