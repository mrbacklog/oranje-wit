"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./sidebar";
import type { SidebarConfig } from "./types";
import { type NavItem as BottomNavItem } from "../navigation/bottom-nav";
import { GridIcon } from "../navigation/bottom-nav";
import { AppSwitcher, type AppSwitcherProfile } from "../navigation/app-switcher";
import { APP_META } from "../navigation/app-icons";
import type { AppId } from "../navigation/icons/types";
import { BottomNavShell, FloatingAppSwitcherFab } from "../navigation/bottom-nav-shell";
import { overlayBackdrop, drawerSlide } from "../motion/variants";

// ─── Public types ─────────────────────────────────────────────

export interface DomainNavItem {
  label: string;
  href: string;
  icon: ReactNode | ((props: { active: boolean }) => ReactNode);
  badge?: number;
  description?: string;
}

export interface DomainNavSection {
  title: string;
  items: DomainNavItem[];
}

export interface DomainSidebarConfig {
  title: string;
  subtitle?: string;
  /** Platte navigatie-items (voor de meeste domeinen) */
  items?: DomainNavItem[];
  /** Gegroepeerde navigatie met secties (voor Beheer met 9 domeinen) */
  sections?: DomainNavSection[];
  /** Link naar een instellingenpagina in de sidebar footer */
  settingsHref?: string;
}

