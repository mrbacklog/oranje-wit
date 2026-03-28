"use client";

import type { ReactNode } from "react";
import { DomainShell, resolveBottomNav, EVALUATIE } from "@oranje-wit/ui";

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(EVALUATIE);

// ─── EvaluatieDomainShell ──────────────────────────────────────
// Smartlink-pagina's (/evaluatie/invullen, /evaluatie/zelf) tonen
// geen chrome — die worden overgeslagen via skipRoutes.
// Ingelogde gebruikers op /evaluatie, /evaluatie/admin, /evaluatie/coordinator
// zien de volledige BottomNav.
export function EvaluatieDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell domain="evaluatie" bottomNav={bottomNavItems} skipRoutes={EVALUATIE.skipRoutes}>
      {children}
    </DomainShell>
  );
}
