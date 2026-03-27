import Link from "next/link";
import {
  CalendarIcon,
  FlagIcon,
  UsersIcon,
  ClipboardIcon,
  SearchIcon,
  DocumentEditIcon,
  UserPlusIcon,
  UserIcon,
  BookStackIcon,
} from "@/components/beheer/icons";

// ── Module-definities ─────────────────────────────────────────

const modules = [
  {
    titel: "Jaarplanning",
    beschrijving: "Seizoenen, mijlpalen en checklists",
    href: "/jaarplanning/kalender",
    Icon: CalendarIcon,
    status: "binnenkort" as const,
    accent: "var(--knkv-blauw-500)",
  },
  {
    titel: "Roostering",
    beschrijving: "Training- en wedstrijdschema",
    href: "/roostering/trainingen",
    Icon: FlagIcon,
    status: "binnenkort" as const,
    accent: "var(--knkv-blauw-400)",
  },
  {
    titel: "Teams & Leden",
    beschrijving: "Teamsamenstelling, Sportlink sync",
    href: "/teams",
    Icon: UsersIcon,
    status: "binnenkort" as const,
    accent: "var(--knkv-groen-500)",
  },
  {
    titel: "Jeugdontwikkeling",
    beschrijving: "Vaardigheidsraamwerk, progressie, USS",
    href: "/jeugd/raamwerk",
    Icon: ClipboardIcon,
    status: "actief" as const,
    accent: "var(--ow-oranje-500)",
  },
  {
    titel: "Scouting",
    beschrijving: "Scout-accounts en voortgang",
    href: "/scouting/scouts",
    Icon: SearchIcon,
    status: "binnenkort" as const,
    accent: "var(--knkv-oranje-500)",
  },
  {
    titel: "Evaluatie",
    beschrijving: "Rondes, coordinatoren, templates",
    href: "/evaluatie/rondes",
    Icon: DocumentEditIcon,
    status: "binnenkort" as const,
    accent: "var(--knkv-geel-500)",
  },
  {
    titel: "Werving",
    beschrijving: "Aanmeldingen en opvolging",
    href: "/werving/aanmeldingen",
    Icon: UserPlusIcon,
    status: "binnenkort" as const,
    accent: "var(--knkv-groen-400)",
  },
  {
    titel: "Systeem",
    beschrijving: "Gebruikers, rollen, import",
    href: "/systeem/gebruikers",
    Icon: UserIcon,
    status: "binnenkort" as const,
    accent: "var(--text-secondary)",
  },
  {
    titel: "Archivering",
    beschrijving: "Teamhistorie en resultaten",
    href: "/archief/teams",
    Icon: BookStackIcon,
    status: "binnenkort" as const,
    accent: "var(--text-tertiary)",
  },
];

// ── Dashboard page ───────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero header */}
      <div className="animate-fade-in mb-10">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          TC Beheer
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Het bureau van de technische commissie
        </p>
      </div>

      {/* Quick stats */}
      <div className="animate-fade-in animate-fade-in-delay-1 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-card">
          <div className="stat-value">2025-2026</div>
          <div className="stat-label">Actief seizoen</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">9</div>
          <div className="stat-label">Domeinen</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--color-success-500)" }}>
            1
          </div>
          <div className="stat-label">Actief domein</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--ow-oranje-500)" }}>
            8
          </div>
          <div className="stat-label">In voorbereiding</div>
        </div>
      </div>

      {/* Domein-kaarten grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            className={`domein-card ${m.status === "actief" ? "actief" : ""} animate-fade-in animate-fade-in-delay-${i + 1}`}
          >
            {/* Accent lijn links */}
            <div className="flex items-start gap-3.5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${m.accent} 12%, transparent)`,
                  color: m.accent,
                }}
              >
                <m.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="domein-title">{m.titel}</span>
                  {m.status === "actief" ? (
                    <span className="status-badge actief">
                      <span className="status-dot" />
                      Actief
                    </span>
                  ) : (
                    <span className="status-badge binnenkort">Binnenkort</span>
                  )}
                </div>
                <p className="domein-desc">{m.beschrijving}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer hint */}
      <div className="animate-fade-in animate-fade-in-delay-9 mt-10 text-center">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          c.k.v. Oranje Wit &middot; Seizoen 2025-2026
        </p>
      </div>
    </div>
  );
}
