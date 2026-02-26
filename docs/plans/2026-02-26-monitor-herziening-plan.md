# Verenigingsmonitor v2 — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Volledig herontwerp van de Verenigingsmonitor als Next.js app met 7 secties, sportief/warm Oranje Wit design, Prisma data-laag, vervangt de bestaande Express monitor.

**Architecture:** Next.js 16 App Router met Server Components die Prisma queries direct aanroepen via `@oranje-wit/database`. Sidebar navigatie met seizoen-selector. Gedeeld UI-package `packages/ui` voor componenten die ook in team-indeling bruikbaar zijn.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Recharts, Prisma 7, `@oranje-wit/database`

**Design doc:** `docs/plans/2026-02-26-monitor-herziening-design.md`

---

## Task 1: Next.js app scaffolden

**Files:**
- Create: `apps/monitor/package.json`
- Create: `apps/monitor/next.config.ts`
- Create: `apps/monitor/tsconfig.json`
- Create: `apps/monitor/postcss.config.mjs`
- Create: `apps/monitor/src/app/globals.css`
- Create: `apps/monitor/src/app/layout.tsx`
- Create: `apps/monitor/src/app/page.tsx`
- Create: `apps/monitor/src/lib/db/prisma.ts`

**Step 1: Verwijder oude Express monitor bestanden**

De hele `apps/monitor/` directory bevat de oude Express app. Verwijder deze:

```bash
rm -rf apps/monitor/
```

**Step 2: Maak de nieuwe app directory-structuur**

```bash
mkdir -p apps/monitor/src/app
mkdir -p apps/monitor/src/lib/db
mkdir -p apps/monitor/src/lib/queries
mkdir -p apps/monitor/src/lib/utils
mkdir -p apps/monitor/src/components/charts
mkdir -p apps/monitor/src/components/layout
```

**Step 3: Schrijf `apps/monitor/package.json`**

Volg exact het patroon van `apps/team-indeling/package.json`:

```json
{
  "name": "@oranje-wit/monitor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@oranje-wit/database": "workspace:*",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

Poort 3001 zodat het niet botst met team-indeling (3000).

**Step 4: Schrijf `apps/monitor/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

**Step 5: Schrijf `apps/monitor/tsconfig.json`**

Kopieer exact van team-indeling:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 6: Schrijf `apps/monitor/postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Step 7: Schrijf `apps/monitor/src/app/globals.css`**

Tailwind v4 met Oranje Wit design tokens:

```css
@import "tailwindcss";

@theme inline {
  --color-ow-oranje: #FF6B00;
  --color-ow-oranje-light: #FF8C33;
  --color-ow-oranje-bg: #FFF3E8;

  --color-band-blauw: #4A90D9;
  --color-band-groen: #52B788;
  --color-band-geel: #F4D35E;
  --color-band-oranje: #F28C28;
  --color-band-rood: #D62828;

  --color-signal-groen: #4CAF50;
  --color-signal-geel: #FFC107;
  --color-signal-rood: #F44336;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
```

**Step 8: Schrijf `apps/monitor/src/lib/db/prisma.ts`**

```ts
export { prisma } from "@oranje-wit/database";
```

**Step 9: Schrijf `apps/monitor/src/app/layout.tsx`**

Minimale root layout (sidebar komt in Task 3):

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "TC-monitor voor gezonde groei — actieve leden, cohorten, teams, verloop en signalering",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 10: Schrijf `apps/monitor/src/app/page.tsx`**

Placeholder homepage:

```tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ow-oranje">Verenigingsmonitor</h1>
      <p className="mt-2 text-gray-600">c.k.v. Oranje Wit — TC Monitor</p>
    </div>
  );
}
```

**Step 11: Installeer dependencies en test**

```bash
cd apps/monitor && pnpm install
```

```bash
pnpm dev
```

Verwacht: Next.js draait op poort 3001, placeholder pagina toont "Verenigingsmonitor" in oranje.

**Step 12: Commit**

```bash
git add apps/monitor/
git commit -m "feat: scaffold Verenigingsmonitor v2 Next.js app"
```

---

## Task 2: Voeg root workspace scripts toe

**Files:**
- Modify: `package.json` (root)

**Step 1: Voeg monitor scripts toe aan root package.json**

Voeg toe aan `scripts`:

```json
"dev:monitor": "pnpm --filter @oranje-wit/monitor dev",
"build:monitor": "pnpm --filter @oranje-wit/monitor build"
```

Vervang de bestaande `dev:monitor` die naar de oude Express app wees.

**Step 2: Test vanuit root**

```bash
pnpm dev:monitor
```

Verwacht: Next.js start op poort 3001.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: update root workspace scripts voor monitor v2"
```

