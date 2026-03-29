# Team-Indeling Desktop/Mobile Scheiding — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De huidige Team-Indeling route group hernoemen naar `(teamindeling-studio)` op `/ti-studio/*`, en een nieuwe `(teamindeling)` route group aanmaken voor de dark mobile versie op `/teamindeling/*`.

**Architecture:** Twee Next.js route groups in dezelfde app, gedeelde data-laag in `src/lib/teamindeling/`. Desktop (studio) behoudt alle bestaande functionaliteit met light theme. Mobile (teamindeling) is nieuw, dark-first, read/review-focused. Middleware routeert op pad-prefix, geen subdomeinen.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Prisma (PostgreSQL), @oranje-wit/ui design system, @oranje-wit/auth (NextAuth v5)

**Spec:** `docs/specs/2026-03-28-teamindeling-scheiding-design.md`

---

## Fase 1: Hernoemen studio (geen functionaliteitswijziging)

### Task 1: Hernoem route group en pad

**Files:**
- Rename: `apps/web/src/app/(teamindeling)/` → `apps/web/src/app/(teamindeling-studio)/`
- Rename: `apps/web/src/app/(teamindeling-studio)/teamindeling/` → `apps/web/src/app/(teamindeling-studio)/ti-studio/`

- [ ] **Step 1: Hernoem de route group directory**

```bash
cd apps/web/src/app
mv "(teamindeling)" "(teamindeling-studio)"
```

- [ ] **Step 2: Hernoem de URL-subfolder**

```bash
cd apps/web/src/app/"(teamindeling-studio)"
mv teamindeling ti-studio
```

- [ ] **Step 3: Verifieer de mapstructuur**

```bash
ls -la apps/web/src/app/"(teamindeling-studio)"/ti-studio/
```

Verwacht: `page.tsx`, `blauwdruk/`, `scenarios/`, `werkbord/`, `vergelijk/`, `instellingen/`, `over/`, `design-system/`, `dashboard/`, `pins/`, `rating/`, `error.tsx`, `loading.tsx`

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/app/
git commit -m "refactor: hernoem (teamindeling) → (teamindeling-studio) met /ti-studio/ pad"
```

### Task 2: Update alle interne links in studio-componenten

**Files:**
- Modify: `apps/web/src/components/teamindeling/layout/TISidebar.tsx`
- Modify: `apps/web/src/components/teamindeling/dashboard/ScenarioStatus.tsx`
- Modify: `apps/web/src/components/teamindeling/dashboard/MijlpalenTimeline.tsx`
- Modify: `apps/web/src/components/teamindeling/blauwdruk/BlauwdrukTabs.tsx`
- Modify: `apps/web/src/components/teamindeling/scenario/mobile/MobileScenarioEditor.tsx`
- Modify: `apps/web/src/components/teamindeling/scenario/editor/EditorToolbar.tsx`

- [ ] **Step 1: Update TISidebar navigatie-links**

In `apps/web/src/components/teamindeling/layout/TISidebar.tsx`, vervang alle `/teamindeling` href's:

```typescript
navigation: [
  { label: "Dashboard", href: "/ti-studio", icon: "🏠" },
  { label: "Blauwdruk", href: "/ti-studio/blauwdruk", icon: "🗂️" },
  { label: "Werkbord", href: "/ti-studio/werkbord", icon: "📋" },
  { label: "Scenario's", href: "/ti-studio/scenarios", icon: "🏗️" },
],
footer: {
  settingsHref: "/ti-studio/instellingen",
  showAppSwitcher: true,
  // ...
},
```

- [ ] **Step 2: Update ScenarioStatus link**

In `apps/web/src/components/teamindeling/dashboard/ScenarioStatus.tsx`:
Vervang `href="/teamindeling/scenarios"` → `href="/ti-studio/scenarios"`

- [ ] **Step 3: Update MijlpalenTimeline link**

In `apps/web/src/components/teamindeling/dashboard/MijlpalenTimeline.tsx`:
Vervang `href="/teamindeling/instellingen"` → `href="/ti-studio/instellingen"`

- [ ] **Step 4: Update BlauwdrukTabs link**

In `apps/web/src/components/teamindeling/blauwdruk/BlauwdrukTabs.tsx`:
Vervang `href="/teamindeling/scenarios"` → `href="/ti-studio/scenarios"`

- [ ] **Step 5: Update MobileScenarioEditor link**

In `apps/web/src/components/teamindeling/scenario/mobile/MobileScenarioEditor.tsx`:
Vervang `href="/teamindeling/scenarios"` → `href="/ti-studio/scenarios"`

- [ ] **Step 6: Update EditorToolbar link**

In `apps/web/src/components/teamindeling/scenario/editor/EditorToolbar.tsx`:
Vervang `href="/teamindeling/scenarios"` → `href="/ti-studio/scenarios"`

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/teamindeling/
git commit -m "refactor: update alle interne links naar /ti-studio/*"
```

