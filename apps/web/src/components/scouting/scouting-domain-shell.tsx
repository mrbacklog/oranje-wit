"use client";

import type { ReactNode } from "react";
import { DomainShell, resolveBottomNav, SCOUTING } from "@oranje-wit/ui";

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(SCOUTING);

// ─── ScoutingDomainShell ──────────────────────────────────────
export function ScoutingDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell domain="scouting" bottomNav={bottomNavItems} manifest={SCOUTING}>
      {children}
    </DomainShell>
  );
}
