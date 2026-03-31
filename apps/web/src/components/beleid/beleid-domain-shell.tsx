"use client";

import type { ReactNode } from "react";
import { DomainShell, resolveBottomNav, BELEID } from "@oranje-wit/ui";

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(BELEID);

// ─── BeleidDomainShell ───────────────────────────────────────
export function BeleidDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell
      domain="beleid"
      bottomNav={bottomNavItems}
      skipRoutes={BELEID.skipRoutes}
      manifest={BELEID}
    >
      {children}
    </DomainShell>
  );
}
