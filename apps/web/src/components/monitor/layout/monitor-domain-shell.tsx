"use client";

import type { ReactNode } from "react";
import {
  DomainShell,
  type DomainNavItem,
  type NavItem,
  HomeIcon,
  PeopleIcon,
  ChartIcon,
} from "@oranje-wit/ui";

// ─── Alert icon voor Signalering ──────────────────────────────
function AlertIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

// ─── BottomNav items (4 items, DomainShell voegt Apps-knop toe) ──
const bottomNavItems: NavItem[] = [
  { href: "/monitor", label: "Home", icon: HomeIcon },
  { href: "/monitor/teams", label: "Teams", icon: PeopleIcon },
  { href: "/monitor/retentie", label: "Analyse", icon: ChartIcon },
  { href: "/monitor/signalering", label: "Signalen", icon: AlertIcon },
];

// ─── Sidebar navigatie-items ──────────────────────────────────
const sidebarItems: DomainNavItem[] = [
  { label: "Dashboard", href: "/monitor", icon: <span>📊</span> },
  { label: "Teams", href: "/monitor/teams", icon: <span>🏃</span> },
  { label: "Spelers", href: "/monitor/spelers", icon: <span>👤</span> },
  { label: "Samenstelling", href: "/monitor/samenstelling", icon: <span>👥</span> },
  { label: "Ledendynamiek", href: "/monitor/retentie", icon: <span>🔄</span> },
  { label: "Jeugdpijplijn", href: "/monitor/projecties", icon: <span>🎯</span> },
  { label: "Signalering", href: "/monitor/signalering", icon: <span>⚠️</span> },
];

// ─── MonitorDomainShell ──────────────────────────────────────
export function MonitorDomainShell({ children }: { children: ReactNode }) {
  return (
    <DomainShell
      domain="monitor"
      sidebar={{
        title: "Verenigingsmonitor",
        subtitle: "c.k.v. Oranje Wit",
        items: sidebarItems,
      }}
      bottomNav={bottomNavItems}
      skipRoutes={["/login"]}
    >
      {children}
    </DomainShell>
  );
}
