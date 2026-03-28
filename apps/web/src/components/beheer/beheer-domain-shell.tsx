"use client";

import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { DomainShell, resolveBottomNav, BEHEER } from "@oranje-wit/ui";

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(BEHEER);

// ─── BeheerDomainShell ──────────────────────────────────────
export function BeheerDomainShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const user = session?.user
    ? { name: session.user.name ?? "Gebruiker", email: session.user.email ?? "" }
    : undefined;

  return (
    <DomainShell
      domain="beheer"
      bottomNav={bottomNavItems}
      user={user}
      onSignOut={() => signOut()}
      skipRoutes={BEHEER.skipRoutes}
    >
      {children}
    </DomainShell>
  );
}
