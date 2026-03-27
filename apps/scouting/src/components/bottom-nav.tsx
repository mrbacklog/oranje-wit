"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/verzoeken", label: "Verzoeken", icon: VerzoekIcon },
  { href: "/zoek", label: "Zoeken", icon: ScoutIcon },
  { href: "/profiel", label: "Profiel", icon: ProfileIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface-dark/95 fixed inset-x-0 bottom-0 z-50 border-t border-white/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`touch-target flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? "text-ow-oranje" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
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
