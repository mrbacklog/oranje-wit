"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { easeFast } from "../motion/variants";

// ─── Types ──────────────────────────────────────────────────────

export interface PillItem {
  label: string;
  href: string;
}

export interface PillsProps {
  items: PillItem[];
  /** Domein-accent kleur voor de actieve pill (bijv. "#22c55e") */
  accentColor?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Bepaal of een pill actief is op basis van het huidige pad.
 * Ondersteunt zowel gewone paden als query-parameter pills (bijv. "?tab=kaders").
 */
function isPillActive(pillHref: string, pathname: string): boolean {
  // Splits href in pad en query
  const [pillPath, pillQuery] = pillHref.split("?");

  // Als de pill een query-parameter heeft, match exact op pad + query
  if (pillQuery) {
    // In Next.js usePathname() geeft alleen het pad (zonder query).
    // We matchen op het pad-gedeelte. De component die Pills rendert
    // moet dan zelf de juiste pill activeren via een search param.
    // Fallback: match op het pad als de query niet beschikbaar is.
    return pathname === pillPath || pathname.startsWith(pillPath + "/");
  }

  // Exacte match of child-route match
  return pathname === pillPath || pathname.startsWith(pillPath + "/");
}

// ─── Component ──────────────────────────────────────────────────

export function Pills({ items, accentColor = "var(--ow-oranje-500)" }: PillsProps) {
  const pathname = usePathname();

  // Bepaal welke pill actief is — eerste match wint
  const activeIndex = items.findIndex((item) => isPillActive(item.href, pathname));

  return (
    <nav
      className="sticky top-14 z-30 border-b"
      style={{
        backgroundColor: "color-mix(in srgb, var(--surface-page) 85%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "var(--border-default)",
      }}
      aria-label="Sub-navigatie"
    >
      <div className="mx-auto flex max-w-lg items-center px-4">
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-h-[2.75rem] flex-1 items-center justify-center px-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive ? accentColor : "var(--text-tertiary)",
              }}
            >
              <span className="relative z-10">{item.label}</span>

              {/* Actieve underline indicator met layoutId voor smooth animatie */}
              {isActive && (
                <motion.span
                  layoutId="pills-active-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  transition={easeFast}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
