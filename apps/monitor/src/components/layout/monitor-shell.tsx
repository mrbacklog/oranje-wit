"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sidebar,
  type SidebarConfig,
  BottomNav,
  type NavItem,
  HomeIcon,
  PeopleIcon,
  ChartIcon,
  ProfileIcon,
  GridIcon,
  AppSwitcher,
} from "@oranje-wit/ui";

// ─── Spelers icon voor BottomNav ─────────────────────────────
function SpelersIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" />
      <path
        d="M6 21v-1a6 6 0 0112 0v1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── BottomNav configuratie (4 items + Apps) ─────────────────
const bottomNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/teams", label: "Teams", icon: PeopleIcon },
  { href: "/retentie", label: "Analyse", icon: ChartIcon },
  { href: "/spelers", label: "Spelers", icon: SpelersIcon },
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
};

// ─── MonitorShell ────────────────────────────────────────────

interface MonitorShellProps {
  children: ReactNode;
}

export function MonitorShell({ children }: MonitorShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  // Login pagina: geen shell
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const profile = session?.user
    ? {
        name: session.user.name || "Gebruiker",
        detail: session.user.email || undefined,
        onSignOut: () => signOut({ callbackUrl: "/login" }),
      }
    : undefined;

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

      {/* AppSwitcher overlay — met profiel */}
      <AppSwitcher
        open={appSwitcherOpen}
        onClose={() => setAppSwitcherOpen(false)}
        profile={profile}
      />
    </div>
  );
}
