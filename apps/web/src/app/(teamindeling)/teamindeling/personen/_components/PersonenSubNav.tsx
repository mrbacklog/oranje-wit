"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_NAV = [
  { label: "Spelers", href: "/teamindeling/personen/spelers" },
  { label: "Staf", href: "/teamindeling/personen/staf" },
] as const;

export function PersonenSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-px"
      style={{ borderBottom: "1px solid var(--border-default)" }}
      aria-label="Personen sub-navigatie"
    >
      {SUB_NAV.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive ? "var(--ow-oranje-500)" : "var(--text-secondary)",
              borderBottom: isActive ? "2px solid var(--ow-oranje-500)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
