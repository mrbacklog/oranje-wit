"use client";

import { AppShell, type SidebarConfig } from "@oranje-wit/ui";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useSeizoen } from "@/components/providers/SeizoenProvider";

const ROLE_LABELS: Record<string, string> = {
  EDITOR: "TC-lid",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

interface TISidebarProps {
  children: ReactNode;
}

export function TISidebar({ children }: TISidebarProps) {
  const { data: session } = useSession();
  const { seizoen, isWerkseizoen } = useSeizoen();

  const sidebar: SidebarConfig = {
    branding: {
      title: "Team-Indeling",
      subtitle: seizoen ? `Seizoen ${seizoen}` : undefined,
    },
    navigation: [
      { label: "Dashboard", href: "/", icon: "🏠" },
      { label: "Blauwdruk", href: "/blauwdruk", icon: "🗂️" },
      { label: "Werkbord", href: "/werkbord", icon: "📋" },
      { label: "Scenario's", href: "/scenarios", icon: "🏗️" },
    ],
    footer: {
      settingsHref: "/instellingen",
      userMenu: session?.user
        ? {
            name: session.user.name || "Gebruiker",
            role: ROLE_LABELS[session.user.role ?? "VIEWER"] || "Viewer",
            onSignOut: () => signOut(),
          }
        : undefined,
    },
  };

  const banner = !isWerkseizoen ? (
    <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
      Je bekijkt seizoen {seizoen} — dit is niet het actieve werkseizoen (alleen-lezen)
    </div>
  ) : null;

  return (
    <AppShell sidebar={sidebar} banner={banner}>
      {children}
    </AppShell>
  );
}
