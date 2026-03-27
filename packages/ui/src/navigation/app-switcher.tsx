"use client";

import { type ReactNode } from "react";

export interface AppInfo {
  /** App naam (bijv. "Scouting") */
  name: string;
  /** Korte beschrijving (bijv. "Jeugdscouting") */
  description: string;
  /** URL van de app (bijv. "https://scout.ckvoranjewit.app") */
  url: string;
  /** Icon component */
  icon: ReactNode;
  /** Accentkleur voor de icon-achtergrond */
  color?: string;
  /** Is dit de huidige app? */
  active?: boolean;
}

const defaultApps: AppInfo[] = [
  {
    name: "Scout",
    description: "Jeugdscouting",
    url: "https://scout.ckvoranjewit.app",
    icon: <ScoutAppIcon />,
    color: "#ff6b00",
  },
  {
    name: "Teams",
    description: "Teamindeling",
    url: "https://teamindeling.ckvoranjewit.app",
    icon: <TeamsAppIcon />,
    color: "#3b82f6",
  },
  {
    name: "Evaluatie",
    description: "Spelerevaluaties",
    url: "https://evaluatie.ckvoranjewit.app",
    icon: <EvaluatieAppIcon />,
    color: "#eab308",
  },
  {
    name: "Monitor",
    description: "Verenigingsmonitor",
    url: "https://monitor.ckvoranjewit.app",
    icon: <MonitorAppIcon />,
    color: "#22c55e",
  },
  {
    name: "Beheer",
    description: "TC Beheer",
    url: "https://beheer.ckvoranjewit.app",
    icon: <BeheerAppIcon />,
    color: "#9ca3af",
  },
];

export interface AppSwitcherProps {
  /** Override de standaard app-lijst */
  apps?: AppInfo[];
  /** Huidige app identifier (matched op url) */
  currentUrl?: string;
  /** Callback wanneer de switcher gesloten wordt */
  onClose: () => void;
  /** Is de switcher open? */
  open: boolean;
}

export function AppSwitcher({ apps = defaultApps, currentUrl, onClose, open }: AppSwitcherProps) {
  if (!open) return null;

  const currentHost = currentUrl || (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "var(--surface-scrim)" }}
        onClick={onClose}
        role="presentation"
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl px-6 pt-4 pb-10"
        style={{
          backgroundColor: "var(--surface-raised)",
          paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))",
        }}
        role="dialog"
        aria-label="App switcher"
      >
        {/* Handle */}
        <div
          className="mx-auto mb-6 h-1 w-10 rounded-full"
          style={{ backgroundColor: "var(--border-strong)" }}
        />

        {/* App Grid */}
        <div className="grid grid-cols-3 gap-4">
          {apps.map((app) => {
            const isActive = currentHost.includes(new URL(app.url).hostname);
            return (
              <a
                key={app.url}
                href={app.url}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors duration-200"
                style={{
                  backgroundColor: isActive ? "var(--state-selected)" : "transparent",
                }}
                onClick={onClose}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                  style={{
                    background: `linear-gradient(135deg, ${app.color || "#ff6b00"}, color-mix(in srgb, ${app.color || "#ff6b00"} 70%, black))`,
                  }}
                >
                  {app.icon}
                </div>
                <div className="text-center">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: isActive ? "var(--ow-oranje-500)" : "var(--text-primary)" }}
                  >
                    {app.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {app.description}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── App Icons ──────────────────────────────────────────────────

function ScoutAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="7" stroke="white" />
      <path d="M21 21l-4.35-4.35" stroke="white" strokeLinecap="round" />
      <circle cx="11" cy="11" r="2" stroke="white" />
    </svg>
  );
}

function TeamsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" strokeWidth={1.8}>
      <circle cx="9" cy="7" r="3" stroke="white" />
      <path d="M3 21v-1a6 6 0 0112 0v1" stroke="white" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="white" />
      <path d="M21 21v-.5a4 4 0 00-4-4" stroke="white" strokeLinecap="round" />
    </svg>
  );
}

function EvaluatieAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" strokeWidth={1.8}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MonitorAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" strokeWidth={1.8}>
      <path d="M3 3v18h18" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14l4-4 4 4 5-5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BeheerAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" stroke="white" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
