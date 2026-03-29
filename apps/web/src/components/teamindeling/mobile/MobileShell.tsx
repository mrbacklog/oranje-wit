"use client";

import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { DomainShell, resolveBottomNav, TEAM_INDELING_MOBILE } from "@oranje-wit/ui";

const bottomNavItems = resolveBottomNav(TEAM_INDELING_MOBILE);

interface MobileShellProps {
  children: ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const { data: session } = useSession();

  const user = session?.user
    ? {
        name: session.user.name ?? "Gebruiker",
        email: session.user.email ?? "",
      }
    : undefined;

  return (
    <DomainShell
      domain="team-indeling"
      theme="dark"
      bottomNav={bottomNavItems}
      user={user}
      onSignOut={() => signOut()}
    >
      {children}
    </DomainShell>
  );
}