---

## Task 3: Sidebar layout en navigatie

**Files:**
- Create: `apps/monitor/src/components/layout/sidebar.tsx`
- Create: `apps/monitor/src/components/layout/seizoen-selector.tsx`
- Modify: `apps/monitor/src/app/layout.tsx`

**Step 1: Schrijf seizoen-selector component**

`apps/monitor/src/components/layout/seizoen-selector.tsx`:

Client component met dropdown. Leest beschikbare seizoenen. Navigeert via URL search param `?seizoen=2025-2026`.

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SEIZOENEN = [
  "2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022",
  "2020-2021", "2019-2020", "2018-2019", "2017-2018", "2016-2017",
];

export function SeizoenSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const huidig = params.get("seizoen") || SEIZOENEN[0];

  return (
    <select
      value={huidig}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("seizoen", e.target.value);
        router.push(url.pathname + url.search);
      }}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
    >
      {SEIZOENEN.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
```

**Step 2: Schrijf sidebar component**

`apps/monitor/src/components/layout/sidebar.tsx`:

Client component met navigatie-items en Oranje Wit branding.

```tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SeizoenSelector } from "./seizoen-selector";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/samenstelling", label: "Samenstelling", icon: "👥" },
  { href: "/cohorten", label: "Cohorten", icon: "📈" },
  { href: "/teams", label: "Teams", icon: "🏃" },
  { href: "/verloop", label: "Verloop", icon: "🔄" },
  { href: "/projecties", label: "Projecties", icon: "🎯" },
  { href: "/signalering", label: "Signalering", icon: "⚠️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const seizoen = params.get("seizoen") || "";
  const qs = seizoen ? `?seizoen=${seizoen}` : "";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Branding */}
      <div className="border-b border-gray-200 px-6 py-5">
        <h1 className="text-lg font-bold text-ow-oranje">Oranje Wit</h1>
        <p className="text-xs text-gray-500">Verenigingsmonitor</p>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href + qs}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ow-oranje-bg text-ow-oranje font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Seizoen-selector */}
      <div className="border-t border-gray-200 px-4 py-4">
        <p className="mb-2 text-xs font-medium text-gray-500">Seizoen</p>
        <SeizoenSelector />
      </div>
    </aside>
  );
}
```

**Step 3: Update root layout**

Wijzig `apps/monitor/src/app/layout.tsx` om sidebar toe te voegen:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "TC-monitor voor gezonde groei",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-screen">
          <Suspense>
            <Sidebar />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

`<Suspense>` is nodig omdat sidebar `useSearchParams()` gebruikt.

**Step 4: Maak placeholder pagina's**

Maak voor elke sectie een `page.tsx` met minimale inhoud:

```bash
mkdir -p apps/monitor/src/app/{samenstelling,cohorten,teams,verloop,projecties,signalering}
```

Elke `page.tsx`:

```tsx
export default function SamenstellingPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Samenstelling</h2>
      <p className="mt-2 text-gray-600">Wie zijn er actief?</p>
    </div>
  );
}
```

(Herhaal voor cohorten, teams, verloop, projecties, signalering met passende titels en subtitels.)

**Step 5: Test navigatie**

```bash
pnpm dev:monitor
```

Verwacht: sidebar toont alle 7 items, klikken navigeert correct, actieve pagina is oranje gemarkeerd, seizoen-selector werkt.

**Step 6: Commit**

```bash
git add apps/monitor/src/
git commit -m "feat: sidebar layout met navigatie en seizoen-selector"
```

---

## Task 4: Gedeelde UI-componenten

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/kpi-card.tsx`
- Create: `packages/ui/src/signal-badge.tsx`
- Create: `packages/ui/src/band-pill.tsx`
- Create: `packages/ui/src/page-header.tsx`
- Modify: `pnpm-workspace.yaml` (indien nodig)

