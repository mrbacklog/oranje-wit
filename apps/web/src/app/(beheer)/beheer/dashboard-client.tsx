"use client";

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
import { DomeinKaart, type DomeinModule } from "@/components/beheer/domein-kaart";

// ── Module-definities (3-status systeem) ──────────────────────

const modules: DomeinModule[] = [
  // ─ Actief ─
  {
    titel: "Jeugdontwikkeling",
    beschrijving: "Vaardigheidsraamwerk, progressie, USS",
    href: "/beheer/jeugd/raamwerk",
    Icon: ClipboardIcon,
    status: "actief",
    accent: "var(--ow-oranje-500)",
  },
  // ─ In opbouw ─
  {
    titel: "Jaarplanning",
    beschrijving: "Seizoenen, mijlpalen en checklists",
    href: "/beheer/jaarplanning/kalender",
    Icon: CalendarIcon,
    status: "in-opbouw",
    accent: "var(--knkv-blauw-500)",
  },
  {
    titel: "Teams & Leden",
    beschrijving: "Teamsamenstelling, Sportlink sync",
    href: "/beheer/teams",
    Icon: UsersIcon,
    status: "in-opbouw",
    accent: "var(--knkv-groen-500)",
  },
  {
    titel: "Roostering",
    beschrijving: "Training- en wedstrijdschema",
    href: "/beheer/roostering/trainingen",
    Icon: FlagIcon,
    status: "in-opbouw",
    accent: "var(--knkv-blauw-400)",
  },
  {
    titel: "Evaluatie",
    beschrijving: "Rondes, coordinatoren, templates",
    href: "/beheer/evaluatie/rondes",
    Icon: DocumentEditIcon,
    status: "in-opbouw",
    accent: "var(--knkv-geel-500)",
  },
  // ─ Gepland ─
  {
    titel: "Scouting",
    beschrijving: "Scout-accounts en voortgang",
    href: "/beheer/scouting/scouts",
    Icon: SearchIcon,
    status: "gepland",
    accent: "var(--knkv-oranje-500)",
  },
  {
    titel: "Werving",
    beschrijving: "Aanmeldingen en opvolging",
    href: "/beheer/werving/aanmeldingen",
    Icon: UserPlusIcon,
    status: "gepland",
    accent: "var(--knkv-groen-400)",
  },
  {
    titel: "Systeem",
    beschrijving: "Gebruikers, rollen, import",
    href: "/beheer/systeem/gebruikers",
    Icon: UserIcon,
    status: "gepland",
    accent: "var(--text-secondary)",
  },
  {
    titel: "Archivering",
    beschrijving: "Teamhistorie en resultaten",
    href: "/beheer/archief/teams",
    Icon: BookStackIcon,
    status: "gepland",
    accent: "var(--text-tertiary)",
  },
];

// ── Props ─────────────────────────────────────────────────────

interface DashboardStats {
  actiefSeizoen: string;
  ledenCount: number;
  teamsCount: number;
  raamwerkNaam: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
}

// ── Component ─────────────────────────────────────────────────

export function DashboardClient({ stats }: DashboardClientProps) {
  const raamwerkLabel = stats.raamwerkNaam.replace("Vaardigheidsraamwerk ", "v");

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          TC Beheer
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Het bureau van de technische commissie
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-card">
          <div className="stat-value">{stats.actiefSeizoen}</div>
          <div className="stat-label">Actief seizoen</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.ledenCount}</div>
          <div className="stat-label">Leden (seizoen)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--ow-oranje-500)" }}>
            {stats.teamsCount}
          </div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-value stat-value--small"
            style={{ color: "var(--color-success-500)" }}
          >
            {raamwerkLabel}
          </div>
          <div className="stat-label">Raamwerk</div>
        </div>
      </div>

      {/* Domein-kaarten grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <DomeinKaart key={m.href} module={m} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          c.k.v. Oranje Wit &middot; Seizoen {stats.actiefSeizoen}
        </p>
      </div>
    </div>
  );
}
