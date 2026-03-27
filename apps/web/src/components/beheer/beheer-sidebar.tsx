"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ICON_MAP, HomeIcon } from "./icons";
import { AppSwitcher, GridIcon } from "@oranje-wit/ui";

// ── Types ─────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavLink[];
}

// ── Navigatie-structuur: 9 domeinen ──────────────────────────

const DOMEINEN: NavSection[] = [
  {
    title: "Planning",
    items: [
      { label: "Jaarkalender", href: "/beheer/jaarplanning/kalender", icon: "calendar" },
      { label: "Mijlpalen", href: "/beheer/jaarplanning/mijlpalen", icon: "checkCircle" },
      { label: "Trainingen", href: "/beheer/roostering/trainingen", icon: "flag" },
      { label: "Wedstrijden", href: "/beheer/roostering/wedstrijden", icon: "trophy" },
    ],
  },
  {
    title: "Teams",
    items: [
      { label: "Overzicht", href: "/beheer/teams", icon: "users" },
      { label: "Sportlink Sync", href: "/beheer/teams/sync", icon: "sync" },
    ],
  },
  {
    title: "Jeugd",
    items: [
      { label: "Raamwerk", href: "/beheer/jeugd/raamwerk", icon: "clipboard" },
      { label: "Progressie", href: "/beheer/jeugd/progressie", icon: "trendUp" },
      { label: "USS-parameters", href: "/beheer/jeugd/uss", icon: "barChart" },
    ],
  },
  {
    title: "Beoordeling",
    items: [
      { label: "Scouts", href: "/beheer/scouting/scouts", icon: "search" },
      { label: "Rondes", href: "/beheer/evaluatie/rondes", icon: "documentEdit" },
      { label: "Coordinatoren", href: "/beheer/evaluatie/coordinatoren", icon: "target" },
      { label: "Templates", href: "/beheer/evaluatie/templates", icon: "envelope" },
    ],
  },
  {
    title: "Groei",
    items: [
      { label: "Aanmeldingen", href: "/beheer/werving/aanmeldingen", icon: "userPlus" },
      { label: "Funnel", href: "/beheer/werving/funnel", icon: "funnel" },
    ],
  },
  {
    title: "Systeem",
    items: [
      { label: "Gebruikers", href: "/beheer/systeem/gebruikers", icon: "user" },
      { label: "Import", href: "/beheer/systeem/import", icon: "inboxDown" },
    ],
  },
  {
    title: "Archief",
    items: [
      { label: "Teamhistorie", href: "/beheer/archief/teams", icon: "bookStack" },
      { label: "Resultaten", href: "/beheer/archief/resultaten", icon: "award" },
    ],
  },
];

function getUserLabel(user: Record<string, unknown>): string {
  const labels: string[] = [];
  if (user.isTC) labels.push("TC-lid");
  if (user.isScout) labels.push("Scout");
  const dg = (user.doelgroepen as string[]) ?? [];
  if (dg.length > 0) labels.push("Coordinator");
  return labels.length > 0 ? labels.join(" \u00b7 ") : "Gebruiker";
}

// ── Sidebar Nav ──────────────────────────────────────────────

function SidebarNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/beheer") return pathname === "/beheer";
    return pathname.startsWith(href);
  }

  return (
    <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-2">
      {DOMEINEN.map((section) => (
        <div key={section.title}>
          <div className="sidebar-section-label">{section.title}</div>
          {section.items.map((item) => {
            const active = isActive(item.href);
            const IconComponent = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`sidebar-item ${active ? "active" : ""}`}
              >
                <span className="sidebar-icon">
                  {IconComponent ? <IconComponent className="h-[18px] w-[18px]" /> : null}
                </span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Volledige Sidebar ────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  return (
    <nav
      className="flex h-full w-64 flex-col"
      style={{
        backgroundColor: "var(--surface-card)",
        borderRight: "1px solid var(--border-default)",
      }}
      aria-label="Hoofdnavigatie"
    >
      {/* Branding */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
            }}
          >
            OW
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              TC Beheer
            </div>
            <div
              className="text-[10px] font-medium tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              c.k.v. Oranje Wit
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/beheer"
          onClick={onClose}
          aria-current={pathname === "/beheer" ? "page" : undefined}
          className={`sidebar-item ${pathname === "/beheer" ? "active" : ""}`}
        >
          <span className="sidebar-icon">
            <HomeIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="sidebar-label">Dashboard</span>
        </Link>
      </div>

      {/* Domein-navigatie */}
      <SidebarNav onClose={onClose} />

      {/* Apps + User footer */}
      <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border-light)" }}>
        {/* Apps knop */}
        <div className="relative">
          <button
            onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
            }}
            aria-label="Open app switcher"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center">
              <GridIcon active={appSwitcherOpen} />
            </span>
            <span>Apps</span>
          </button>

          {/* Desktop dropdown */}
          <div className="hidden md:block">
            <AppSwitcher
              open={appSwitcherOpen}
              onClose={() => setAppSwitcherOpen(false)}
              variant="dropdown"
            />
          </div>
        </div>

        {/* Mobile: sheet variant */}
        <div className="md:hidden">
          <AppSwitcher
            open={appSwitcherOpen}
            onClose={() => setAppSwitcherOpen(false)}
            variant="sheet"
          />
        </div>

        {/* User info */}
        {session?.user ? (
          <div className="mt-1 flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: "var(--state-hover)",
                  color: "var(--text-secondary)",
                }}
              >
                {(session.user.name ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {session.user.name ?? "Gebruiker"}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {getUserLabel(session.user as unknown as Record<string, unknown>)}
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded px-2 py-1 text-[11px] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              Uit
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

// ── BeheerSidebar (wraps children with sidebar layout) ───────

interface BeheerSidebarProps {
  children: ReactNode;
}

export function BeheerSidebar({ children }: BeheerSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen, closeMobile]);

  // Skip sidebar on login
  if (pathname.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={closeMobile} />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <SidebarContent onClose={closeMobile} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div
          className="flex items-center gap-3 px-4 py-3 md:hidden"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div
            className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-black text-white"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
            }}
          >
            OW
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            TC Beheer
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
