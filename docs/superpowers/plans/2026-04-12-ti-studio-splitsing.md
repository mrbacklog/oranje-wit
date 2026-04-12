# TI-Studio splitsing — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/ti-studio` afsplitsen als zelfstandige Next.js app in de monorepo, bereikbaar via `teamindeling.ckvoranjewit.app`, met TI-Studio volledig verwijderd uit `apps/web`.

**Architecture:** Nieuwe `apps/ti-studio` app naast bestaande `apps/web`. Gedeelde seizoen-logica verhuist naar nieuw `@oranje-wit/teamindeling-shared` package. Auth-cookie wordt wildcard op `.ckvoranjewit.app` zodat één login geldig is op beide domeinen.

**Tech Stack:** Next.js 16, TypeScript, Prisma, NextAuth v5, Tailwind CSS v4, pnpm workspaces, Railway, GitHub Actions

---

## Aanpak

De migratie werkt in twee fases:

- **Fase A (development):** Tasks 1–10 — nieuwe app bouwen en testen lokaal. `apps/web` blijft volledig intact totdat de nieuwe app werkt.
- **Fase B (productie):** Tasks 11–12 — Railway service aanmaken, DNS omzetten, oude code verwijderen.

Voer Fase A volledig af vóór Fase B begint.

---

## Bestandsstructuur na migratie

```
apps/
├── web/                          # Ongewijzigd voor andere domeinen
│   └── src/
│       ├── app/(teamindeling)/   # Mobile teamindeling — BLIJFT
│       └── lib/teamindeling/     # Gedeelde logica verdwijnt hieruit
├── ti-studio/                    # NIEUW
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx          # redirect → /indeling
│       │   ├── indeling/
│       │   ├── kader/
│       │   ├── memo/
│       │   ├── personen/
│       │   └── api/
│       │       └── indeling/[versieId]/
│       ├── components/           # Alles van components/ti-studio/
│       └── lib/                  # TI-Studio-specifieke lib/teamindeling/ bestanden
packages/
└── teamindeling-shared/          # NIEUW
    └── src/
        ├── index.ts
        ├── seizoen.ts            # getActiefSeizoen, isWerkseizoenCheck
        └── SeizoenProvider.tsx   # React context component
```

---

## Task 1: Maak `@oranje-wit/teamindeling-shared` package aan

**Files:**
- Create: `packages/teamindeling-shared/package.json`
- Create: `packages/teamindeling-shared/tsconfig.json`
- Create: `packages/teamindeling-shared/src/index.ts`
- Modify: `pnpm-workspace.yaml`

- [ ] **Stap 1: Maak de package directory aan**

```bash
mkdir -p c:/Users/Antjan/oranje-wit/packages/teamindeling-shared/src
```

- [ ] **Stap 2: Schrijf `packages/teamindeling-shared/package.json`**

```json
{
  "name": "@oranje-wit/teamindeling-shared",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./seizoen": "./src/seizoen.ts",
    "./seizoen-provider": "./src/SeizoenProvider.tsx"
  },
  "dependencies": {
    "@oranje-wit/database": "workspace:*",
    "@oranje-wit/types": "workspace:*"
  },
  "peerDependencies": {
    "next": "^15.0.0 || ^16.0.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19",
    "typescript": "^5"
  }
}
```

- [ ] **Stap 3: Schrijf `packages/teamindeling-shared/tsconfig.json`**

Kopieer de structuur van een bestaand package. Lees eerst `packages/types/tsconfig.json` en maak:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

> **Let op:** Controleer of er een root `tsconfig.json` bestaat in de repo root. Als niet, gebruik `packages/ui/tsconfig.json` als sjabloon.

- [ ] **Stap 4: Schrijf `packages/teamindeling-shared/src/index.ts` (leeg voor nu)**

```typescript
// Exports worden toegevoegd in Task 3
export {};
```

- [ ] **Stap 5: Voeg toe aan `pnpm-workspace.yaml`**

Huidig bestand:
```yaml
packages:
  - "packages/*"
  - "apps/web"
  - "apps/mcp/*"
```

