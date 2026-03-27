"use client";

import type { ReactNode } from "react";
import { DomainShell } from "@oranje-wit/ui";

// ─── EvaluatieDomainShell ──────────────────────────────────────
// Minimale modus: alleen top-bar met domein-naam + AppSwitcher.
// Smartlink-pagina's (/evaluatie/invullen, /evaluatie/zelf) tonen
// geen chrome — die worden overgeslagen via skipRoutes.
export function EvaluatieDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell domain="evaluatie" minimal skipRoutes={["/evaluatie/invullen", "/evaluatie/zelf"]}>
      {children}
    </DomainShell>
  );
}