### Task 3: Update server action redirects

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/actions.ts`

- [ ] **Step 1: Update wizard-actions.ts redirects**

In `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions.ts`, vervang alle drie:
```typescript
redirect(`/ti-studio/scenarios/${scenario.id}`);
```
(Op regels 96, 134, en 270 — zoek op `redirect(` en vervang `/teamindeling/` → `/ti-studio/`)

- [ ] **Step 2: Update actions.ts redirect**

In `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/actions.ts`:
```typescript
redirect("/ti-studio/scenarios");
```

- [ ] **Step 3: Doorzoek op gemiste verwijzingen**

```bash
grep -r '"/teamindeling' apps/web/src/app/"(teamindeling-studio)"/ --include="*.ts" --include="*.tsx"
```

Verwacht: geen resultaten. Als er nog hits zijn, die ook bijwerken.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/"(teamindeling-studio)"/
git commit -m "refactor: update server action redirects naar /ti-studio/*"
```

### Task 4: Update portaal en proxy

**Files:**
- Modify: `apps/web/src/app/app-grid.tsx`
- Modify: `apps/web/src/proxy.ts`
- Modify: `apps/web/src/components/hub/hub-tc.tsx` (als er TI-links in staan)

- [ ] **Step 1: Update app-grid.tsx**

In `apps/web/src/app/app-grid.tsx`, wijzig de Team-Indeling app-definitie:

```typescript
{
  naam: "TI Studio",
  beschrijving: "Seizoensindeling en scenario's",
  route: "/ti-studio",
  accent: "#3b82f6",
  appId: "team-indeling",
  zichtbaar: (cap) => cap.isTC || cap.doelgroepen.length > 0,
},
```

- [ ] **Step 2: Update proxy.ts**

In `apps/web/src/proxy.ts`, wijzig de teamindeling-check naar ti-studio:

```typescript
// /ti-studio/* — TC-leden of gebruikers met doelgroepen (trainers/coordinatoren)
if (pathname.startsWith("/ti-studio")) {
  const doelgroepen = Array.isArray(token.doelgroepen) ? token.doelgroepen : [];
  if (!token.isTC && doelgroepen.length === 0) {
    return NextResponse.redirect(new URL("/?error=geen-toegang", request.url));
  }
}
```

**Laat de bestaande `/teamindeling` check staan** — die wordt straks gebruikt voor de mobile versie. Voeg de `/ti-studio` check toe als extra blok:

```typescript
// /teamindeling/* — TC-leden of gebruikers met doelgroepen (trainers/coordinatoren)
if (pathname.startsWith("/teamindeling")) {
  const doelgroepen = Array.isArray(token.doelgroepen) ? token.doelgroepen : [];
  if (!token.isTC && doelgroepen.length === 0) {
    return NextResponse.redirect(new URL("/?error=geen-toegang", request.url));
  }
}

// /ti-studio/* — TC-leden of gebruikers met doelgroepen (studio desktop)
if (pathname.startsWith("/ti-studio")) {
  const doelgroepen = Array.isArray(token.doelgroepen) ? token.doelgroepen : [];
  if (!token.isTC && doelgroepen.length === 0) {
    return NextResponse.redirect(new URL("/?error=geen-toegang", request.url));
  }
}
```

- [ ] **Step 3: Check hub-tc.tsx op TI-links**

```bash
grep -n 'teamindeling' apps/web/src/components/hub/hub-tc.tsx
```

Als er links zijn, vervang `/teamindeling` → `/ti-studio`.

- [ ] **Step 4: Doorzoek hele src op gemiste /teamindeling URL-verwijzingen**

```bash
grep -rn '"/teamindeling' apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v '(teamindeling-studio)' | grep -v 'api/teamindeling'
```

Alles wat hier uitkomt (behalve API routes — die behouden hun pad) moet bijgewerkt worden.

**Let op:** API routes onder `apps/web/src/app/api/teamindeling/` hoeven NIET hernoemd te worden. Die staan los van de route groups en worden door beide versies gebruikt.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/app-grid.tsx apps/web/src/proxy.ts apps/web/src/components/hub/
git commit -m "refactor: update portaal en proxy voor /ti-studio route"
```

### Task 5: Verifieer dat studio werkt

- [ ] **Step 1: Build de app**

```bash
pnpm build
```

Verwacht: geen errors. Als er import-fouten zijn, zijn dat gemiste verwijzingen — fix ze.

- [ ] **Step 2: Start de dev server en test**

```bash
pnpm dev
```

Open `http://localhost:3000/ti-studio` — verwacht: het bestaande TI dashboard.
Open `http://localhost:3000/ti-studio/blauwdruk` — verwacht: de blauwdruk pagina.
Open `http://localhost:3000/ti-studio/scenarios` — verwacht: scenario's overzicht.

- [ ] **Step 3: Draai bestaande tests**

```bash
pnpm test
```

Verwacht: alle tests slagen. Als tests falen door padwijzigingen, fix de test-bestanden.

- [ ] **Step 4: Commit eventuele fixes**

```bash
git add -A
git commit -m "fix: corrigeer gemiste verwijzingen na ti-studio hernoem"
```

---

## Fase 2: Mobile layout en shell

### Task 6: Maak de nieuwe (teamindeling) route group

**Files:**
- Create: `apps/web/src/app/(teamindeling)/layout.tsx`
- Create: `apps/web/src/app/(teamindeling)/teamindeling/page.tsx`

- [ ] **Step 1: Maak de route group directories**

```bash
mkdir -p apps/web/src/app/"(teamindeling)"/teamindeling
```

- [ ] **Step 2: Schrijf de mobile layout**

Create `apps/web/src/app/(teamindeling)/layout.tsx`:

```tsx
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
import { getActiefSeizoen, isWerkseizoenCheck } from "@/lib/teamindeling/seizoen";

export default async function TeamIndelingMobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }

  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <div
      data-theme="dark"
      style={{
        backgroundColor: "var(--surface-page)",
        color: "var(--text-primary)",
        minHeight: "100dvh",
      }}
    >
      <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
        {children}
      </SeizoenProvider>
    </div>
  );
}
```

- [ ] **Step 3: Schrijf een placeholder dashboard pagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

export default async function TeamIndelingMobileDashboard() {
  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        Team-Indeling
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Mobile versie — in ontwikkeling
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verifieer dat beide routes werken**

```bash
pnpm build
```

Verwacht: build slaagt. Geen route-conflicten.

```bash
pnpm dev
```

- Open `http://localhost:3000/teamindeling` → dark placeholder pagina
- Open `http://localhost:3000/ti-studio` → bestaand light dashboard

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/"(teamindeling)"/
git commit -m "feat: nieuwe (teamindeling) route group voor mobile versie"
```

### Task 7: Bouw de MobileShell component

**Files:**
- Create: `apps/web/src/components/teamindeling/mobile/MobileShell.tsx`

- [ ] **Step 1: Schrijf de MobileShell**

Create `apps/web/src/components/teamindeling/mobile/MobileShell.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { DomainShell, resolveBottomNav, TEAM_INDELING } from "@oranje-wit/ui";

const bottomNavItems = resolveBottomNav(TEAM_INDELING);

interface MobileShellProps {
  children: ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const user = session?.user
    ? {
        name: session.user.name ?? "Gebruiker",
        email: session.user.email ?? "",
      }
    : undefined;

  return (
    <DomainShell
      domain="team-indeling"
      theme="dark"
      bottomNav={bottomNavItems}
      user={user}
      onSignOut={() => signOut()}
    >
      {children}
    </DomainShell>
  );
}
```

**Opmerking:** De exacte DomainShell API en bottom-nav items moeten na implementatie door het UX-team gereviewed worden. De mobile navigatie krijgt mogelijk andere items dan de desktop (bijv. Teams, Spelers, Scenario's i.p.v. Blauwdruk, Werkbord).

- [ ] **Step 2: Integreer MobileShell in de mobile layout**

Update `apps/web/src/app/(teamindeling)/layout.tsx` — voeg SessionProvider en MobileShell toe:

```tsx
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
import { SessionProvider } from "@/components/teamindeling/providers/SessionProvider";
import { MobileShell } from "@/components/teamindeling/mobile/MobileShell";
import { getActiefSeizoen, isWerkseizoenCheck } from "@/lib/teamindeling/seizoen";

export default async function TeamIndelingMobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }

  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <div
      data-theme="dark"
      style={{
        backgroundColor: "var(--surface-page)",
        color: "var(--text-primary)",
        minHeight: "100dvh",
      }}
    >
      <SessionProvider session={session}>
        <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
          <MobileShell>{children}</MobileShell>
        </SeizoenProvider>
      </SessionProvider>
    </div>
  );
}
```

- [ ] **Step 3: Build en verifieer**

```bash
pnpm build
```

Open `http://localhost:3000/teamindeling` — verwacht: dark shell met placeholder content.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/teamindeling/mobile/ apps/web/src/app/"(teamindeling)"/
git commit -m "feat: MobileShell component met dark DomainShell"
```

### Task 8: Reorganiseer componenten-mapstructuur

**Files:**
- Create: `apps/web/src/components/teamindeling/studio/` (directory)
- Create: `apps/web/src/components/teamindeling/shared/` (directory)

- [ ] **Step 1: Maak de studio en shared directories**

```bash
mkdir -p apps/web/src/components/teamindeling/studio
mkdir -p apps/web/src/components/teamindeling/shared
```

**Belangrijk:** Verplaats in deze stap nog geen bestanden. De bestaande componenten werken in hun huidige locatie en worden door de studio-routes gebruikt. De `studio/` en `shared/` directories zijn er voor toekomstige organisatie wanneer componenten actief gedeeld of gescheiden worden.

- [ ] **Step 2: Maak een README voor de structuur**

Create `apps/web/src/components/teamindeling/README.md`:

```markdown
# Teamindeling Componenten