export interface DomainShellProps {
  /** Welk domein is actief (voor AppSwitcher highlight) */
  domain: AppId;
  /** Desktop sidebar configuratie. Zonder = geen sidebar */
  sidebar?: DomainSidebarConfig;
  /** Mobile BottomNav items (max 4). Zonder = geen BottomNav */
  bottomNav?: BottomNavItem[];
  /** Routes waar de shell NIET wordt getoond (bijv. smartlink formulieren) */
  skipRoutes?: string[];
  /** Theme override — zet data-theme attribuut op de wrapper */
  theme?: "dark" | "light";
  /** Minimale modus: alleen top-bar met domein-naam + AppSwitcher (voor evaluatie) */
  minimal?: boolean;
  /** User info voor sidebar footer en AppSwitcher profiel */
  user?: { name: string; email: string };
  /** Sign out handler */
  onSignOut?: () => void;
  /** Optionele banner boven de content (bijv. maintenance melding) */
  banner?: ReactNode;
  children: ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────

/** Mapt DomainSidebarConfig naar het bestaande SidebarConfig formaat */
function toSidebarConfig(
  config: DomainSidebarConfig,
  user?: { name: string; email: string },
  onSignOut?: () => void
): SidebarConfig {
  // Platte items + sectie-items samenvoegen tot een enkele navigatielijst
  const navItems = [
    ...(config.items || []).map(domainItemToSidebarItem),
    ...(config.sections || []).flatMap((section) => section.items.map(domainItemToSidebarItem)),
  ];

  return {
    branding: {
      title: config.title,
      subtitle: config.subtitle,
    },
    navigation: navItems,
    footer: {
      settingsHref: config.settingsHref,
      showAppSwitcher: true,
      userMenu: user && onSignOut ? { name: user.name, role: user.email, onSignOut } : undefined,
    },
  };
}

/** Converteert een DomainNavItem naar een Sidebar NavItem */
function domainItemToSidebarItem(item: DomainNavItem) {
  // Sidebar verwacht icon als ReactNode, niet als render-functie
  const icon = typeof item.icon === "function" ? item.icon({ active: false }) : item.icon;

  return {
    label: item.label,
    href: item.href,
    icon,
    badge: item.badge,
    description: item.description,
  };
}

// ─── DomainShell ──────────────────────────────────────────────

export function DomainShell({
  domain,
  sidebar,
  bottomNav,
  skipRoutes = [],
  theme,
  minimal = false,
  user,
  onSignOut,
  banner,
  children,
}: DomainShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Sluit mobiel menu bij route-wijziging
  useEffect(() => {
    setMobileMenuOpen(false);
    setAppSwitcherOpen(false);
  }, [pathname]);

  // Escape-toets sluit overlays
  useEffect(() => {
    if (!mobileMenuOpen && !appSwitcherOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setAppSwitcherOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileMenuOpen, appSwitcherOpen]);

  // skipRoutes check — toon alleen de children
  if (skipRoutes.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }

  const meta = APP_META[domain];

  const profile: AppSwitcherProfile | undefined =
    user && onSignOut ? { name: user.name, detail: user.email, onSignOut } : undefined;

  const wrapperProps = theme ? { "data-theme": theme } : undefined;

  // ─── Minimal mode ────────────────────────────────────
  if (minimal) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: "var(--surface-page)" }}
        {...wrapperProps}
      >
        {/* Dunne top-bar */}
        <header
          className="flex h-12 shrink-0 items-center justify-between px-4"
          style={{
            backgroundColor: "var(--surface-card)",
            borderBottom: `2px solid ${meta.accent}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: "var(--ow-oranje-500)" }}
            >
              OW
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {meta.name}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
              className="flex items-center justify-center rounded-lg p-2 transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
              aria-label="Open app switcher"
            >
              <GridIcon active={appSwitcherOpen} />
            </button>
            <div className="absolute right-0 bottom-0">
              <AppSwitcher
                open={appSwitcherOpen}
                onClose={() => setAppSwitcherOpen(false)}
                currentUrl={meta.url}
                variant="dropdown"
                profile={profile}
              />
            </div>
          </div>
        </header>

        {banner}

        <main className="flex-1">{children}</main>

        {/* Floating AppSwitcher FAB op mobile als er geen BottomNav is */}
        <div className="md:hidden">
          <FloatingAppSwitcherFab domain={domain} profile={profile} />
        </div>
      </div>
    );
  }

  // ─── Full mode ───────────────────────────────────────
  const sidebarConfig = sidebar ? toSidebarConfig(sidebar, user, onSignOut) : null;

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: "var(--surface-page)" }}
      {...wrapperProps}
    >
      {/* Desktop sidebar */}
      {sidebarConfig && (
        <div className="hidden md:block">
          <Sidebar {...sidebarConfig} />
        </div>
      )}

      {/* Mobile sidebar overlay (animated) */}
      <AnimatePresence>
        {mobileMenuOpen && sidebarConfig && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="fixed inset-0"
              style={{ backgroundColor: "var(--surface-scrim)" }}
              onClick={closeMobileMenu}
              role="presentation"
              variants={overlayBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-64"
              variants={drawerSlide("left")}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Sidebar {...sidebarConfig} onClose={closeMobileMenu} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top-bar met hamburger (alleen als sidebar is geconfigureerd) */}
        {sidebarConfig && (
          <div
            className="flex items-center px-4 py-3 md:hidden"
            style={{ borderBottom: `2px solid ${meta.accent}` }}
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span className="ml-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {sidebar?.title || meta.name}
            </span>
          </div>
        )}

        {/* Desktop top-bar zonder sidebar — minimale balk met AppSwitcher */}
        {!sidebarConfig && (
          <header
            className="hidden items-center justify-between px-6 py-3 md:flex"
            style={{ borderBottom: `2px solid ${meta.accent}` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: "var(--ow-oranje-500)" }}
              >
                OW
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {meta.name}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                className="flex items-center justify-center rounded-lg p-2 transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
                aria-label="Open app switcher"
              >
                <GridIcon active={appSwitcherOpen} />
              </button>
              <div className="absolute right-0 bottom-0">
                <AppSwitcher
                  open={appSwitcherOpen}
                  onClose={() => setAppSwitcherOpen(false)}
                  currentUrl={meta.url}
                  variant="dropdown"
                  profile={profile}
                />
              </div>
            </div>
          </header>
        )}

        {banner}

        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: bottomNav
              ? "calc(3.5rem + env(safe-area-inset-bottom, 0px))"
              : undefined,
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile BottomNav met AppSwitcher als 5e knop */}
      {bottomNav && (
        <div className="md:hidden">
          <BottomNavShell items={bottomNav} domain={domain} profile={profile} />
        </div>
      )}

      {/* Floating AppSwitcher FAB als er geen sidebar EN geen BottomNav is op mobile */}
      {!sidebarConfig && !bottomNav && (
        <div className="md:hidden">
          <FloatingAppSwitcherFab domain={domain} profile={profile} />
        </div>
      )}
    </div>
  );
}
