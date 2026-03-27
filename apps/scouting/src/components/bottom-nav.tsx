"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSwitcher } from "@oranje-wit/ui";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/verzoeken", label: "Verzoeken", icon: VerzoekIcon },
  { href: "/zoek", label: "Zoeken", icon: ScoutIcon },
  { href: "/profiel", label: "Profiel", icon: ProfileIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface-card) 92%, transparent)",
          borderColor: "var(--border-default)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[2.75rem] min-w-[2.75rem] flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors duration-200"
                style={{
                  color: isActive ? "var(--ow-oranje-500)" : "var(--text-tertiary)",
                }}
              >
                <Icon active={isActive} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Apps knop */}
          <button
            onClick={() => setAppSwitcherOpen(true)}
            className="flex min-h-[2.75rem] min-w-[2.75rem] flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors duration-200"
            style={{ color: appSwitcherOpen ? "var(--ow-oranje-500)" : "var(--text-tertiary)" }}
            aria-label="Apps"
          >
            <AppsGridIcon active={appSwitcherOpen} />
            <span className="font-medium">Apps</span>
          </button>
        </div>
      </nav>

      <AppSwitcher open={appSwitcherOpen} onClose={() => setAppSwitcherOpen(false)} />
    </>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <path d="M3 12l9-8 9 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScoutIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function VerzoekIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
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

function AppsGridIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
    </svg>
  );
}