## Structuur

- `mobile/` — Componenten exclusief voor de mobile versie (`/teamindeling/*`)
- `studio/` — Componenten exclusief voor de desktop studio (`/ti-studio/*`)
- `shared/` — Componenten gedeeld tussen mobile en studio
- Overige mappen (blauwdruk/, scenario/, etc.) — Legacy studio-componenten, worden geleidelijk verplaatst naar `studio/`
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/teamindeling/studio/ apps/web/src/components/teamindeling/shared/ apps/web/src/components/teamindeling/README.md
git commit -m "chore: maak studio/ shared/ directories voor componentscheiding"
```

---

## Fase 3: Update portaal-links en app-grid

### Task 9: Voeg Team-Indeling mobile toe aan portaal

**Files:**
- Modify: `apps/web/src/app/app-grid.tsx`

- [ ] **Step 1: Voeg de mobile TI app toe aan de app-grid**

In `apps/web/src/app/app-grid.tsx`, voeg een nieuw item toe aan de `APPS` array, na de bestaande "TI Studio":

```typescript
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
  // ... rest van de apps
];
```

**Let op:** TI Studio is alleen zichtbaar voor TC-leden (`cap.isTC`). De mobile Team-Indeling is zichtbaar voor TC-leden en coordinatoren.

- [ ] **Step 2: Build en verifieer**

```bash
pnpm build && pnpm dev
```

Open `http://localhost:3000` — verwacht: twee aparte tegels voor "Team-Indeling" (blauw) en "TI Studio" (indigo).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/app-grid.tsx
git commit -m "feat: aparte portaal-tegels voor Team-Indeling (mobile) en TI Studio (desktop)"
```

---

## Fase 4: Documentatie en agent-scheiding

### Task 10: Maak rules/teamindeling-scheiding.md

**Files:**
- Create: `rules/teamindeling-scheiding.md`

- [ ] **Step 1: Schrijf de scheiding-rules**

Create `rules/teamindeling-scheiding.md`:

```markdown
# Teamindeling — Desktop/Mobile scheiding

