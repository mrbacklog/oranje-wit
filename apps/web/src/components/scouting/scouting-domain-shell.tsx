"use client";

import type { ReactNode } from "react";
import {
  DomainShell,
  type DomainNavItem,
  type NavItem,
  HomeIcon,
  SearchIcon,
  ListIcon,
  ProfileIcon,
} from "@oranje-wit/ui";

// ─── BottomNav items (4 items, DomainShell voegt Apps-knop toe) ──
const bottomNavItems: NavItem[] = [
  { href: "/scouting", label: "Home", icon: HomeIcon },
  { href: "/scouting/verzoeken", label: "Verzoeken", icon: ListIcon },
  { href: "/scouting/zoek", label: "Zoeken", icon: SearchIcon },
  { href: "/scouting/profiel", label: "Profiel", icon: ProfileIcon },
];

// ─── Sidebar navigatie-items (desktop, zelfde als BottomNav + extra) ──
const sidebarItems: DomainNavItem[] = [
  { label: "Dashboard", href: "/scouting", icon: HomeIcon },
  { label: "Verzoeken", href: "/scouting/verzoeken", icon: ListIcon },
  { label: "Zoeken", href: "/scouting/zoek", icon: SearchIcon },
  { label: "Profiel", href: "/scouting/profiel", icon: ProfileIcon },
];

// ─── ScoutingDomainShell ──────────────────────────────────────
export function ScoutingDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell
      domain="scouting"
      sidebar={{
        title: "Scouting",
        subtitle: "c.k.v. Oranje Wit",
        items: sidebarItems,
      }}
      bottomNav={bottomNavItems}
    >
      {children}
    </DomainShell>
  );
}