Nieuw:
```yaml
packages:
  - "packages/*"
  - "apps/web"
  - "apps/ti-studio"
  - "apps/mcp/*"
```

> **Let op:** `apps/ti-studio` bestaat nog niet — pnpm slaat een ontbrekende workspace gewoon over. Dit is veilig.

- [ ] **Stap 6: Installeer dependencies**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm install
```

Verwacht: geen errors. pnpm registreert het nieuwe package.

- [ ] **Stap 7: Commit**

```bash
git add packages/teamindeling-shared/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat: voeg @oranje-wit/teamindeling-shared package toe (leeg)"
```

---

## Task 2: Extraheer seizoen-logica naar shared package

De seizoen-helpers (`getActiefSeizoen`, `isWerkseizoenCheck`) en de `SeizoenProvider` worden door zowel TI-Studio als de mobile teamindeling (`/teamindeling`) gebruikt. Ze verhuizen naar `@oranje-wit/teamindeling-shared`.

**Files:**
- Read + Copy: `apps/web/src/lib/teamindeling/seizoen.ts` → `packages/teamindeling-shared/src/seizoen.ts`
- Read + Copy: `apps/web/src/components/teamindeling/providers/SeizoenProvider.tsx` → `packages/teamindeling-shared/src/SeizoenProvider.tsx`
- Modify: `packages/teamindeling-shared/src/index.ts`
- Modify: alle bestanden in `apps/web` die deze importeren

- [ ] **Stap 1: Lees de bronbestanden**

Lees `apps/web/src/lib/teamindeling/seizoen.ts` en `apps/web/src/components/teamindeling/providers/SeizoenProvider.tsx` volledig.

- [ ] **Stap 2: Kopieer `seizoen.ts` naar het shared package**

Maak `packages/teamindeling-shared/src/seizoen.ts` aan met de volledige inhoud van het bronbestand. Pas imports aan: `@/lib/` wordt `@oranje-wit/database` of `@oranje-wit/types` waar van toepassing.

- [ ] **Stap 3: Kopieer `SeizoenProvider.tsx` naar het shared package**

Maak `packages/teamindeling-shared/src/SeizoenProvider.tsx` aan met de volledige inhoud van het bronbestand. Pas imports aan zodat ze zonder `@/` alias werken (gebruik relatieve paden of package imports).

- [ ] **Stap 4: Update `packages/teamindeling-shared/src/index.ts`**

```typescript
export { getActiefSeizoen, isWerkseizoenCheck } from "./seizoen";
export { default as SeizoenProvider, useSeizoen } from "./SeizoenProvider";
```

> **Let op:** Exporteer alleen wat daadwerkelijk bestaat in de bronbestanden. Controleer de exacte export-namen.

- [ ] **Stap 5: Voeg `@oranje-wit/teamindeling-shared` toe aan `apps/web/package.json`**

Voeg toe aan `dependencies`:
```json
"@oranje-wit/teamindeling-shared": "workspace:*"
```

- [ ] **Stap 6: Update imports in `apps/web` die van deze bestanden afhangen**

Zoek alle bestanden in `apps/web` die importeren van:
- `@/lib/teamindeling/seizoen`
- `@/components/teamindeling/providers/SeizoenProvider`

```bash
grep -r "lib/teamindeling/seizoen\|providers/SeizoenProvider" apps/web/src --include="*.ts" --include="*.tsx" -l
```

Update elk gevonden bestand: vervang de `@/lib/...` en `@/components/teamindeling/providers/...` imports door `@oranje-wit/teamindeling-shared`.

- [ ] **Stap 7: Typecheck**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm --filter @oranje-wit/web exec tsc --noEmit
```

Verwacht: geen errors. Fix eventuele type-errors voor verder gaan.

- [ ] **Stap 8: Tests draaien**

```bash
pnpm test
```

Verwacht: alle tests groen.

- [ ] **Stap 9: Commit**

