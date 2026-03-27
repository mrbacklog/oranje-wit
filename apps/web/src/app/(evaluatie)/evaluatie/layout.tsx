"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSwitcher, GridIcon } from "@oranje-wit/ui";

/**
 * Evaluatie layout — voegt een floating AppSwitcher toe op interne pagina's.
 * Externe pagina's (invullen, zelf) tonen geen navigatie.
 */
export default function EvaluatieLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  const isExternalForm = pathname.includes("/invullen") || pathname.includes("/zelf");

  return (
    <>
      {children}

      {!isExternalForm && (
        <>
          <button
            onClick={() => setAppSwitcherOpen(true)}
            className="fixed right-5 bottom-5 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors duration-200"
            style={{
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-default)",
              color: appSwitcherOpen ? "var(--ow-oranje-500)" : "var(--text-tertiary)",
            }}
            aria-label="Apps"
          >
            <GridIcon active={appSwitcherOpen} />
          </button>

          <AppSwitcher open={appSwitcherOpen} onClose={() => setAppSwitcherOpen(false)} />
        </>
      )}
    </>
  );
}