De Team-Indeling bestaat uit twee functioneel gescheiden versies:

## Twee route groups

| | Mobile | Desktop (Studio) |
|---|---|---|
| Route group | `(teamindeling)` | `(teamindeling-studio)` |
| URL | `/teamindeling/*` | `/ti-studio/*` |
| Thema | Dark | Light (wordt dark) |
| Focus | Bekijken, reviewen, communiceren | Maken, bewerken, drag & drop |

## Regels voor agents

1. **Werk in `(teamindeling)` of `components/teamindeling/mobile/`** → mobile versie
2. **Werk in `(teamindeling-studio)` of `components/teamindeling/studio/`** → desktop versie
3. **Werk in `src/lib/teamindeling/` of `components/teamindeling/shared/`** → gedeelde laag
4. Mobile bevat **nooit** drag & drop of scenario-editing
5. Studio bevat **nooit** mobile-specifieke componenten
6. Prisma queries en server actions staan in `src/lib/teamindeling/`, nooit in pagina-bestanden
7. API routes onder `/api/teamindeling/` worden door beide versies gebruikt

## Componentlocaties

```
components/teamindeling/
├── mobile/          # Mobile-only (MobileShell, etc.)
├── studio/          # Desktop-only (toekomstig)
├── shared/          # Gedeeld
└── (overige mappen) # Legacy studio-componenten
```

