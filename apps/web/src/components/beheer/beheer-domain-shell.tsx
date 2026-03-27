"use client";

import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { DomainShell, type DomainNavSection, type DomainNavItem } from "@oranje-wit/ui";
import {
  HomeIcon,
  CalendarIcon,
  CheckCircleIcon,
  FlagIcon,
  TrophyIcon,
  UsersIcon,
  SyncIcon,
  ClipboardIcon,
  TrendUpIcon,
  BarChartIcon,
  SearchIcon,
  DocumentEditIcon,
  TargetIcon,
  EnvelopeIcon,
  UserPlusIcon,
  FunnelIcon,
  UserIcon,
  InboxDownIcon,
  BookStackIcon,
  AwardIcon,
} from "./icons";

// ─── Dashboard item (los, boven de secties) ──────────────────
const dashboardItem: DomainNavItem = {
  label: "Dashboard",
  href: "/beheer",
  icon: <HomeIcon className="h-[18px] w-[18px]" />,
};

// ─── Navigatie-secties (9 domeinen, gegroepeerd) ─────────────
const beheerSections: DomainNavSection[] = [
  {
    title: "Planning",
    items: [
      {
        label: "Jaarkalender",
        href: "/beheer/jaarplanning/kalender",
        icon: <CalendarIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Mijlpalen",
        href: "/beheer/jaarplanning/mijlpalen",
        icon: <CheckCircleIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Trainingen",
        href: "/beheer/roostering/trainingen",
        icon: <FlagIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Wedstrijden",
        href: "/beheer/roostering/wedstrijden",
        icon: <TrophyIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "Teams",
    items: [
      {
        label: "Overzicht",
        href: "/beheer/teams",
        icon: <UsersIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Sportlink Sync",
        href: "/beheer/teams/sync",
        icon: <SyncIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "Jeugd",
    items: [
      {
        label: "Raamwerk",
        href: "/beheer/jeugd/raamwerk",
        icon: <ClipboardIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Progressie",
        href: "/beheer/jeugd/progressie",
        icon: <TrendUpIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "USS-parameters",
        href: "/beheer/jeugd/uss",
        icon: <BarChartIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "Beoordeling",
    items: [
      {
        label: "Scouts",
        href: "/beheer/scouting/scouts",
        icon: <SearchIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Rondes",
        href: "/beheer/evaluatie/rondes",
        icon: <DocumentEditIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Coordinatoren",
        href: "/beheer/evaluatie/coordinatoren",
        icon: <TargetIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Templates",
        href: "/beheer/evaluatie/templates",
        icon: <EnvelopeIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "Groei",
    items: [
      {
        label: "Aanmeldingen",
        href: "/beheer/werving/aanmeldingen",
        icon: <UserPlusIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Funnel",
        href: "/beheer/werving/funnel",
        icon: <FunnelIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "Systeem",
    items: [
      {
        label: "Gebruikers",
        href: "/beheer/systeem/gebruikers",
        icon: <UserIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Import",
        href: "/beheer/systeem/import",
        icon: <InboxDownIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "Archief",
    items: [
      {
        label: "Teamhistorie",
        href: "/beheer/archief/teams",
        icon: <BookStackIcon className="h-[18px] w-[18px]" />,
      },
      {
        label: "Resultaten",
        href: "/beheer/archief/resultaten",
        icon: <AwardIcon className="h-[18px] w-[18px]" />,
      },
    ],
  },
];

// ─── BeheerDomainShell ──────────────────────────────────────
export function BeheerDomainShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const user = session?.user
    ? { name: session.user.name ?? "Gebruiker", email: session.user.email ?? "" }
    : undefined;

  return (
    <DomainShell
      domain="beheer"
      sidebar={{
        title: "TC Beheer",
        subtitle: "c.k.v. Oranje Wit",
        items: [dashboardItem],
        sections: beheerSections,
      }}
      user={user}
      onSignOut={() => signOut()}
      skipRoutes={["/login"]}
    >
      {children}
    </DomainShell>
  );
}
