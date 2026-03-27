"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { APP_IDS, APP_META, APP_ICONS } from "./app-icons";

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
  /** Badge-teller (bijv. aantal openstaande acties) */
  badge?: number;
}

export interface AppSwitcherProfile {
  /** Gebruikersnaam */
  name: string;
  /** Rol of e-mailadres */
  detail?: string;
  /** Uitlog callback */
  onSignOut: () => void;
}

const defaultApps: AppInfo[] = APP_IDS.map((id) => {
  const meta = APP_META[id];
  const Icon = APP_ICONS[id];
  return {
    name: meta.name,
    description: meta.description,
    url: meta.url,
    icon: <Icon size="md" accent={false} />,
    color: meta.accent,
  };
});

export interface AppSwitcherProps {
  /** Override de standaard app-lijst */
  apps?: AppInfo[];
  /** Huidige app identifier (matched op url) */
  currentUrl?: string;
  /** Callback wanneer de switcher gesloten wordt */
  onClose: () => void;
  /** Is de switcher open? */
  open: boolean;
  /** Render als dropdown ipv bottom sheet (voor desktop sidebars) */
  variant?: "sheet" | "dropdown";
  /** Gebruikersprofiel onderaan de switcher */
  profile?: AppSwitcherProfile;
}

/**
 * AppSwitcher — Schakelt tussen OW apps.
 * `sheet` variant: mobile bottom sheet (standaard).
 * `dropdown` variant: compact popup voor desktop sidebars.
 */
export function AppSwitcher({
  apps = defaultApps,
  currentUrl,
  onClose,
  open,
  variant = "sheet",
  profile,
}: AppSwitcherProps) {
  const pathname = usePathname();
  if (!open) return null;

  const currentPath = currentUrl || pathname || "";

  if (variant === "dropdown") {
    return (
      <AppSwitcherDropdown
        apps={apps}
        currentPath={currentPath}
        onClose={onClose}
        profile={profile}
      />
    );
  }

  return (
    <AppSwitcherSheet apps={apps} currentPath={currentPath} onClose={onClose} profile={profile} />
  );
}

// ─── Sheet variant (mobile bottom sheet) ─────────────────────

function AppSwitcherSheet({
  apps,
  currentPath,
  onClose,
  profile,
}: {
  apps: AppInfo[];
  currentPath: string;
  onClose: () => void;
  profile?: AppSwitcherProfile;
}) {
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
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl px-6 pt-4"
        style={{
          backgroundColor: "var(--surface-raised)",
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
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
          {apps.map((app) => (
            <AppSwitcherItem key={app.url} app={app} currentPath={currentPath} onClose={onClose} />
          ))}
        </div>

        {profile && <ProfileRow profile={profile} />}
      </div>
    </>
  );
}

// ─── Dropdown variant (desktop sidebar popup) ────────────────

function AppSwitcherDropdown({
  apps,
  currentPath,
  onClose,
  profile,
}: {
  apps: AppInfo[];
  currentPath: string;
  onClose: () => void;
  profile?: AppSwitcherProfile;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} role="presentation" />

      {/* Dropdown */}
      <div
        className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border p-3 shadow-xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderColor: "var(--border-default)",
        }}
        role="dialog"
        aria-label="App switcher"
      >
        <div
          className="mb-2 px-1 text-[11px] font-semibold tracking-wide"
          style={{ color: "var(--text-tertiary)" }}
        >
          APPS
        </div>
        <div className="grid grid-cols-1 gap-0.5">
          {apps.map((app) => {
            const isActive = matchPath(currentPath, app.url);
            return (
              <a
                key={app.url}
                href={app.url}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150"
                style={{
                  backgroundColor: isActive ? "var(--state-selected)" : "transparent",
                }}
                onClick={onClose}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{
                    background: `linear-gradient(135deg, ${app.color || "#ff6b00"}, color-mix(in srgb, ${app.color || "#ff6b00"} 70%, black))`,
                  }}
                >
                  <span className="scale-[0.65]">{app.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-sm font-medium"
                    style={{ color: isActive ? "var(--ow-oranje-500)" : "var(--text-primary)" }}
                  >
                    {app.name}
                  </div>
                  <div className="truncate text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {app.description}
                  </div>
                </div>
                {app.badge != null && app.badge > 0 ? (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--color-error-500)" }}
                  >
                    {app.badge > 99 ? "99+" : app.badge}
                  </span>
                ) : isActive ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--ow-oranje-500)" }}
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </a>
            );
          })}
        </div>

        {profile && <ProfileRow profile={profile} compact />}
      </div>
    </>
  );
}

// ─── Shared App Item (sheet variant) ─────────────────────────

function AppSwitcherItem({
  app,
  currentPath,
  onClose,
}: {
  app: AppInfo;
  currentPath: string;
  onClose: () => void;
}) {
  const isActive = matchPath(currentPath, app.url);
  const c = app.color || "#ff6b00";
  return (
    <a
      href={app.url}
      className="relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors duration-200"
      style={{ backgroundColor: isActive ? "var(--state-selected)" : "transparent" }}
      onClick={onClose}
    >
      <div className="relative">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{
            background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 70%, black))`,
            boxShadow: isActive ? `0 0 12px ${c}40` : undefined,
          }}
        >
          {app.icon}
        </div>
        <BadgeDot badge={app.badge} isActive={isActive} />
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
}

function BadgeDot({ badge, isActive }: { badge?: number; isActive: boolean }) {
  if (badge != null && badge > 0) {
    return (
      <div
        className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
        style={{ backgroundColor: "var(--color-error-500)" }}
      >
        {badge > 99 ? "99+" : badge}
      </div>
    );
  }
  if (isActive) {
    return (
      <div
        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--ow-oranje-600)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
          <path
            d="M20 6L9 17l-5-5"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return null;
}

// ─── Profiel-rij (sheet + dropdown) ──────────────────────────

function ProfileRow({ profile, compact }: { profile: AppSwitcherProfile; compact?: boolean }) {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (compact) {
    return (
      <>
        <div className="my-2" style={{ borderTop: "1px solid var(--border-light)" }} />
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            style={{ backgroundColor: "var(--ow-oranje-500)", color: "white" }}
          >
            {initials}
          </div>
          <div
            className="min-w-0 flex-1 truncate text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            {profile.name}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              profile.onSignOut();
            }}
            className="text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Uit
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ backgroundColor: "var(--surface-card)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ backgroundColor: "var(--ow-oranje-500)", color: "white" }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {profile.name}
        </div>
        {profile.detail && (
          <div className="truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {profile.detail}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          profile.onSignOut();
        }}
        className="rounded-lg px-3 py-1.5 text-xs font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        Uitloggen
      </button>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function matchPath(currentPath: string, appPath: string): boolean {
  return currentPath === appPath || currentPath.startsWith(appPath + "/");
}