## Gedeelde data-laag

```
src/lib/teamindeling/
├── db/              # Prisma client en queries
├── validatie/       # KNKV-regelvalidatie
├── seizoen.ts       # Seizoen-logica
├── auth.ts          # Auth helpers
└── ...
```

Beide versies importeren uit `src/lib/teamindeling/`. Data-logica wordt nooit in pagina-bestanden geschreven.
```

- [ ] **Step 2: Commit**

```bash
git add rules/teamindeling-scheiding.md
git commit -m "docs: rules voor teamindeling desktop/mobile scheiding"
```

### Task 11: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update de route-tabel in CLAUDE.md**

Zoek de bestaande route-tabel en vervang de teamindeling-regel:

```markdown
| Route | Domein | Was |
|---|---|---|
| `/` | Portaal (app-launcher) | portaal.ckvoranjewit.app |
| `/monitor/*` | Verenigingsmonitor | monitor.ckvoranjewit.app |
| `/teamindeling/*` | Team-Indeling Mobile (dark, review) | nieuw |
| `/ti-studio/*` | Team-Indeling Studio (desktop, bewerken) | teamindeling.ckvoranjewit.app |
| `/evaluatie/*` | Evaluatie | evaluatie.ckvoranjewit.app |
| `/scouting/*` | Scouting | scout.ckvoranjewit.app |
| `/beheer/*` | TC Beheer (9 domeinen) | beheer.ckvoranjewit.app |
```

- [ ] **Step 2: Voeg de scheiding-regel toe aan de rules-tabel**

Voeg toe aan de rules-tabel in CLAUDE.md:

```markdown
| `teamindeling-scheiding.md` | Desktop/mobile scheiding, agent-vuistregels |
```

- [ ] **Step 3: Update de structuur-sectie**

Vervang in de structuur-beschrijving de `(teamindeling)` vermelding:

```markdown
│   │       ├── (teamindeling)/       # Route group: Team-Indeling Mobile (dark)
│   │       ├── (teamindeling-studio)/ # Route group: Team-Indeling Studio (desktop)
```

- [ ] **Step 4: Update de opmerking over TI desktop/mobile**

Zoek de regel "Team-indeling desktop: legacy licht thema (bewust), mobile variant is dark-first" en update naar:

```markdown
Team-indeling heeft twee route groups: (teamindeling) = mobile dark, (teamindeling-studio) = desktop light (wordt dark). Zie rules/teamindeling-scheiding.md.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md met teamindeling desktop/mobile scheiding"
```

---

## Fase 5: Mobile placeholder-pagina's

> **UX-gate:** Voordat deze pagina's uitgebouwd worden met echte UI, moet het UX-team wireframes maken per pagina. Deze task maakt werkende server-side pagina's met data, maar minimale UI.

### Task 12: Teams pagina (mobile)

**Files:**
- Create: `apps/web/src/app/(teamindeling)/teamindeling/teams/page.tsx`
- Create: `apps/web/src/app/(teamindeling)/teamindeling/teams/[id]/page.tsx`

- [ ] **Step 1: Schrijf de teams overzichtpagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/teams/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function TeamsPage() {
  const seizoen = await getActiefSeizoen();

  const teams = await prisma.oWTeam.findMany({
    where: { seizoen },
    orderBy: { naam: "asc" },
    select: {
      id: true,
      naam: true,
      categorie: true,
      kleur: true,
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        Teams
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {teams.map((team) => (
          <a
            key={team.id}
            href={`/teamindeling/teams/${team.id}`}
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            <div style={{ fontWeight: 600 }}>{team.naam}</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {team.categorie} {team.kleur ? `· ${team.kleur}` : ""}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Schrijf de team detail pagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/teams/[id]/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;

  const team = await prisma.oWTeam.findUnique({
    where: { id },
    select: {
      id: true,
      naam: true,
      categorie: true,
      kleur: true,
    },
  });

  if (!team) notFound();

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {team.naam}
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        {team.categorie} {team.kleur ? `· ${team.kleur}` : ""}
      </p>
      <p style={{ color: "var(--text-tertiary)", marginTop: "1rem", fontSize: "0.875rem" }}>
        Team detail — wordt uitgebreid na UX-wireframes
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Build en verifieer**

```bash
pnpm build
```

Open `http://localhost:3000/teamindeling/teams` — verwacht: lijst met teams.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/"(teamindeling)"/teamindeling/teams/
git commit -m "feat: mobile teams pagina's (placeholder, wacht op UX)"
```

### Task 13: Spelers pagina (mobile)

**Files:**
- Create: `apps/web/src/app/(teamindeling)/teamindeling/spelers/page.tsx`
- Create: `apps/web/src/app/(teamindeling)/teamindeling/spelers/[id]/page.tsx`

- [ ] **Step 1: Schrijf de spelerslijst pagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/spelers/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { PEILJAAR } from "@oranje-wit/types";

export default async function SpelersPage() {
  const seizoen = await getActiefSeizoen();

  const spelers = await prisma.speler.findMany({
    where: { blauwdruk: { seizoen } },
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      status: true,
    },
    take: 100,
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        Spelers
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {spelers.map((speler) => (
          <a
            key={speler.id}
            href={`/teamindeling/spelers/${speler.id}`}
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {speler.roepnaam} {speler.achternaam}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {PEILJAAR - speler.geboortejaar} jaar · {speler.geslacht} · {speler.status}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Schrijf de speler detail pagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/spelers/[id]/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { notFound } from "next/navigation";
import { PEILJAAR } from "@oranje-wit/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SpelerDetailPage({ params }: Props) {
  const { id } = await params;

  const speler = await prisma.speler.findUnique({
    where: { id },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      status: true,
      rating: true,
    },
  });

  if (!speler) notFound();

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {speler.roepnaam} {speler.achternaam}
      </h1>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        {PEILJAAR - speler.geboortejaar} jaar · {speler.geslacht} · {speler.status}
      </div>
      <p style={{ color: "var(--text-tertiary)", marginTop: "1rem", fontSize: "0.875rem" }}>
        Speler detail — wordt uitgebreid na UX-wireframes
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Build en verifieer**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/"(teamindeling)"/teamindeling/spelers/
git commit -m "feat: mobile spelers pagina's (placeholder, wacht op UX)"
```

