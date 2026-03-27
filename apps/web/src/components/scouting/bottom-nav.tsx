"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSwitcher, HomeIcon, SearchIcon, ListIcon, ProfileIcon, GridIcon } from "@oranje-wit/ui";

const navItems = [
  { href: "/scouting", label: "Home", icon: HomeIcon },
  { href: "/scouting/verzoeken", label: "Verzoeken", icon: ListIcon },
  { href: "/scouting/zoek", label: "Zoeken", icon: SearchIcon },
  { href: "/scouting/profiel", label: "Profiel", icon: ProfileIcon },
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
            const isActive =
              item.href === "/scouting" ? pathname === "/scouting" : pathname.startsWith(item.href);
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
            <GridIcon active={appSwitcherOpen} />
            <span className="font-medium">Apps</span>
          </button>
        </div>
      </nav>

      <AppSwitcher open={appSwitcherOpen} onClose={() => setAppSwitcherOpen(false)} />
    </>
  );
}
