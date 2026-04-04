# TI-Studio Navigatie Herstructurering

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Status: AFGEROND** — 4 april 2026 (commits t/m `db0d297`)

**Goal:** De TI-studio sidebar herschikken naar vijf secties — Dashboard, Indeling, Opvolging, Personen, Kaders — en de huidige BlauwdrukTabs vervangen door losse pagina's per onderwerp.

**Architecture:** De huidige `/ti-studio/blauwdruk` pagina (met 6 inline tabs) wordt opgesplitst in vier losse routes. De sidebar-labels worden hernoemd. Bestaande componenten (BesluitenOverzicht, GezienOverzicht, CategoriePanel, WerkbordOverzicht) worden hergebruikt als page-level content — geen logica herschreven, alleen de navigatiestructuur verandert. Redirects zorgen dat oude bookmarks blijven werken.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, bestaande `@oranje-wit/ui` AppShell/SidebarConfig

---

## Begripsdefinities (voor de implementerende agent)

| Oud label | Nieuw label | Route | Wat zit erin |
|---|---|---|---|
| Indeling | **Indeling** | `/ti-studio/indeling` | Ongewijzigd — route en label blijven gelijk |
| Werkbord | **Opvolging** | `/ti-studio/opvolging` | WerkbordOverzicht + ToelichtingEditor |
| Blauwdruk (tabs: Spelers) | **Personen › Spelers** | `/ti-studio/personen/spelers` | GezienOverzicht |
| Blauwdruk (tabs: Staf) | **Personen › Staf** | `/ti-studio/personen/staf` | Staf-pagina (EmptyState, straks trainers) |
| Blauwdruk (tabs: Kaders+Teams) | **Kaders** | `/ti-studio/kaders` | BesluitenOverzicht + CategoriePanel + Pins + Uitgangspositie |
| Scenario's tab | vervalt | — | Was al alleen een link naar /indeling |

**Sidebar-volgorde (werk-first):**
```
Dashboard
Indeling       ← het werk
Opvolging      ← acties en besluiten
Personen       ← spelers, staf, pins (dynamisch tijdens indeling)
Kaders         ← beleid vooraf (statisch)
```

De route `/ti-studio/blauwdruk` blijft bestaan als redirect → `/ti-studio/kaders`.
De route `/ti-studio/werkbord` blijft bestaan als redirect → `/ti-studio/opvolging`.

---

## Bestandskaart

**Aanpassen:**
- `apps/web/src/components/teamindeling/layout/TISidebar.tsx` — sidebar nav-items hernoemd + hrefs + volgorde aangepast
- `apps/web/src/app/(teamindeling-studio)/ti-studio/blauwdruk/page.tsx` — wordt redirect naar `/ti-studio/kaders`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/werkbord/page.tsx` — wordt redirect naar `/ti-studio/opvolging`

**Aanmaken:**
- `apps/web/src/app/(teamindeling-studio)/ti-studio/opvolging/page.tsx` — WerkbordOverzicht + ToelichtingEditor
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/layout.tsx` — sub-navigatie (Spelers / Staf)
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/page.tsx` — redirect naar /personen/spelers
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/spelers/page.tsx` — GezienOverzicht
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/staf/page.tsx` — EmptyState staf
- `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/page.tsx` — BesluitenOverzicht + CategoriePanel + Pins + Uitgangspositie

**Verwijderen (na implementatie):**
- `apps/web/src/components/teamindeling/blauwdruk/BlauwdrukTabs.tsx` — vervangen door losse pagina's

---

## Task 1: Sidebar hernoemd

**Files:**
- Modify: `apps/web/src/components/teamindeling/layout/TISidebar.tsx`

- [x] **Stap 1: Pas de navigation array aan**

Vervang de volledige `navigation` array in `TISidebar.tsx`:

```typescript
navigation: [
  { label: "Dashboard", href: "/ti-studio",             icon: "🏠" },
  { label: "Indeling",  href: "/ti-studio/indeling",    icon: "🏗️" },
  { label: "Opvolging", href: "/ti-studio/opvolging",   icon: "✅" },
  { label: "Personen",  href: "/ti-studio/personen",    icon: "👥" },
  { label: "Kaders",    href: "/ti-studio/kaders",      icon: "📐" },
],
```

- [x] **Stap 2: Verifieer visueel**

Start `pnpm dev` en open `/ti-studio`. Sidebar moet tonen: Dashboard · Indeling · Opvolging · Personen · Kaders.

- [x] **Stap 3: Commit**

```bash
git add apps/web/src/components/teamindeling/layout/TISidebar.tsx
git commit -m "feat(ti-studio): herstructureer sidebar — Indeling, Opvolging, Personen, Kaders"
```

---

## Task 2: Opvolging-pagina

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/opvolging/page.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/werkbord/page.tsx`

