"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: (props: { active: boolean }) => ReactNode;
}

export interface BottomNavProps {
  /** 4 in-app navigatie items */
  items: NavItem[];
  /** Optioneel: 5e knop (App Grid) — render als children */
  children?: ReactNode;
}

export function BottomNav({ items, children }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, var(--surface-card) 92%, transparent)",
        borderColor: "var(--border-default)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Hoofdnavigatie"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[2.75rem] min-w-[2.75rem] flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors duration-200"
              style={{
                color: isActive ? "var(--ow-oranje-500)" : "var(--text-tertiary)",
              }}
            >
              {item.icon({ active: isActive })}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        {children}
      </div>
    </nav>
  );
}

// ─── Gedeelde Icons ─────────────────────────────────────────────

export function HomeIcon({ active }: { active: boolean }) {
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

export function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function ListIcon({ active }: { active: boolean }) {
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

export function PeopleIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <circle cx="9" cy="7" r="3" stroke="currentColor" />
      <path d="M3 21v-1a6 6 0 0112 0v1" stroke="currentColor" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" />
      <path d="M21 21v-.5a4 4 0 00-4-4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIcon({ active }: { active: boolean }) {
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

export function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <path d="M3 3v18h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M7 14l4-4 4 4 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GridIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
    </svg>
  );
}

export function CompareIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <rect x="3" y="3" width="8" height="18" rx="1" stroke="currentColor" />
      <rect x="13" y="3" width="8" height="18" rx="1" stroke="currentColor" />
      <path d="M7 8h0M17 8h0M7 12h0M17 12h0" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