```bash
git add packages/teamindeling-shared/ apps/web/package.json apps/web/src/ pnpm-lock.yaml
git commit -m "feat: extraheer seizoen-logica naar @oranje-wit/teamindeling-shared"
```

---

## Task 3: Maak `apps/ti-studio` Next.js app scaffold aan

**Files:**
- Create: `apps/ti-studio/package.json`
- Create: `apps/ti-studio/tsconfig.json`
- Create: `apps/ti-studio/next.config.ts`
- Create: `apps/ti-studio/postcss.config.mjs`
- Create: `apps/ti-studio/tailwind.config.ts`
- Create: `apps/ti-studio/src/app/layout.tsx`
- Create: `apps/ti-studio/src/app/page.tsx`
- Create: `apps/ti-studio/src/app/globals.css`

- [ ] **Stap 1: Maak directory structuur aan**

```bash
mkdir -p c:/Users/Antjan/oranje-wit/apps/ti-studio/src/app
mkdir -p c:/Users/Antjan/oranje-wit/apps/ti-studio/src/components
mkdir -p c:/Users/Antjan/oranje-wit/apps/ti-studio/src/lib
mkdir -p c:/Users/Antjan/oranje-wit/apps/ti-studio/public
```

- [ ] **Stap 2: Schrijf `apps/ti-studio/package.json`**

```json
{
  "name": "@oranje-wit/ti-studio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "^3.0.0",
    "@ai-sdk/google": "^3.0.53",
    "@ai-sdk/react": "^3.0.143",
    "@anthropic-ai/sdk": "^0.78.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@oranje-wit/auth": "workspace:*",
    "@oranje-wit/database": "workspace:*",
    "@oranje-wit/teamindeling-shared": "workspace:*",
    "@oranje-wit/types": "workspace:*",
    "@oranje-wit/ui": "workspace:*",
    "@react-spring/web": "^10.0.3",
    "@use-gesture/react": "^10.3.1",
    "ai": "^6.0.141",
    "framer-motion": "^12.0.0",
    "lucide-react": "^1.7.0",
    "next": "16.1.6",
    "next-auth": "5.0.0-beta.28",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-markdown": "^10.1.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@oranje-wit/test-utils": "workspace:*",
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^5.1.4",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "jsdom": "^28.1.0",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.0.18"
  }
}
```

> **Let op:** Neem geen `@simplewebauthn/browser`, `recharts`, `nodemailer` mee — die zijn niet nodig voor TI-Studio. Controleer de uiteindelijke import-lijst na de code-migratie (Task 4–7) en verwijder onnodige dependencies.

- [ ] **Stap 3: Schrijf `apps/ti-studio/next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.platform === "win32" ? undefined : "standalone",
  transpilePackages: [
    "@oranje-wit/database",
    "@oranje-wit/types",
    "@oranje-wit/auth",
    "@oranje-wit/ui",
    "@oranje-wit/teamindeling-shared",
  ],
  serverExternalPackages: ["pg", "pg-connection-string", "pgpass"],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: [
        "teamindeling.ckvoranjewit.app",
        "localhost:3001",
      ],
    },
  },
};

export default nextConfig;
```

> **Let op:** Geen PWA voor TI-Studio — dat is een desktop-only TC-tool.

- [ ] **Stap 4: Kopieer Tailwind/PostCSS config van `apps/web`**

Lees `apps/web/postcss.config.mjs` en `apps/web/tailwind.config.ts` en maak identieke bestanden in `apps/ti-studio/`. De Tailwind-config verwijst naar `./src/**` — dat is correct voor de nieuwe app.

- [ ] **Stap 5: Schrijf `apps/ti-studio/tsconfig.json`**