- [x] **Stap 1: Maak de Opvolging-pagina aan**

Kopieer de inhoud van `werkbord/page.tsx` naar `opvolging/page.tsx` en pas de titel aan:

```typescript
import {
  getWerkitems,
  getWerkitemStats,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import WerkbordOverzicht from "@/components/teamindeling/werkbord/WerkbordOverzicht";
import { prisma } from "@/lib/teamindeling/db/prisma";

export const dynamic = "force-dynamic";

async function getWerkBlauwdruk() {
  return prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });
}

export default async function OpvolgingPage() {
  const blauwdruk = await getWerkBlauwdruk();

  if (!blauwdruk) {
    return (
      <div className="max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Opvolging
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Maak eerst een blauwdruk aan om opvolging te gebruiken.
          </p>
        </div>
      </div>
    );
  }

  const [werkitems, stats] = await Promise.all([
    getWerkitems(blauwdruk.id),
    getWerkitemStats(blauwdruk.id),
  ]);

  async function refreshOpvolging() {
    "use server";
    const [nieuweWerkitems, nieuweStats] = await Promise.all([
      getWerkitems(blauwdruk!.id),
      getWerkitemStats(blauwdruk!.id),
    ]);
    return { werkitems: nieuweWerkitems, stats: nieuweStats };
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Opvolging
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Acties en besluiten voor seizoen {blauwdruk.seizoen}
        </p>
      </div>
      <WerkbordOverzicht
        blauwdrukId={blauwdruk.id}
        initialWerkitems={werkitems}
        initialStats={stats}
        refreshAction={refreshOpvolging}
      />
    </div>
  );
}
```

- [x] **Stap 2: Zet `/werkbord` om naar redirect**

Vervang de volledige inhoud van `werkbord/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function WerkbordPage() {
  redirect("/ti-studio/opvolging");
}
```

- [x] **Stap 3: Verifieer**

Open `/ti-studio/opvolging` — werkitems moeten zichtbaar zijn.
Open `/ti-studio/werkbord` — moet redirecten naar opvolging.

- [x] **Stap 4: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/opvolging/page.tsx
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/werkbord/page.tsx
git commit -m "feat(ti-studio): opvolging-pagina — acties en besluiten, werkbord redirect"
```

---

## Task 3: Personen — sub-navigatie layout

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/layout.tsx`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/PersonenSubNav.tsx`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/page.tsx`

De Personen-sectie heeft twee sub-pagina's: Spelers en Staf. Een gedeelde layout toont de sub-navigatiebalk.

- [x] **Stap 1: Maak de client sub-nav component aan**

`apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/PersonenSubNav.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_NAV = [
  { label: "Spelers", href: "/ti-studio/personen/spelers" },
  { label: "Staf",    href: "/ti-studio/personen/staf" },
] as const;

export function PersonenSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-px"
      style={{ borderBottom: "1px solid var(--border-default)" }}
      aria-label="Personen sub-navigatie"
    >
      {SUB_NAV.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive ? "var(--ow-oranje-500)" : "var(--text-secondary)",
              borderBottom: isActive
                ? "2px solid var(--ow-oranje-500)"
                : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [x] **Stap 2: Maak de layout aan**

`apps/web/src/app/(teamindeling-studio)/ti-studio/personen/layout.tsx`:

```typescript
import { PersonenSubNav } from "./_components/PersonenSubNav";
import type { ReactNode } from "react";

