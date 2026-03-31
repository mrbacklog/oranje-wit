"use client";

/**
 * AppGridCompact — compact 3-koloms app grid voor de Overzicht-pagina.
 * Toont alleen icoon + korte naam, zonder beschrijving.
 */

import { signOut } from "next-auth/react";
import { APP_ICONS, type AppId } from "@oranje-wit/ui";

// ── App-definities ────────────────────────────────────────────

interface AppDef {
  naam: string;
  route: string;
  accent: string;
  appId: AppId;
  zichtbaar: (cap: UserCap) => boolean;
}

interface UserCap {
  isTC: boolean;
  isScout: boolean;
  doelgroepen: string[];
}

const APPS: AppDef[] = [
  {
    naam: "Monitor",
    route: "/monitor",
    accent: "#22c55e",
    appId: "monitor",
    zichtbaar: (c) => c.isTC,
  },
  {
    naam: "Teams",
    route: "/teamindeling",
    accent: "#3b82f6",
    appId: "team-indeling",
    zichtbaar: (c) => c.isTC || c.doelgroepen.length > 0,
  },
  {
    naam: "TI Studio",
    route: "/ti-studio",
    accent: "#6366f1",
    appId: "team-indeling",
    zichtbaar: (c) => c.isTC,
  },
  {
    naam: "Evaluatie",
    route: "/evaluatie",
    accent: "#eab308",
    appId: "evaluatie",
    zichtbaar: () => true,
  },
  {
    naam: "Scouting",
    route: "/scouting",
    accent: "#ff6b00",
    appId: "scouting",
    zichtbaar: (c) => c.isTC || c.isScout,
  },
  {
    naam: "Beheer",
    route: "/beheer",
    accent: "#9ca3af",
    appId: "beheer",
    zichtbaar: (c) => c.isTC,
  },
  {
    naam: "Beleid",
    route: "/beleid",
    accent: "#a855f7",
    appId: "beleid",
    zichtbaar: (c) => c.isTC,
  },
];

// ── Component ─────────────────────────────────────────────────

interface AppGridCompactProps {
  isTC: boolean;
  isScout: boolean;
  doelgroepen: string[];
  userName: string;
}

export function AppGridCompact({ isTC, isScout, doelgroepen, userName }: AppGridCompactProps) {
  const cap: UserCap = { isTC, isScout, doelgroepen };
  const visible = APPS.filter((app) => app.zichtbaar(cap));

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {visible.map((app, i) => (
          <a
            key={app.naam}
            href={app.route}
            className={`app-tile animate-fade-in flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-transform hover:scale-[1.02] active:scale-[0.98] ${
              i < 3 ? `animate-fade-in-delay-${i + 7}` : ""
            }`}
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              textDecoration: "none",
              minHeight: "44px",
            }}
          >
            {/* Icoon */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${app.accent}, color-mix(in srgb, ${app.accent} 70%, white))`,
                boxShadow: `0 2px 8px color-mix(in srgb, ${app.accent} 25%, transparent)`,
              }}
            >
              {(() => {
                const Icon = APP_ICONS[app.appId];
                return <Icon size="sm" accent={false} />;
              })()}
            </div>

            {/* Label */}
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {app.naam}
            </span>
          </a>
        ))}
      </div>

      {/* Uitloggen */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {userName}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            color: "var(--text-secondary)",
            backgroundColor: "var(--surface-elevated, var(--surface-raised))",
            border: "1px solid var(--border-default)",
          }}
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
}
