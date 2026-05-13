"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/personen/spelers", label: "Spelers" },
  { href: "/personen/staf", label: "Staf" },
  { href: "/personen/reserveringen", label: "Reserveringen" },
] as const;

export function PersonenSubNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: 2,
        borderBottom: "1px solid var(--border-0)",
        marginBottom: 0,
      }}
      aria-label="Personen sub-navigatie"
    >
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: isActive ? "var(--ow-accent)" : "var(--text-3)",
              textDecoration: "none",
              borderBottom: isActive ? "2px solid var(--ow-accent)" : "2px solid transparent",
              marginBottom: -1,
              transition: "color 120ms",
              cursor: "pointer",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