**Step 1: Maak packages/ui structuur**

```bash
mkdir -p packages/ui/src
```

**Step 2: Schrijf `packages/ui/package.json`**

```json
{
  "name": "@oranje-wit/ui",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

**Step 3: Schrijf componenten**

`packages/ui/src/kpi-card.tsx`:

```tsx
interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  signal?: "groen" | "geel" | "rood";
}

export function KpiCard({ label, value, trend, signal }: KpiCardProps) {
  const signalColor = signal === "rood" ? "text-signal-rood"
    : signal === "geel" ? "text-signal-geel"
    : signal === "groen" ? "text-signal-groen"
    : "text-ow-oranje";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${signalColor}`}>{value}</p>
      {trend && (
        <p className={`mt-1 text-sm ${trend.value >= 0 ? "text-signal-groen" : "text-signal-rood"}`}>
          {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
        </p>
      )}
    </div>
  );
}
```

`packages/ui/src/signal-badge.tsx`:

```tsx
interface SignalBadgeProps {
  ernst: "kritiek" | "aandacht" | "opkoers";
  children: React.ReactNode;
}

export function SignalBadge({ ernst, children }: SignalBadgeProps) {
  const styles = {
    kritiek: "bg-red-100 text-red-800 border-red-200",
    aandacht: "bg-yellow-50 text-yellow-800 border-yellow-200",
    opkoers: "bg-green-50 text-green-800 border-green-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[ernst]}`}>
      {children}
    </span>
  );
}
```

`packages/ui/src/band-pill.tsx`:

```tsx
const BAND_COLORS: Record<string, string> = {
  Blauw: "bg-band-blauw text-white",
  Groen: "bg-band-groen text-white",
  Geel: "bg-band-geel text-gray-800",
  Oranje: "bg-band-oranje text-white",
  Rood: "bg-band-rood text-white",
  Senioren: "bg-gray-600 text-white",
};

