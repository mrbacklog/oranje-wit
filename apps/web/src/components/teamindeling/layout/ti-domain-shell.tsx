"use client";

import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { DomainShell, resolveBottomNav, TI_STUDIO } from "@oranje-wit/ui";
import { useSeizoen } from "@oranje-wit/teamindeling-shared/seizoen-provider";

function getUserLabel(user: Record<string, unknown>): string {
  const labels: string[] = [];
  if (user.isTC) labels.push("TC-lid");
  if (user.isScout) labels.push("Scout");
  const dg = (user.doelgroepen as string[]) ?? [];
  if (dg.length > 0) labels.push("Coordinator");
  return labels.length > 0 ? labels.join(" \u00b7 ") : "Gebruiker";
}

// ─── BottomNav items uit manifest ────────────────────────────
const bottomNavItems = resolveBottomNav(TI_STUDIO);

// ─── TIDomainShell ──────────────────────────────────────────
export function TIDomainShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { seizoen, isWerkseizoen } = useSeizoen();

  const user = session?.user
    ? {
        name: session.user.name ?? "Gebruiker",
        email: getUserLabel(session.user as unknown as Record<string, unknown>),
      }
    : undefined;

  const banner = !isWerkseizoen ? (
    <div className="bg-[var(--color-warning-50)] px-4 py-2 text-center text-sm text-[var(--color-warning-700)]">
      Je bekijkt seizoen {seizoen} — dit is niet het actieve werkseizoen (alleen-lezen)
    </div>
  ) : null;

  return (
    <DomainShell
      domain="ti-studio"
      theme="dark"
      bottomNav={bottomNavItems}
      user={user}
      onSignOut={() => signOut()}
      banner={banner}
      manifest={TI_STUDIO}
    >
      {children}
    </DomainShell>
  );
}
