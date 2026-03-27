"use client";

import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { DomainShell, type DomainNavItem } from "@oranje-wit/ui";
import { useSeizoen } from "@/components/teamindeling/providers/SeizoenProvider";

function getUserLabel(user: Record<string, unknown>): string {
  const labels: string[] = [];
  if (user.isTC) labels.push("TC-lid");
  if (user.isScout) labels.push("Scout");
  const dg = (user.doelgroepen as string[]) ?? [];
  if (dg.length > 0) labels.push("Coordinator");
  return labels.length > 0 ? labels.join(" \u00b7 ") : "Gebruiker";
}

// ─── Sidebar navigatie-items ──────────────────────────────────
const sidebarItems: DomainNavItem[] = [
  { label: "Dashboard", href: "/teamindeling", icon: <span>🏠</span> },
  { label: "Blauwdruk", href: "/teamindeling/blauwdruk", icon: <span>🗂️</span> },
  { label: "Werkbord", href: "/teamindeling/werkbord", icon: <span>📋</span> },
  { label: "Scenario\u2019s", href: "/teamindeling/scenarios", icon: <span>🏗️</span> },
];

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
    <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
      Je bekijkt seizoen {seizoen} — dit is niet het actieve werkseizoen (alleen-lezen)
    </div>
  ) : null;

  return (
    <DomainShell
      domain="team-indeling"
      theme="light"
      sidebar={{
        title: "Team-Indeling",
        subtitle: seizoen ? `Seizoen ${seizoen}` : undefined,
        items: sidebarItems,
        settingsHref: "/teamindeling/instellingen",
      }}
      user={user}
      onSignOut={() => signOut()}
      banner={banner}
    >
      {children}
    </DomainShell>
  );
}
