"use client";

import type { ReactNode } from "react";
import { DomainShell, resolveBottomNav, WWW } from "@oranje-wit/ui";

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(WWW);

// ─── WwwDomainShell ──────────────────────────────────────────
export function WwwDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell domain="www" bottomNav={bottomNavItems} skipRoutes={WWW.skipRoutes}>
      {children}
    </DomainShell>
  );
}
