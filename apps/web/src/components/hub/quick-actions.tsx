/**
 * QuickActions — contextafhankelijke actieknoppen per rol.
 * Server component. Maximaal 3 acties, altijd relevant.
 */

import type { ReactNode } from "react";

// ── Inline SVG iconen (geen lucide-react dependency) ────────────

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ClipboardIcon() {
  return (
    <svg {...svgProps}>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg {...svgProps}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...svgProps}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...svgProps}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

// ── Types ───────────────────────────────────────────────────────

interface Actie {
  label: string;
  sublabel?: string;
  href: string;
  accent: string;
  icoon: ReactNode;
}

interface QuickActionsProps {
  isTC: boolean;
  isScout: boolean;
  doelgroepen: string[];
  tellingen: {
    evaluaties: number;
    verzoeken: number;
    signaleringen: number;
    actiepunten: number;
    zelfevaluaties: number;
  };
}

// ── Acties per rol ──────────────────────────────────────────────

function bepaalActies(props: QuickActionsProps): Actie[] {
  const { isTC, isScout, tellingen } = props;
  const acties: Actie[] = [];

  if (isTC) {
    if (tellingen.evaluaties > 0) {
      acties.push({
        label: "Evaluaties beheren",
        sublabel: `${tellingen.evaluaties} openstaand`,
        href: "/evaluatie",
        accent: "#eab308",
        icoon: <ClipboardIcon />,
      });
    }
    acties.push({
      label: "Team-indeling",
      href: "/ti-studio",
      accent: "#3b82f6",
      icoon: <GridIcon />,
    });
    if (tellingen.signaleringen > 0) {
      acties.push({
        label: "Monitor",
        sublabel: `${tellingen.signaleringen} signalen`,
        href: "/monitor",
        accent: "#22c55e",
        icoon: <ChartIcon />,
      });
    }
    return acties.slice(0, 3);
  }

  if (isScout) {
    if (tellingen.verzoeken > 0) {
      acties.push({
        label: "Scouting-opdracht",
        sublabel: `${tellingen.verzoeken} openstaand`,
        href: "/scouting",
        accent: "#ff6b00",
        icoon: <EyeIcon />,
      });
    }
    acties.push({
      label: "Speler zoeken",
      href: "/scouting/zoek",
      accent: "#ff6b00",
      icoon: <SearchIcon />,
    });
    return acties.slice(0, 3);
  }

  // Trainer / coordinator
  if (tellingen.evaluaties > 0) {
    acties.push({
      label: "Evaluatie invullen",
      sublabel: `${tellingen.evaluaties} openstaand`,
      href: "/evaluatie",
      accent: "#eab308",
      icoon: <ClipboardIcon />,
    });
  }

  if (tellingen.zelfevaluaties > 0) {
    acties.push({
      label: "Zelfevaluatie",
      sublabel: `${tellingen.zelfevaluaties} openstaand`,
      href: "/evaluatie",
      accent: "#eab308",
      icoon: <ClipboardIcon />,
    });
  }

  acties.push({
    label: "Mijn team bekijken",
    href: "/teamindeling",
    accent: "#3b82f6",
    icoon: <UsersIcon />,
  });

  return acties.slice(0, 3);
}

// ── Component ───────────────────────────────────────────────────

export function QuickActions(props: QuickActionsProps) {
  const acties = bepaalActies(props);

  if (acties.length === 0) return null;

  return (
    <section className="animate-fade-in animate-fade-in-delay-5 px-5">
      <h2
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Snelle acties
      </h2>

      <div className={`grid gap-3 ${acties.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {acties.map((actie, i) => (
          <a
            key={actie.href + actie.label}
            href={actie.href}
            className={`flex items-start gap-3 rounded-2xl p-4 transition-transform hover:scale-[1.02] active:scale-[0.98] ${
              acties.length === 3 && i === 0 ? "col-span-2" : ""
            }`}
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              textDecoration: "none",
              minHeight: "44px",
            }}
          >
            {/* Icoon cirkel */}
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${actie.accent} 12%, transparent)`,
                color: actie.accent,
              }}
            >
              {actie.icoon}
            </div>

            {/* Tekst */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {actie.label}
              </div>
              {actie.sublabel && (
                <div className="mt-0.5 text-xs font-medium" style={{ color: actie.accent }}>
                  {actie.sublabel}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