export default function PersonenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl space-y-4">
      <PersonenSubNav />
      <div>{children}</div>
    </div>
  );
}
```

- [x] **Stap 3: Maak redirect-pagina `/personen` → `/personen/spelers`**

`apps/web/src/app/(teamindeling-studio)/ti-studio/personen/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function PersonenPage() {
  redirect("/ti-studio/personen/spelers");
}
```

- [x] **Stap 4: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/
git commit -m "feat(ti-studio): personen layout met sub-navigatie (spelers, staf)"
```

---

## Task 4: Personen › Spelers

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/spelers/page.tsx`

De Spelers-pagina toont wie welke speler al "gezien" heeft (was de "Spelers"-tab in BlauwdrukTabs met GezienOverzicht).

- [x] **Stap 1: Maak de pagina aan**

```typescript
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getBlauwdrukSpelers, getGezienVoortgang } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/gezien-actions";
import GezienOverzicht from "@/components/teamindeling/blauwdruk/GezienOverzicht";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";

export const dynamic = "force-dynamic";

export default async function PersonenSpelersPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);

  const [gezienRecords, gezienVoortgang, gezienUsers] = await Promise.all([
    getBlauwdrukSpelers(blauwdruk.id),
    getGezienVoortgang(blauwdruk.id),
    prisma.user.findMany({ select: { id: true, naam: true }, orderBy: { naam: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Spelers
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Spelersoverzicht en gezien-status voor seizoen {seizoen}
        </p>
      </div>

      <GezienOverzicht
        blauwdrukId={blauwdruk.id}
        initialRecords={gezienRecords}
        initialVoortgang={gezienVoortgang}
        users={gezienUsers}
      />
    </div>
  );
}
```

- [x] **Stap 2: Verifieer**

Open `/ti-studio/personen/spelers` — GezienOverzicht moet laden.

- [x] **Stap 3: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/spelers/page.tsx
git commit -m "feat(ti-studio): personen › spelers pagina — gezien-overzicht"
```

---

## Task 5: Personen › Staf

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/staf/page.tsx`

Staf is nu een EmptyState. De pagina is alvast aangemaakt zodat de navigatie compleet is.

- [x] **Stap 1: Maak de pagina aan**

```typescript
import { EmptyState } from "@oranje-wit/ui";

export default function PersonenStafPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Staf
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Trainers en coaches toewijzen aan teams
        </p>
      </div>

      <EmptyState
        title="Staf-module"
        description="De staf-module komt in een volgende fase. Hier kun je straks coaches en trainers toewijzen aan teams."
      />
    </div>
  );
}
```

- [x] **Stap 2: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/staf/page.tsx
git commit -m "feat(ti-studio): personen › staf pagina — placeholder"
```

---

## Task 6: Kaders — pagina (besluiten + teamstructuur)

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/page.tsx`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/_components/KadersTeamsClient.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/blauwdruk/page.tsx`

De Kaders-pagina toont besluiten, CategoriePanel (teamaantallen), Pins en Uitgangspositie vorig seizoen. Dit is één pagina zonder sub-navigatie.

- [x] **Stap 1: Maak het client-component voor Pins aan**

`apps/web/src/app/(teamindeling-studio)/ti-studio/kaders/_components/KadersTeamsClient.tsx`:

```typescript
"use client";

import { useState, useCallback, useTransition } from "react";
import { deletePin } from "@/app/(teamindeling-studio)/ti-studio/pins/actions";
import PinsOverzicht from "@/components/teamindeling/blauwdruk/PinsOverzicht";
import UitgangspositiePanel from "@/components/teamindeling/blauwdruk/UitgangspositiePanel";
import type { PinMetNamen } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import type { ReferentieTeamData, EvaluatieRondeData } from "@/components/teamindeling/blauwdruk/UitgangspositiePanel";

interface KadersTeamsClientProps {
  blauwdrukId: string;
  initialPins: PinMetNamen[];
  referentieTeams: ReferentieTeamData[];
  seizoen: string;
  evaluatieRondes: EvaluatieRondeData[];
}

export default function KadersTeamsClient({
  blauwdrukId: _blauwdrukId,
  initialPins,
  referentieTeams,
  seizoen,
  evaluatieRondes,
}: KadersTeamsClientProps) {
  const [localPins, setLocalPins] = useState(initialPins);
  const [, startTransition] = useTransition();

  const handleDeletePin = useCallback((pinId: string) => {
    setLocalPins((prev) => prev.filter((p) => p.id !== pinId));
    startTransition(() => {
      deletePin(pinId);
    });
  }, []);

  return (
    <div className="space-y-8">
      {localPins.length > 0 && (
        <div>
          <h3
            className="mb-3 text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Pins
          </h3>
          <PinsOverzicht pins={localPins} onDeletePin={handleDeletePin} />
        </div>
      )}

      <div>
        <h3
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Uitgangspositie
        </h3>
        <UitgangspositiePanel
          initialTeams={referentieTeams}
          seizoen={seizoen}
          evaluatieRondes={evaluatieRondes}
        />
      </div>
    </div>
  );
}
```

- [x] **Stap 2: Maak `kaders/page.tsx` aan**

```typescript
import { getBlauwdruk, getLedenStatistieken, getPinsVoorBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getBesluiten, getBesluitStats } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/besluit-actions";
import { getGezienVoortgang } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/gezien-actions";
import BesluitenOverzicht from "@/components/teamindeling/blauwdruk/BesluitenOverzicht";
import BlauwdrukVoortgang from "@/components/teamindeling/blauwdruk/BlauwdrukVoortgang";
import CategoriePanel from "@/components/teamindeling/blauwdruk/CategoriePanel";
import { getActiefSeizoen, vorigSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { CategorieKaders } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/categorie-kaders";
import KadersTeamsClient from "./_components/KadersTeamsClient";

export const dynamic = "force-dynamic";

export default async function KadersPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);
  const vorigSzn = vorigSeizoen(seizoen);

  const [besluitRecords, besluitStats, gezienVoortgang, statistieken, pins, referentieTeams, evaluatieRondes] =
    await Promise.all([
      getBesluiten(blauwdruk.id),
      getBesluitStats(blauwdruk.id),
      getGezienVoortgang(blauwdruk.id),
      getLedenStatistieken(),
      getPinsVoorBlauwdruk(blauwdruk.id),
      prisma.referentieTeam.findMany({
        where: { seizoen: vorigSzn },
        select: {
          id: true, naam: true, seizoen: true, teamType: true,
          niveau: true, poolVeld: true, teamscore: true, spelerIds: true,
        },
        orderBy: { naam: "asc" },
      }),
      prisma.evaluatieRonde.findMany({
        where: { seizoen: vorigSzn, type: "trainer" },
        orderBy: { ronde: "asc" },
        select: { id: true, seizoen: true, ronde: true, naam: true, status: true },
      }),
    ]);

  const kaders = (blauwdruk.kaders ?? {}) as CategorieKaders;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Kaders
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Seizoensbesluiten en teamstructuur voor seizoen {seizoen}
        </p>
      </div>

      <BlauwdrukVoortgang
        besluitStats={besluitStats}
        gezienVoortgang={gezienVoortgang}
        onNavigeerNaarTab={() => {}}
      />

      <BesluitenOverzicht
        blauwdrukId={blauwdruk.id}
        initialBesluiten={besluitRecords}
        initialStats={besluitStats}
      />

      <div>
        <h3
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Teamstructuur
        </h3>
        <CategoriePanel
          statistieken={statistieken}
          kaders={kaders}
          blauwdrukId={blauwdruk.id}
        />
      </div>

      <KadersTeamsClient
        blauwdrukId={blauwdruk.id}
        initialPins={pins}
        referentieTeams={referentieTeams}
        seizoen={seizoen}
        evaluatieRondes={evaluatieRondes}
      />
    </div>
  );
}
```

> **Note:** `onNavigeerNaarTab` is een no-op — die was voor tab-navigatie in BlauwdrukVoortgang. Aanpassen naar route-links is een toekomstige taak.

- [x] **Stap 3: Zet `/blauwdruk` om naar redirect**

Vervang de volledige inhoud van `blauwdruk/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function BlauwdrukPage() {
  redirect("/ti-studio/kaders");
}
```

- [x] **Stap 4: Verifieer**

Open `/ti-studio/kaders` — besluiten + teamstructuur moeten zichtbaar zijn.
Open `/ti-studio/blauwdruk` — moet redirecten naar kaders.

- [x] **Stap 5: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/kaders/
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/blauwdruk/page.tsx
git commit -m "feat(ti-studio): kaders pagina — besluiten, teamstructuur, pins, uitgangspositie"
```

---

## Task 7: BlauwdrukTabs verwijderen + TypeScript check

**Files:**
- Delete: `apps/web/src/components/teamindeling/blauwdruk/BlauwdrukTabs.tsx`

Nu alle tabs losse pagina's zijn en de blauwdruk-page een redirect is, kan BlauwdrukTabs weg.

- [x] **Stap 1: Verwijder het bestand**

```bash
rm apps/web/src/components/teamindeling/blauwdruk/BlauwdrukTabs.tsx
```

- [x] **Stap 2: Check of BlauwdrukTabs nog ergens geïmporteerd wordt**

```bash
grep -r "BlauwdrukTabs" apps/web/src --include="*.tsx" --include="*.ts"
```

Verwacht: geen resultaten. Als er wel resultaten zijn: verwijder die imports.

- [x] **Stap 3: TypeScript check**

```bash
pnpm --filter web typecheck
```

Verwacht: geen errors. Fix eventuele type-errors voor je commit.

- [x] **Stap 4: Commit**

```bash
git add -A
git commit -m "chore(ti-studio): verwijder BlauwdrukTabs — vervangen door losse pagina's"
```

---

## Task 9: E2E smoke tests bijwerken

**Files:**
- Modify: `e2e/` — bestaande tests die `/ti-studio/blauwdruk` of `/ti-studio/werkbord` bezoeken

- [x] **Stap 1: Zoek bestaande tests die oude routes gebruiken**

```bash
grep -r "blauwdruk\|werkbord" e2e/ --include="*.ts" -l
```

- [x] **Stap 2: Update gevonden testbestanden**

Vervang in alle gevonden bestanden:
- `"/ti-studio/blauwdruk"` → `"/ti-studio/kaders"`
- `"/ti-studio/werkbord"` → `"/ti-studio/opvolging"`

- [x] **Stap 3: Draai de E2E tests**

```bash
pnpm test:e2e
```

Verwacht: alle tests groen (of alleen failures die niets met deze routes te maken hebben).

- [x] **Stap 4: Commit**

```bash
git add e2e/
git commit -m "test(e2e): update routes na ti-studio navigatie herstructurering"
```

---

## Verificatie checklist

Na alle tasks:

- [x] `/ti-studio` — Dashboard zichtbaar
- [x] `/ti-studio/indeling` — Ongewijzigd, sidebar-label zegt "Indeling"
- [x] `/ti-studio/opvolging` — WerkbordOverzicht zichtbaar
- [x] `/ti-studio/personen` — Redirect naar `/ti-studio/personen/spelers`
- [x] `/ti-studio/personen/spelers` — GezienOverzicht zichtbaar
- [x] `/ti-studio/personen/staf` — EmptyState zichtbaar
- [x] `/ti-studio/kaders` — Besluiten + teamstructuur + pins + uitgangspositie zichtbaar
- [x] `/ti-studio/blauwdruk` — Redirect naar `/ti-studio/kaders`
- [x] `/ti-studio/werkbord` — Redirect naar `/ti-studio/opvolging`
- [x] Sub-navigatie in Personen toont actieve pagina correct
- [x] `pnpm --filter web typecheck` — geen errors
- [x] `pnpm test:e2e` — geen regressies

---

## Buiten scope (toekomstige taken)

- Staf-pagina invullen met echte trainers/coaches koppeling
- `BlauwdrukVoortgang.onNavigeerNaarTab` vervangen door echte route-navigatie
- Scenario's/varianten inline tonen in de Werkindeling-pagina
- Sidebar uitklappen voor Personen sub-items (geneste navigatie in AppShell)
