"use client";

import { signOut } from "next-auth/react";

// ── App-definitie ──────────────────────────────────────────────

interface AppDef {
  naam: string;
  beschrijving: string;
  route: string;
  accent: string;
  rollen: string[];
  initialen: string;
}

const APPS: AppDef[] = [
  {
    naam: "Monitor",
    beschrijving: "Dashboards en signalering",
    route: "/monitor",
    accent: "#22c55e",
    rollen: ["EDITOR", "REVIEWER", "VIEWER"],
    initialen: "MO",
  },
  {
    naam: "Team-Indeling",
    beschrijving: "Seizoensindeling en scenario's",
    route: "/ti-studio",
    accent: "#3b82f6",
    rollen: ["EDITOR", "REVIEWER", "VIEWER"],
    initialen: "TI",
  },
  {
    naam: "Evaluatie",
    beschrijving: "Spelerevaluaties en zelfevaluaties",
    route: "/evaluatie",
    accent: "#eab308",
    rollen: ["EDITOR", "REVIEWER"],
    initialen: "EV",
  },
  {
    naam: "Scouting",
    beschrijving: "Spelers scouten en beoordelen",
    route: "/scouting",
    accent: "#ff6b00",
    rollen: ["EDITOR", "SCOUT"],
    initialen: "SC",
  },
  {
    naam: "Beheer",
    beschrijving: "TC beheerpaneel",
    route: "/beheer",
    accent: "#9ca3af",
    rollen: ["EDITOR"],
    initialen: "BH",
  },
];

// ── Component ──────────────────────────────────────────────────

interface AppLauncherProps {
  userName: string;
  userRole: string;
}

export function AppLauncher({ userName, userRole }: AppLauncherProps) {
  const visibleApps = APPS.filter((app) => app.rollen.includes(userRole));

  return (
    <main className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mx-auto w-full max-w-3xl px-6 pt-12 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              c.k.v. Oranje Wit
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
              Kies je app
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {userName}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {/* ── App-tegels ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {visibleApps.map((app, i) => (
            <a
              key={app.naam}
              href={app.route}
              className={`app-tile animate-fade-in animate-delay-${i + 1}`}
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
                {app.initialen}
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
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mx-auto w-full max-w-3xl px-6 pb-8">
        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
          c.k.v. Oranje Wit &middot; Seizoen 2025-2026 &middot; Dordrecht
        </p>
      </footer>
    </main>
  );
}