```json
{
  "compilerOptions": {
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
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Stap 6: Schrijf `apps/ti-studio/src/app/globals.css`**

Kopieer de inhoud van `apps/web/src/app/(teamindeling-studio)/ti-studio/teamindeling.css` (of de equivalente CSS file voor TI-Studio) naar `apps/ti-studio/src/app/globals.css`.

Zorg dat de Tailwind import bovenaan staat:
```css
@import "tailwindcss";
/* ...rest van de custom CSS... */
```

- [ ] **Stap 7: Schrijf `apps/ti-studio/src/app/layout.tsx`**

Gebaseerd op de huidige `apps/web/src/app/(teamindeling-studio)/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { SeizoenProvider } from "@oranje-wit/teamindeling-shared/seizoen-provider";
import { getActiefSeizoen, isWerkseizoenCheck } from "@oranje-wit/teamindeling-shared/seizoen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TI Studio — c.k.v. Oranje Wit",
  description: "Team-Indeling Studio",
};

export default async function RootLayout({
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
    <html lang="nl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
          {children}
        </SeizoenProvider>
      </body>
    </html>
  );
}
```

> **Let op:** `TiStudioPageShell` wordt in Task 4 gemigreerd. Voeg hem pas toe aan dit layout nadat hij beschikbaar is in `apps/ti-studio/src/components/`.

- [ ] **Stap 8: Schrijf `apps/ti-studio/src/app/page.tsx`**

```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/indeling");
}
```

- [ ] **Stap 9: Voeg `/login` stub toe zodat de redirect werkt**

Maak `apps/ti-studio/src/app/login/page.tsx`:

```typescript
// Tijdelijke stub — wordt vervangen zodra auth volledig is geconfigureerd
import { redirect } from "next/navigation";

export default function LoginPage() {
  // NextAuth handelt login af via de callback URL
  redirect("/api/auth/signin");
}
```

- [ ] **Stap 10: Installeer dependencies**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm install
```

Verwacht: geen errors.

- [ ] **Stap 11: Typecheck**

```bash
pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit
```

Verwacht: geen errors (of alleen "cannot find module" voor nog niet gemigreerde componenten — die komen in Task 4-7).

- [ ] **Stap 12: Commit**

```bash
git add apps/ti-studio/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat: initialiseer apps/ti-studio Next.js app scaffold"
```

---

## Task 4: Migreer TI-Studio app routes (blok 1)

**Files:**
- Copy: `apps/web/src/app/(teamindeling-studio)/ti-studio/**` → `apps/ti-studio/src/app/**`

De route-structuur verandert: `/ti-studio/indeling` wordt `/indeling` (want de hele app IS TI-Studio).

- [ ] **Stap 1: Kopieer alle route-mappen**

Kopieer de volgende mappen inhoud-voor-inhoud van `apps/web/src/app/(teamindeling-studio)/ti-studio/` naar `apps/ti-studio/src/app/`:

```
dashboard/  →  apps/ti-studio/src/app/dashboard/
indeling/   →  apps/ti-studio/src/app/indeling/
kader/      →  apps/ti-studio/src/app/kader/
memo/       →  apps/ti-studio/src/app/memo/
personen/   →  apps/ti-studio/src/app/personen/
```

Bestanden in de root (`error.tsx`, `loading.tsx`) ook kopiëren naar `apps/ti-studio/src/app/`.

- [ ] **Stap 2: Update alle `@/` imports in de gekopieerde bestanden**

Zoek alle imports in `apps/ti-studio/src/app/` die verwijzen naar:
- `@/lib/teamindeling/seizoen` → `@oranje-wit/teamindeling-shared/seizoen`
- `@/components/teamindeling/providers/SeizoenProvider` → `@oranje-wit/teamindeling-shared/seizoen-provider`
- `@/lib/teamindeling/...` → `@/lib/...` (die lib-bestanden komen in Task 7)
- `@/components/ti-studio/...` → `@/components/...` (die componenten komen in Task 5)

- [ ] **Stap 3: Update interne links die `/ti-studio/` bevatten**

Zoek alle `href`, `redirect()`, `router.push()` calls in de gekopieerde bestanden die `/ti-studio/` bevatten:

```bash
grep -r "ti-studio/" apps/ti-studio/src/app/ --include="*.ts" --include="*.tsx"
```

Vervang `/ti-studio/indeling` → `/indeling`, `/ti-studio/kader` → `/kader`, etc.

