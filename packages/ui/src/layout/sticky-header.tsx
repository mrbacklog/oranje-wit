"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────

export interface StickyHeaderProps {
  title: string;
  subtitle?: string;
  /** Actie-knoppen rechts van de titel */
  actions?: ReactNode;
  /** Pagina-content onder de header */
  children: ReactNode;
}

// ─── Component ──────────────────────────────────────────────────

export function StickyHeader({ title, subtitle, actions, children }: StickyHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!sentinelRef.current) return;
    const rect = sentinelRef.current.getBoundingClientRect();
    setCollapsed(rect.bottom <= 0);
  }, []);

  // IntersectionObserver voor performante scroll-detectie
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Fallback: als IO niet beschikbaar is (SSR), gebruik scroll
    if (typeof IntersectionObserver === "undefined") {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCollapsed(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleScroll]);

  return (
    <>
      {/* Sticky bar */}
      <div
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: collapsed ? "rgba(15, 17, 21, 0.85)" : "transparent",
          backdropFilter: collapsed ? "blur(20px)" : "none",
          WebkitBackdropFilter: collapsed ? "blur(20px)" : "none",
          borderBottom: collapsed ? "1px solid var(--border-default)" : "1px solid transparent",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between transition-all duration-300"
          style={{
            maxWidth: "1200px",
            padding: collapsed ? "0.625rem 1.5rem" : "1.5rem 1.5rem 0",
          }}
        >
          <div className="min-w-0 flex-1">
            <h1
              className="truncate font-bold transition-all duration-300"
              style={{
                color: "var(--text-primary)",
                fontSize: collapsed ? "1rem" : "1.5rem",
                lineHeight: collapsed ? "1.5" : "1.3",
              }}
            >
              {title}
            </h1>
            {/* Subtitle — verborgen in collapsed */}
            {subtitle && (
              <p
                className="mt-0.5 truncate text-sm transition-all duration-300"
                style={{
                  color: "var(--text-tertiary)",
                  opacity: collapsed ? 0 : 1,
                  maxHeight: collapsed ? 0 : "2rem",
                  overflow: "hidden",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && <div className="ml-4 flex flex-shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Sentinel — als deze uit beeld scrollt, wordt de header compact */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* Content */}
      {children}
    </>
  );
}
