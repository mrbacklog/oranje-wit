"use client";

import { AppShell, type SidebarConfig } from "@oranje-wit/ui";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useSeizoen } from "@/components/teamindeling/providers/SeizoenProvider";

function getUserLabel(user: Record<string, unknown>): string {
  const labels: string[] = [];
  if (user.isTC) labels.push("TC-lid");
  if (user.isScout) labels.push("Scout");
  const dg = (user.doelgroepen as string[]) ?? [];
  if (dg.length > 0) labels.push("Coordinator");
  return labels.length > 0 ? labels.join(" \u00b7 ") : "Gebruiker";
}

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
      { label: "Dashboard", href: "/ti-studio", icon: "🏠" },
      { label: "Blauwdruk", href: "/ti-studio/blauwdruk", icon: "🗂️" },
      { label: "Werkbord", href: "/ti-studio/werkbord", icon: "📋" },
      { label: "Indeling", href: "/ti-studio/indeling", icon: "🏗️" },
    ],
    footer: {
      settingsHref: "/ti-studio/instellingen",
      showAppSwitcher: true,
      userMenu: session?.user
        ? {
            name: session.user.name || "Gebruiker",
            role: getUserLabel(session.user as unknown as Record<string, unknown>),
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