- [ ] **Stap 4: Typecheck**

```bash
pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit
```

Verwacht: type-errors voor nog ontbrekende componenten (Tasks 5-7) — dat is normaal. Zorg dat er geen syntax-errors of import-fouten zijn voor al wél beschikbare modules.

- [ ] **Stap 5: Commit**

```bash
git add apps/ti-studio/src/app/
git commit -m "feat(ti-studio): migreer app routes naar apps/ti-studio"
```

---

## Task 5: Migreer TI-Studio components (blok 2)

**Files:**
- Copy: `apps/web/src/components/ti-studio/**` → `apps/ti-studio/src/components/**`

- [ ] **Stap 1: Kopieer de volledige components directory**

Kopieer alles van `apps/web/src/components/ti-studio/` naar `apps/ti-studio/src/components/`.

- [ ] **Stap 2: Update alle `@/` imports**

Zoek in `apps/ti-studio/src/components/` imports die verwijzen naar:
- `@/lib/teamindeling/seizoen` → `@oranje-wit/teamindeling-shared/seizoen`
- `@/components/teamindeling/providers/SeizoenProvider` → `@oranje-wit/teamindeling-shared/seizoen-provider`
- `@/lib/teamindeling/...` → `@/lib/...` (lib komt in Task 7)

- [ ] **Stap 3: Update `apps/ti-studio/src/app/layout.tsx` met `TiStudioPageShell`**

Nu `TiStudioPageShell` beschikbaar is in `apps/ti-studio/src/components/`, voeg hem toe aan het layout:

```typescript
import { TiStudioPageShell } from "@/components/werkbord/TiStudioPageShell";
// (of het pad waar TiStudioPageShell staat in de gekopieerde structuur)
```

Wrap `{children}` met `<TiStudioPageShell>`.

- [ ] **Stap 4: Typecheck**

```bash
pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit
```

Verwacht: minder errors dan na Task 4. Nog verwachte errors voor ontbrekende lib-bestanden (Task 7).

- [ ] **Stap 5: Commit**

```bash
git add apps/ti-studio/src/components/ apps/ti-studio/src/app/layout.tsx
git commit -m "feat(ti-studio): migreer components naar apps/ti-studio"
```

---

## Task 6: Migreer TI-Studio API routes (blok 3)

**Files:**
- Copy: `apps/web/src/app/api/ti-studio/**` → `apps/ti-studio/src/app/api/**`

- [ ] **Stap 1: Kopieer de API routes**

Kopieer alles van `apps/web/src/app/api/ti-studio/` naar `apps/ti-studio/src/app/api/`.

Dit zijn twee routes:
- `indeling/[versieId]/route.ts`
- `indeling/[versieId]/stream/route.ts`

- [ ] **Stap 2: Update imports**

Zoek en vervang `@/lib/` imports en `@/components/` imports in de gekopieerde API-bestanden. Zelfde patroon als Tasks 4 en 5.

- [ ] **Stap 3: Typecheck**

```bash
pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit
```

- [ ] **Stap 4: Commit**

```bash
git add apps/ti-studio/src/app/api/
git commit -m "feat(ti-studio): migreer API routes naar apps/ti-studio"
```

---

## Task 7: Migreer TI-Studio lib utilities (blok 4)

**Files:**
- Copy: TI-Studio-specifieke bestanden uit `apps/web/src/lib/teamindeling/` → `apps/ti-studio/src/lib/`

- [ ] **Stap 1: Identificeer welke lib-bestanden exclusief TI-Studio zijn**

```bash
ls apps/web/src/lib/teamindeling/
```

Bestanden die uitsluitend door TI-Studio gebruikt worden (niet door `/teamindeling` mobile) zijn candidates om mee te kopiëren. Vergelijk met wat de mobile app importeert:

```bash
grep -r "lib/teamindeling" apps/web/src/app/\(teamindeling\)/ --include="*.ts" --include="*.tsx"
```