export function BandPill({ band }: { band: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_COLORS[band] || "bg-gray-200 text-gray-600"}`}>
      {band}
    </span>
  );
}
```

`packages/ui/src/page-header.tsx`:

```tsx
export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-gray-500">{subtitle}</p>
    </div>
  );
}
```

`packages/ui/src/index.ts`:

```ts
export { KpiCard } from "./kpi-card";
export { SignalBadge } from "./signal-badge";
export { BandPill } from "./band-pill";
export { PageHeader } from "./page-header";
```

**Step 4: Voeg dependency toe aan monitor**

In `apps/monitor/package.json`, voeg toe bij dependencies:

```json
"@oranje-wit/ui": "workspace:*"
```

```bash
pnpm install
```

**Step 5: Commit**

```bash
git add packages/ui/ apps/monitor/package.json pnpm-lock.yaml
git commit -m "feat: packages/ui met KpiCard, SignalBadge, BandPill, PageHeader"
```

---

## Task 5: Prisma queries — dashboard en samenstelling

**Files:**
- Create: `apps/monitor/src/lib/queries/dashboard.ts`
- Create: `apps/monitor/src/lib/queries/samenstelling.ts`
- Create: `apps/monitor/src/lib/utils/seizoen.ts`

**Step 1: Schrijf seizoen helper**

`apps/monitor/src/lib/utils/seizoen.ts`:

```ts
export const HUIDIG_SEIZOEN = "2025-2026";

export function getSeizoen(searchParams: { seizoen?: string }): string {
  return searchParams.seizoen || HUIDIG_SEIZOEN;
}
```

**Step 2: Schrijf dashboard queries**

`apps/monitor/src/lib/queries/dashboard.ts`:

Porteer de logica uit `apps/monitor/api/routes/aggregaties.js` en `verloop.js` naar Prisma. Gebruik `prisma.$queryRaw` voor complexe aggregaties die niet goed in Prisma's query builder passen.

```ts
import { prisma } from "@/lib/db/prisma";

export async function getDashboardKpis(seizoen: string) {
  // Totaal actieve leden dit seizoen
  const snapshot = await prisma.snapshot.findFirst({
    where: { seizoen },
    orderBy: { snapshotDatum: "desc" },
  });

  if (!snapshot) return null;

  const totaalActief = await prisma.lidSnapshot.count({
    where: { snapshotId: snapshot.id, spelactiviteit: { not: null } },
  });

  // Verdeling M/V
  const geslachtVerdeling = await prisma.$queryRaw<{ geslacht: string; aantal: bigint }[]>`
    SELECT l.geslacht, COUNT(*)::int as aantal
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    WHERE ls.snapshot_id = ${snapshot.id} AND ls.spelactiviteit IS NOT NULL
    GROUP BY l.geslacht
  `;

  // Seizoens-totalen voor trend
  const seizoensTotalen = await prisma.$queryRaw<{ seizoen: string; totaal: bigint }[]>`
    SELECT cs.seizoen, SUM(cs.actief)::int as totaal
    FROM cohort_seizoenen cs
    GROUP BY cs.seizoen
    ORDER BY cs.seizoen
  `;

  // Verloop KPIs (retentie, groei)
  const verloop = await prisma.$queryRaw<{ behouden: bigint; uitgestroomd: bigint; nieuw: bigint }[]>`
    SELECT
      SUM(behouden)::int as behouden,
      SUM(uitgestroomd)::int as uitgestroomd,
      SUM(nieuw + herinschrijver)::int as nieuw
    FROM cohort_seizoenen
    WHERE seizoen = ${seizoen}
  `;

  return { totaalActief, geslachtVerdeling, seizoensTotalen, verloop, snapshot };
}
```

**Step 3: Schrijf samenstelling queries**

`apps/monitor/src/lib/queries/samenstelling.ts`:

Porteer logica uit `aggregaties.js` routes (per-geboortejaar, per-kleur, per-team).

```ts
import { prisma } from "@/lib/db/prisma";

export async function getPerGeboortejaar(seizoen: string) {
  const snapshot = await prisma.snapshot.findFirst({
    where: { seizoen },
    orderBy: { snapshotDatum: "desc" },
  });
  if (!snapshot) return [];

  return prisma.$queryRaw<{
    geboortejaar: number; geslacht: string; aantal: number;
    kleur: string; categorie: string;
  }[]>`
    SELECT l.geboortejaar, l.geslacht, COUNT(*)::int as aantal,
           COALESCE(ls.kleur, t.kleur, 'Onbekend') as kleur,
           ls.categorie
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    LEFT JOIN teams t ON ls.ow_code = t.ow_code AND t.seizoen = ${seizoen}
    WHERE ls.snapshot_id = ${snapshot.id} AND ls.spelactiviteit IS NOT NULL
    GROUP BY l.geboortejaar, l.geslacht, COALESCE(ls.kleur, t.kleur, 'Onbekend'), ls.categorie
    ORDER BY l.geboortejaar, l.geslacht
  `;
}

export async function getPerKleur(seizoen: string) {
  const snapshot = await prisma.snapshot.findFirst({
    where: { seizoen },
    orderBy: { snapshotDatum: "desc" },
  });
  if (!snapshot) return [];

  return prisma.$queryRaw<{
    kleur: string; categorie: string; teams: number;
    spelers_m: number; spelers_v: number; totaal: number;
  }[]>`
    SELECT
      COALESCE(ls.kleur, t.kleur, 'Onbekend') as kleur,
      ls.categorie,
      COUNT(DISTINCT ls.ow_code)::int as teams,
      COUNT(*) FILTER (WHERE l.geslacht = 'M')::int as spelers_m,
      COUNT(*) FILTER (WHERE l.geslacht = 'V')::int as spelers_v,
      COUNT(*)::int as totaal
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    LEFT JOIN teams t ON ls.ow_code = t.ow_code AND t.seizoen = ${seizoen}
    WHERE ls.snapshot_id = ${snapshot.id} AND ls.spelactiviteit IS NOT NULL
    GROUP BY COALESCE(ls.kleur, t.kleur, 'Onbekend'), ls.categorie
    ORDER BY ls.categorie, kleur
  `;
}
```

**Step 4: Commit**

```bash
git add apps/monitor/src/lib/
git commit -m "feat: Prisma queries voor dashboard en samenstelling"
```

---

## Task 6: Prisma queries — cohorten, verloop, signalering, model, teams

**Files:**
- Create: `apps/monitor/src/lib/queries/cohorten.ts`
- Create: `apps/monitor/src/lib/queries/verloop.ts`
- Create: `apps/monitor/src/lib/queries/signalering.ts`
- Create: `apps/monitor/src/lib/queries/model.ts`
- Create: `apps/monitor/src/lib/queries/teams.ts`

**Step 1: Schrijf cohorten queries**

Porteer logica uit `verloop.js` route `/api/cohorten`. De SQL is complex — gebruik `prisma.$queryRaw`.

**Step 2: Schrijf verloop queries**

Porteer logica uit `verloop.js` route `/api/instroom-uitstroom`. Instroom per leeftijd, uitstroom per leeftijd, retentie per leeftijd.

**Step 3: Schrijf signalering queries**

Porteer logica uit `signalering.js`. Eenvoudige Prisma query op de `signalering` tabel.

```ts
import { prisma } from "@/lib/db/prisma";

export async function getSignaleringen(seizoen: string) {
  return prisma.signalering.findMany({
    where: { seizoen },
    orderBy: [{ ernst: "asc" }, { type: "asc" }],
  });
}
```

**Step 4: Schrijf model queries**

Porteer logica uit `model.js` route `/api/streefmodel`. Query de `streefmodel` tabel.

**Step 5: Schrijf teams queries**

Porteer logica uit `teams.js` route `/api/teams-register`. Query `teams` + `team_periodes`.

**Step 6: Commit**

```bash
git add apps/monitor/src/lib/queries/
git commit -m "feat: Prisma queries voor cohorten, verloop, signalering, model, teams"
```

---

## Task 7: Chart componenten (client components)

**Files:**
- Create: `apps/monitor/src/components/charts/leden-trend.tsx`
- Create: `apps/monitor/src/components/charts/instroom-uitstroom.tsx`
- Create: `apps/monitor/src/components/charts/ledenboog.tsx`
- Create: `apps/monitor/src/components/charts/retentie-curve.tsx`
- Create: `apps/monitor/src/components/charts/cohort-heatmap.tsx`
- Create: `apps/monitor/src/components/charts/dropdown-heatmap.tsx`

**Step 1: Maak Recharts wrapper componenten**

Elke chart is een `"use client"` component die data als props ontvangt (serialized vanuit Server Component).

Voorbeeld `leden-trend.tsx`:

```tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LedenTrendProps {
  data: { seizoen: string; totaal: number }[];
}

export function LedenTrend({ data }: LedenTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="seizoen" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Line type="monotone" dataKey="totaal" stroke="#FF6B00" strokeWidth={2} dot={{ fill: "#FF6B00" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

Bouw vergelijkbare componenten voor alle grafieken. Gebruik de Oranje Wit kleuren (--ow-oranje, bandkleuren).

**Step 2: Bouw cohort-heatmap als HTML tabel**

De heatmap is geen Recharts chart maar een gestylde HTML tabel met kleurintensiteit. Maak dit als client component met gender-filter state.

**Step 3: Commit**

```bash
git add apps/monitor/src/components/charts/
git commit -m "feat: Recharts chart componenten en cohort-heatmap"
```

---

## Task 8: Dashboard pagina (`/`)

**Files:**
- Modify: `apps/monitor/src/app/page.tsx`

**Step 1: Bouw Dashboard als Server Component**

```tsx
import { getDashboardKpis } from "@/lib/queries/dashboard";
import { getSignaleringen } from "@/lib/queries/signalering";
import { getSeizoen } from "@/lib/utils/seizoen";
import { KpiCard, PageHeader } from "@oranje-wit/ui";
import { LedenTrend } from "@/components/charts/leden-trend";
import { InstroomUitstroom } from "@/components/charts/instroom-uitstroom";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const { seizoen } = await searchParams;
  const sz = getSeizoen({ seizoen });
  const kpis = await getDashboardKpis(sz);
  const alerts = await getSignaleringen(sz);

  if (!kpis) return <p>Geen data voor seizoen {sz}</p>;

  const topAlerts = alerts.slice(0, 3);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Seizoen ${sz} — Hoe staan we ervoor?`} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <KpiCard label="Actieve leden" value={kpis.totaalActief} />
        {/* meer KPI cards */}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Actieve leden per seizoen</h3>
          <LedenTrend data={kpis.seizoensTotalen} />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Instroom vs Uitstroom</h3>
          <InstroomUitstroom data={kpis.verloop} />
        </div>
      </div>

      {/* Top signaleringen */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">Belangrijkste signaleringen</h3>
        {/* render topAlerts */}
      </div>
    </>
  );
}
```

**Step 2: Test**

```bash
pnpm dev:monitor
```

Verwacht: Dashboard toont KPI cards, trendlijn grafiek, instroom/uitstroom grafiek, top 3 alerts.

**Step 3: Commit**

```bash
git add apps/monitor/src/app/page.tsx
git commit -m "feat: Dashboard pagina met KPIs, trends en signaleringen"
```

---

## Task 9: Samenstelling pagina (`/samenstelling`)

**Files:**
- Modify: `apps/monitor/src/app/samenstelling/page.tsx`

**Step 1: Bouw pagina met ledenboog, verhoudingen en tabel**

Server Component die `getPerGeboortejaar` en `getPerKleur` aanroept. Toont:
- Ledenboog (horizontale bar chart, M links V rechts, per band gekleurd)
- Genderbalans kaarten per band
- Detailtabel per geboortejaar

**Step 2: Test en commit**

```bash
git add apps/monitor/src/app/samenstelling/
git commit -m "feat: Samenstelling pagina — ledenboog, verhoudingen, tabel"
```

---

## Task 10: Cohorten pagina (`/cohorten`)

**Files:**
- Modify: `apps/monitor/src/app/cohorten/page.tsx`

**Step 1: Bouw pagina met cohort-heatmap en retentie chart**

Heatmap: rijen = geboortejaar, kolommen = seizoenen, kleur = groei/krimp. Gender-filter (M/V/Alles). Retentie bar chart per cohort.

**Step 2: Test en commit**

```bash
git add apps/monitor/src/app/cohorten/
git commit -m "feat: Cohorten pagina — heatmap en retentie per cohort"
```

---

## Task 11: Teams pagina (`/teams`)

**Files:**
- Modify: `apps/monitor/src/app/teams/page.tsx`

**Step 1: Bouw pagina met teamkaarten en pool-analyse**

Team-kaarten per band, gescheiden in competitie/kangoeroe/recreant. Pool-analyse per leeftijdsgroep.

**Step 2: Test en commit**

```bash
git add apps/monitor/src/app/teams/
git commit -m "feat: Teams pagina — teamkaarten en pool-analyse"
```

---

## Task 12: Verloop pagina (`/verloop`)

**Files:**
- Modify: `apps/monitor/src/app/verloop/page.tsx`

**Step 1: Bouw pagina met instroom/uitstroom, retentiecurve, drop-out heatmap, instroomvenster, overgangsmomenten**

Dit is de meest data-rijke pagina. Bevat 5 secties:
1. Instroom vs uitstroom gestapelde bar chart
2. Retentiecurve per leeftijdsjaar
3. Drop-out heatmap (leeftijd × seizoen)
4. Instroomvenster (leeftijdsverdeling + trend)
5. Kritieke overgangsmomenten tabel

**Step 2: Test en commit**

```bash
git add apps/monitor/src/app/verloop/
git commit -m "feat: Verloop pagina — instroom, uitstroom, retentie, drop-out, instroomvenster"
```

---

## Task 13: Projecties pagina (`/projecties`)

**Files:**
- Modify: `apps/monitor/src/app/projecties/page.tsx`

**Step 1: Bouw pagina met streefmodel, vulgraad, groeipad, benchmark**

Streefmodel overlay chart, vulgraad-tabel met stoplicht, groeipad per geboortejaar, benchmark placeholder.

**Step 2: Test en commit**

```bash
git add apps/monitor/src/app/projecties/
git commit -m "feat: Projecties pagina — streefmodel, vulgraad, groeipad"
```

---

## Task 14: Signalering pagina (`/signalering`)

**Files:**
- Modify: `apps/monitor/src/app/signalering/page.tsx`

**Step 1: Bouw pagina met KPI-cards, alert-lijst, filters**

KPI-cards (kritiek/aandacht/op koers), stoplicht alert-cards, filters per type.

**Step 2: Test en commit**

```bash
git add apps/monitor/src/app/signalering/
git commit -m "feat: Signalering pagina — alerts met stoplicht en filters"
```

---

## Task 15: Responsieve sidebar (mobiel)

**Files:**
- Modify: `apps/monitor/src/components/layout/sidebar.tsx`
- Modify: `apps/monitor/src/app/layout.tsx`

**Step 1: Maak sidebar inklapbaar op mobiel**

Voeg een hamburger-menu knop toe die de sidebar toont/verbergt op schermen < 768px. Sidebar wordt een overlay op mobiel.

**Step 2: Test op verschillende viewports en commit**

```bash
git add apps/monitor/src/components/layout/ apps/monitor/src/app/layout.tsx
git commit -m "feat: responsieve sidebar — inklapbaar op mobiel"
```

---

## Task 16: Railway deployment configuratie

**Files:**
- Create: `apps/monitor/railway.json`
- Create: `apps/monitor/.env.example`

**Step 1: Schrijf Railway configuratie**

`apps/monitor/railway.json`:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd ../.. && pnpm db:generate && pnpm --filter @oranje-wit/monitor build"
  },
  "deploy": {
    "startCommand": "cd ../.. && pnpm --filter @oranje-wit/monitor start",
    "healthcheckPath": "/"
  }
}
```

**Step 2: Schrijf `.env.example`**

```
DATABASE_URL=postgresql://user:pass@host:port/db
```

**Step 3: Commit**

```bash
git add apps/monitor/railway.json apps/monitor/.env.example
git commit -m "chore: Railway deployment config voor monitor v2"
```

---

## Task 17: Eindcontrole

**Step 1: Verifieer alle pagina's**

```bash
pnpm dev:monitor
```

Controleer:
- [ ] Sidebar navigatie werkt op alle 7 pagina's
- [ ] Seizoen-selector filtert data correct
- [ ] Dashboard: KPIs, trends, top alerts
- [ ] Samenstelling: ledenboog, verhoudingen, tabel
- [ ] Cohorten: heatmap, retentie, gender-filter
- [ ] Teams: kaarten, pool-analyse
- [ ] Verloop: instroom/uitstroom, retentiecurve, heatmaps
- [ ] Projecties: streefmodel, vulgraad
- [ ] Signalering: stoplicht alerts, filters
- [ ] Responsief op 768px en 480px

**Step 2: Build test**

```bash
pnpm build:monitor
```

Verwacht: succesvolle build zonder errors.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Verenigingsmonitor v2 compleet — Next.js, 7 secties, sportief design"
```
