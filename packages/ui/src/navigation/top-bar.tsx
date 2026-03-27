"use client";

import { type ReactNode } from "react";

export interface TopBarProps {
  /** Paginatitel */
  title: string;
  /** Optioneel subtitel of broodkruimel */
  subtitle?: string;
  /** Terug-knop handler — als undefined, geen terug-knop */
  onBack?: () => void;
  /** Actieknoppen rechts */
  actions?: ReactNode;
  /** Extra CSS classes */
  className?: string;
}

export function TopBar({ title, subtitle, onBack, actions, className = "" }: TopBarProps) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--surface-page) 85%, transparent)",
        borderColor: "var(--border-default)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-xl transition-colors duration-200"
            style={{ color: "var(--ow-oranje-500)" }}
            aria-label="Terug"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={2}>
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          {subtitle && (
            <span className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
              {subtitle}
            </span>
          )}
        </div>

        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}
