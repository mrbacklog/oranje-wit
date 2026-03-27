"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  type SidebarConfig,
  BottomNav,
  type NavItem,
  HomeIcon,
  PeopleIcon,
  ChartIcon,
  GridIcon,
  AppSwitcher,
} from "@oranje-wit/ui";

// ─── Alert icon voor Signalering BottomNav item ──────────────
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

// ─── BottomNav configuratie (4 items + Apps) ─────────────────
const bottomNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/teams", label: "Teams", icon: PeopleIcon },
  { href: "/retentie", label: "Analyse", icon: ChartIcon },
  { href: "/signalering", label: "Signalen", icon: AlertIcon },
];

// ─── Desktop sidebar configuratie ────────────────────────────
const sidebarConfig: SidebarConfig = {
  branding: {
    title: "Verenigingsmonitor",
    subtitle: "c.k.v. Oranje Wit",
  },
  navigation: [
    { label: "Dashboard", href: "/", icon: "📊" },
    { label: "Teams", href: "/teams", icon: "🏃" },
    { label: "Spelers", href: "/spelers", icon: "👤" },
    { label: "Samenstelling", href: "/samenstelling", icon: "👥" },
    { label: "Ledendynamiek", href: "/retentie", icon: "🔄" },
    { label: "Jeugdpijplijn", href: "/projecties", icon: "🎯" },
    { label: "Signalering", href: "/signalering", icon: "⚠️" },
  ],
  footer: {
    showAppSwitcher: true,
  },
};

// ─── MonitorShell ────────────────────────────────────────────

interface MonitorShellProps {
  children: ReactNode;
}

export function MonitorShell({ children }: MonitorShellProps) {
  const pathname = usePathname();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  // Login pagina: geen shell
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* Desktop sidebar — verborgen op mobile */}
      <div className="hidden md:block">
        <Sidebar {...sidebarConfig} />
      </div>

      {/* Main content area — extra bottom padding op mobile voor BottomNav */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>

      {/* Mobile BottomNav — fixed wrapper zodat het niet de flex layout beïnvloedt */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <BottomNav items={bottomNavItems}>
          <button
            onClick={() => setAppSwitcherOpen(true)}
            className="flex min-h-11 min-w-11 flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors duration-200"
            style={{ color: appSwitcherOpen ? "var(--ow-oranje-500)" : "var(--text-tertiary)" }}
            aria-label="Apps"
          >
            <GridIcon active={appSwitcherOpen} />
            <span className="font-medium">Apps</span>
          </button>
        </BottomNav>
      </div>

      {/* AppSwitcher overlay — altijd beschikbaar, toont zichzelf als open */}
      <AppSwitcher open={appSwitcherOpen} onClose={() => setAppSwitcherOpen(false)} />
    </div>
  );
}