TI-Studio-specifieke bestanden (verwacht — verifieer zelf):
- `validatie/`, `validatie-engine.ts`, `validatie-update.ts`
- `whatif/`
- `besluit-routing.ts`
- `teamKaartStijl.ts`
- `teamstructuur.ts`
- `db/` (als aanwezig)
- `rating.ts`, `doorstroom-signalering.ts`

Gedeeld met mobile (blijft in `apps/web`, al opgepakt in Task 2):
- `seizoen.ts` — al in `@oranje-wit/teamindeling-shared`

- [ ] **Stap 2: Kopieer TI-Studio-specifieke bestanden**

```bash
cp -r apps/web/src/lib/teamindeling/validatie apps/ti-studio/src/lib/validatie
# etc. voor elk TI-Studio-specifiek bestand/map
```

- [ ] **Stap 3: Update imports in de gekopieerde lib-bestanden**

Zorg dat alle interne cross-references kloppen (relatieve paths).

- [ ] **Stap 4: Typecheck — verwacht: volledig groen**

```bash
pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit
```

Verwacht: **0 errors**. Als er nog errors zijn, los ze op voor verder te gaan.

- [ ] **Stap 5: Dev server starten en handmatig testen**

```bash
pnpm --filter @oranje-wit/ti-studio dev
```

Open `http://localhost:3001` in de browser. Navigeer door:
- `/indeling` — werkbord laadt
- `/kader` — kaders laadt
- `/memo` — memo's laden
- `/personen/spelers` — spelers laden

- [ ] **Stap 6: Unit tests draaien**

```bash
pnpm --filter @oranje-wit/ti-studio test
```

Verwacht: alle tests groen (of "no tests found" als er nog geen test-files zijn).

- [ ] **Stap 7: Commit**

```bash
git add apps/ti-studio/src/lib/
git commit -m "feat(ti-studio): migreer lib utilities — apps/ti-studio volledig werkend"
```

---

## Task 8: Update auth cookie domain

De NextAuth cookie moet geldig zijn op zowel `ckvoranjewit.app` als `teamindeling.ckvoranjewit.app`. Dit doe je door `domain: '.ckvoranjewit.app'` toe te voegen.

**Files:**
- Modify: `packages/auth/src/index.ts`

- [ ] **Stap 1: Lees de huidige cookie-configuratie**

Lees `packages/auth/src/index.ts` volledig.

- [ ] **Stap 2: Voeg `domain` toe aan de sessionToken cookie**

Zoek het blok:
```typescript
cookies: {
  sessionToken: {
    name: "ow-session",
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  },
},
```

Vervang door:
```typescript
cookies: {
  sessionToken: {
    name: "ow-session",
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
      domain: ".ckvoranjewit.app",
    },
  },
},
```

- [ ] **Stap 3: Typecheck alle packages die auth gebruiken**

```bash
pnpm --filter @oranje-wit/web exec tsc --noEmit
pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit
```

- [ ] **Stap 4: Commit**

```bash
git add packages/auth/src/index.ts
git commit -m "fix(auth): cookie domain .ckvoranjewit.app voor cross-subdomain sessie"
```

---

## Task 9: Update CI voor twee apps

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Stap 1: Lees de huidige CI configuratie volledig**

Lees `.github/workflows/ci.yml`.

- [ ] **Stap 2: Voeg typecheck + lint voor `apps/ti-studio` toe aan `fast-gate`**

In de `fast-gate` job, na de bestaande `pnpm --filter @oranje-wit/web` stappen, voeg toe:

```yaml
- name: Typecheck (ti-studio)
  run: pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit

- name: Lint (ti-studio)
  run: pnpm --filter @oranje-wit/ti-studio lint

- name: Tests (ti-studio)
  run: pnpm --filter @oranje-wit/ti-studio test
```

- [ ] **Stap 3: Voeg build stap toe voor `apps/ti-studio` in de `build` job**

Voeg na de bestaande Next.js build voor `apps/web` een parallelle of opeenvolgende build toe:

