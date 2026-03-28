"use client";

import { signOut } from "next-auth/react";
import { APP_ICONS, type AppId } from "@oranje-wit/ui";

// ── App-definities ───────────────────────────────────────────────

interface AppDef {
  naam: string;
  beschrijving: string;
  route: string;
  accent: string;
  appId: AppId;
  zichtbaar: (cap: UserCapabilities) => boolean;
}

interface UserCapabilities {
  isTC: boolean;
  isScout: boolean;
  doelgroepen: string[];
}

const APPS: AppDef[] = [
  {
    naam: "Monitor",
    beschrijving: "Dashboards en signalering",
    route: "/monitor",
    accent: "#22c55e",
    appId: "monitor",
    zichtbaar: (cap) => cap.isTC,
  },
  {
    naam: "Team-Indeling",
    beschrijving: "Teams, spelers en scenario's bekijken",
    route: "/teamindeling",
    accent: "#3b82f6",
    appId: "team-indeling",
    zichtbaar: (cap) => cap.isTC || cap.doelgroepen.length > 0,
  },
  {
    naam: "TI Studio",
    beschrijving: "Scenario's maken en bewerken",
    route: "/ti-studio",
    accent: "#6366f1",
    appId: "team-indeling",
    zichtbaar: (cap) => cap.isTC,
  },
  {
    naam: "Evaluatie",
    beschrijving: "Spelerevaluaties en zelfevaluaties",
    route: "/evaluatie",
    accent: "#eab308",
    appId: "evaluatie",
    zichtbaar: () => true,
  },
  {
    naam: "Scouting",
    beschrijving: "Spelers scouten en beoordelen",
    route: "/scouting",
    accent: "#ff6b00",
    appId: "scouting",
    zichtbaar: (cap) => cap.isTC || cap.isScout,
  },
  {
    naam: "Beheer",
    beschrijving: "TC beheerpaneel",
    route: "/beheer",
    accent: "#9ca3af",
    appId: "beheer",
    zichtbaar: (cap) => cap.isTC,
  },
];

// ── Component ────────────────────────────────────────────────────

interface AppGridProps {
  isTC: boolean;
  isScout: boolean;
  doelgroepen: string[];
  userName: string;
}

export function AppGrid({ isTC, isScout, doelgroepen, userName }: AppGridProps) {
  const cap: UserCapabilities = { isTC, isScout, doelgroepen };
  const visibleApps = APPS.filter((app) => app.zichtbaar(cap));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleApps.map((app) => (
          <a
            key={app.naam}
            href={app.route}
            className="app-tile"
            style={{ "--tile-accent": app.accent } as React.CSSProperties}
          >
            {/* Glow */}
            <div className="app-tile-glow" />

            {/* Icoon */}
            <div
              className="app-tile-icon"
              style={{
                background: `linear-gradient(135deg, ${app.accent}, color-mix(in srgb, ${app.accent} 70%, white))`,
                boxShadow: `0 4px 12px color-mix(in srgb, ${app.accent} 30%, transparent)`,
              }}
            >
              {(() => {
                const Icon = APP_ICONS[app.appId];
                return <Icon size="sm" accent={false} />;
              })()}
            </div>

            {/* Tekst */}
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {app.naam}
              </div>
              <div
                className="mt-0.5 text-xs leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                {app.beschrijving}
              </div>
            </div>
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