### Task 14: Scenario's en staf pagina's (mobile)

**Files:**
- Create: `apps/web/src/app/(teamindeling)/teamindeling/scenarios/page.tsx`
- Create: `apps/web/src/app/(teamindeling)/teamindeling/scenarios/[id]/page.tsx`
- Create: `apps/web/src/app/(teamindeling)/teamindeling/staf/page.tsx`

- [ ] **Step 1: Schrijf de scenario's overzichtpagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/scenarios/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function ScenariosPage() {
  const seizoen = await getActiefSeizoen();

  const scenarios = await prisma.scenario.findMany({
    where: {
      concept: { blauwdruk: { seizoen } },
      verwijderdOp: null,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      naam: true,
      status: true,
      concept: { select: { naam: true } },
      updatedAt: true,
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        Scenario&apos;s
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {scenarios.map((s) => (
          <a
            key={s.id}
            href={`/teamindeling/scenarios/${s.id}`}
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            <div style={{ fontWeight: 600 }}>{s.naam}</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {s.concept.naam} · {s.status}
            </div>
          </a>
        ))}
        {scenarios.length === 0 && (
          <p style={{ color: "var(--text-tertiary)" }}>
            Geen scenario&apos;s beschikbaar.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Schrijf de scenario detail pagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/scenarios/[id]/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScenarioDetailPage({ params }: Props) {
  const { id } = await params;

  const scenario = await prisma.scenario.findUnique({
    where: { id },
    select: {
      id: true,
      naam: true,
      status: true,
      toelichting: true,
      concept: { select: { naam: true } },
    },
  });

  if (!scenario) notFound();

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {scenario.naam}
      </h1>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        {scenario.concept.naam} · {scenario.status}
      </div>
      {scenario.toelichting && (
        <p style={{ color: "var(--text-secondary)", marginTop: "0.75rem" }}>
          {scenario.toelichting}
        </p>
      )}
      <p style={{ color: "var(--text-tertiary)", marginTop: "1rem", fontSize: "0.875rem" }}>
        Scenario review — wordt uitgebreid na UX-wireframes
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Schrijf de staf pagina**

Create `apps/web/src/app/(teamindeling)/teamindeling/staf/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";

export default async function StafPage() {
  const staf = await prisma.staf.findMany({
    orderBy: { naam: "asc" },
    select: {
      id: true,
      naam: true,
      rollen: true,
      email: true,
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        Staf
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {staf.map((s) => (
          <div
            key={s.id}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.naam}</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {s.rollen.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build en verifieer**

```bash
pnpm build
```

Verifieer:
- `http://localhost:3000/teamindeling/scenarios` — scenario's lijst
- `http://localhost:3000/teamindeling/staf` — stafoverzicht

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/"(teamindeling)"/teamindeling/scenarios/ apps/web/src/app/"(teamindeling)"/teamindeling/staf/
git commit -m "feat: mobile scenario's en staf pagina's (placeholder, wacht op UX)"
```

---

## Fase 6: Verifieer alles en final commit

### Task 15: Volledige verificatie

- [ ] **Step 1: Draai de volledige build**

```bash
pnpm build
```

Verwacht: geen errors.

- [ ] **Step 2: Draai alle unit tests**

```bash
pnpm test
```

Verwacht: alle tests slagen. Fix falende tests als die door padwijzigingen breken.

- [ ] **Step 3: Controleer dat er geen gemiste verwijzingen zijn**

```bash
grep -rn '"/teamindeling' apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v 'api/teamindeling' | grep -v '(teamindeling)/' | grep -v '(teamindeling-studio)/'
```

Alles wat hier uitkomt (behalve imports met `@/components/teamindeling/` — die zijn OK) moet gecontroleerd worden. URL-verwijzingen naar `/teamindeling` in studio-componenten moeten `/ti-studio` zijn.

- [ ] **Step 4: Test alle routes handmatig**

| URL | Verwacht |
|---|---|
| `localhost:3000/` | Portaal met twee TI-tegels |
| `localhost:3000/teamindeling` | Dark mobile dashboard |
| `localhost:3000/teamindeling/teams` | Teams lijst (dark) |
| `localhost:3000/teamindeling/spelers` | Spelers lijst (dark) |
| `localhost:3000/teamindeling/scenarios` | Scenario's lijst (dark) |
| `localhost:3000/teamindeling/staf` | Staf overzicht (dark) |
| `localhost:3000/ti-studio` | Light desktop dashboard |
| `localhost:3000/ti-studio/blauwdruk` | Blauwdruk (ongewijzigd) |
| `localhost:3000/ti-studio/scenarios` | Scenario's (ongewijzigd) |

- [ ] **Step 5: Commit eventuele fixes**

```bash
git add -A
git commit -m "fix: final fixes na volledige verificatie"
```

---

## Buiten scope (volgende iteraties)

De volgende taken vallen buiten dit plan en worden apart opgepakt:

1. **UX-wireframes** — UX-team maakt wireframes voor alle 8 mobile pagina's
2. **Mobile UI-uitbouw** — Placeholder-pagina's vervangen door echte componenten na UX-goedkeuring
3. **Autorisatiemodel** — Prisma migratie voor TIScope, TIScopeRegel, TIScopeToewijzing, ScenarioDeling
4. **Scope-filtering** — `scopeFilter()` en `magScenarioZien()` implementeren
5. **Beheer-pagina** — Scope-inrichting in `/beheer/teamindeling/`
6. **Signaal/actie-systeem** — Eigen design-ronde (zie spec sectie 8)
7. **Studio dark-mode migratie** — Desktop TI overzetten naar dark theme
8. **E2E tests** — Playwright tests voor alle mobile en studio routes