```yaml
- name: Build (ti-studio)
  env:
    DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
    NEXTAUTH_SECRET: ci-build-secret
    NEXTAUTH_URL: http://localhost:3001
    ANTHROPIC_API_KEY: sk-dummy-key
  run: pnpm --filter @oranje-wit/ti-studio build
```

- [ ] **Stap 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: voeg apps/ti-studio toe aan fast-gate en build jobs"
```

- [ ] **Stap 5: Push en wacht op CI**

```bash
git push
```

Ga naar GitHub Actions en verifieer dat de CI groen is voor alle jobs.

---

## Task 10: E2E tests updaten voor apps/ti-studio

De bestaande TI-Studio E2E tests draaien momenteel tegen `apps/web`. Ze moeten straks draaien tegen `apps/ti-studio` op een andere poort/URL.

**Files:**
- Modify: `e2e/ti-studio/*.spec.ts` (alle 7 bestanden)
- Modify: Playwright config (als er een aparte baseURL voor TI-Studio tests is)

- [ ] **Stap 1: Lees de Playwright configuratie**

Lees `playwright.config.ts` (in de repo root).

- [ ] **Stap 2: Voeg een tweede project toe voor TI-Studio**

In `playwright.config.ts`, voeg toe (of update de bestaande config):

```typescript
projects: [
  {
    name: "web",
    use: { baseURL: "http://localhost:3000" },
    testMatch: "e2e/!(ti-studio)/**/*.spec.ts",
  },
  {
    name: "ti-studio",
    use: { baseURL: "http://localhost:3001" },
    testMatch: "e2e/ti-studio/**/*.spec.ts",
  },
],
```

> **Let op:** Pas dit aan op de werkelijke huidige structuur van `playwright.config.ts`. Lees hem eerst volledig.

- [ ] **Stap 3: Update URL-referenties in TI-Studio E2E tests**

Vervang alle hardcoded `/ti-studio/` paden in `e2e/ti-studio/*.spec.ts`:
- `page.goto("/ti-studio/indeling")` → `page.goto("/indeling")`
- `page.goto("/ti-studio/kader")` → `page.goto("/kader")`
- etc.

- [ ] **Stap 4: Draai de TI-Studio E2E tests lokaal**

Start beide dev servers:
```bash
# Terminal 1:
pnpm --filter @oranje-wit/web dev

# Terminal 2:
pnpm --filter @oranje-wit/ti-studio dev
```

Draai dan de tests:
```bash
pnpm test:e2e --project=ti-studio
```

Verwacht: alle 7 TI-Studio tests slagen.

- [ ] **Stap 5: Commit**

```bash
git add playwright.config.ts e2e/ti-studio/
git commit -m "test(e2e): configureer TI-Studio tests voor apps/ti-studio (poort 3001)"
```

---

## Task 11: Verwijder TI-Studio uit `apps/web` *(na goedkeuring productie)*

> **⚠️ Voer dit pas uit nadat `apps/ti-studio` in productie draait en geverifieerd is.**

**Files:**
- Delete: `apps/web/src/app/(teamindeling-studio)/`
- Delete: `apps/web/src/components/ti-studio/`
- Delete: `apps/web/src/app/api/ti-studio/`
- Modify: `packages/ui/src/navigation/manifest.ts` (verwijder TI-Studio uit apps/web manifest)

- [ ] **Stap 1: Verwijder de TI-Studio route-group**

```bash
rm -rf apps/web/src/app/\(teamindeling-studio\)/
```

- [ ] **Stap 2: Verwijder de TI-Studio componenten**

```bash
rm -rf apps/web/src/components/ti-studio/
```

- [ ] **Stap 3: Verwijder de TI-Studio API routes**

```bash
rm -rf apps/web/src/app/api/ti-studio/
```

- [ ] **Stap 4: Verwijder TI-Studio uit de navigatielijst van `apps/web`**

Lees `packages/ui/src/navigation/manifest.ts`. Verwijder de TI_STUDIO entry uit de navigatielijst die `apps/web` gebruikt. De `TI_STUDIO` manifest-definitie zelf mag blijven bestaan (ook `apps/ti-studio` gebruikt hem).

- [ ] **Stap 5: Verwijder `@/components/teamindeling/providers/SeizoenProvider` en `@/lib/teamindeling/seizoen` originelen**

Nu beide apps vanuit `@oranje-wit/teamindeling-shared` importeren, kunnen de originelen verwijderd worden:

```bash
rm apps/web/src/lib/teamindeling/seizoen.ts
rm apps/web/src/components/teamindeling/providers/SeizoenProvider.tsx
```

> **Let op:** Voer eerst `grep -r "lib/teamindeling/seizoen\|providers/SeizoenProvider" apps/web/src/` uit om te bevestigen dat er geen overgebleven imports zijn.

- [ ] **Stap 6: Typecheck `apps/web`**

```bash
pnpm --filter @oranje-wit/web exec tsc --noEmit
```

Verwacht: 0 errors.

- [ ] **Stap 7: Tests draaien**

```bash
pnpm test
pnpm test:e2e --project=web
```

Verwacht: alles groen.

- [ ] **Stap 8: Commit**

```bash
git add -A
git commit -m "feat: verwijder TI-Studio uit apps/web — migratie voltooid"
```

---

## Task 12: Infrastructure — Railway & DNS *(handmatige stappen)*

> **Dit zijn handmatige stappen buiten de CI/CD pipeline. Gebruik `/railway` skill voor Railway-specifieke commando's.**

- [ ] **Stap 1: Maak nieuwe Railway service aan voor `apps/ti-studio`**

Ga naar [Railway dashboard](https://railway.app) → project `oranje-wit` → "New Service" → "GitHub Repo" → selecteer dezelfde repo → kies root directory `apps/ti-studio`.

Omgevingsvariabelen kopiëren van de bestaande `web` service:
- `DATABASE_URL`
- `DATABASE_DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` → instellen op `https://teamindeling.ckvoranjewit.app`
- `ANTHROPIC_API_KEY`
- Overige app-specifieke vars

- [ ] **Stap 2: Voeg custom domain toe aan de nieuwe service**

In Railway → nieuwe service → "Settings" → "Custom Domains" → voeg `teamindeling.ckvoranjewit.app` toe.

- [ ] **Stap 3: Wijs `teamindeling.ckvoranjewit.app` CNAME naar nieuwe service**

Ga naar IONOS DNS-beheer. Wijzig de CNAME voor `teamindeling` van de oude Railway URL naar de nieuwe Railway service URL.

> **Let op:** Gebruik de `/railway` skill voor de exacte Railway CLI commando's.

- [ ] **Stap 4: Verwijder `teamindeling.ckvoranjewit.app` van de oude `apps/web` Railway service**

In Railway → bestaande `web` service → "Settings" → "Custom Domains" → verwijder `teamindeling.ckvoranjewit.app`.

- [ ] **Stap 5: Verifieer in productie**

Open `https://teamindeling.ckvoranjewit.app` — TI-Studio laadt. Controleer:
- Login werkt (Google OAuth redirect)
- Sessie is geldig op `teamindeling.*` én `ckvoranjewit.app`
- Werkbord laadt teams en spelers
- Drag-drop werkt

- [ ] **Stap 6: Voer Task 11 (verwijderen uit apps/web) uit na verificatie**

---

## Zelf-review checklist

- [x] **Spec coverage:** Alle vier fasen uit de spec zijn gedekt (Tasks 1-2 = fase 1, Tasks 3-7 = fase 2, Task 8 + 12 = fase 3, Tasks 9-11 = fase 4)
- [x] **Cookie domain:** Fase 3 auth-aanpassing staat in Task 8 vóór de DNS-switch in Task 12
- [x] **Placeholder scan:** Geen TBD's — alle stappen bevatten concrete commando's of code
- [x] **Type consistency:** `@oranje-wit/teamindeling-shared` importpad consistent door alle tasks
- [x] **Veiligheidsregel:** apps/web wordt pas opgeruimd na verifieerde productie (Task 11 na Task 12)
