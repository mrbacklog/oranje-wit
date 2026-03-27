# Evaluatie-app — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Volledige evaluatie-app bouwen als `apps/evaluatie/` in de monorepo — trainers vullen spelerevaluaties in via token-links, coördinatoren reviewen, TC-leden beheren rondes.

**Architecture:** Next.js 16 app met Tailwind CSS 4, gedeelde Prisma database, token-gebaseerde auth voor trainers/coördinatoren/spelers, Nodemailer + Google Workspace SMTP voor e-mail. Spelers en teams komen direct uit bestaande database (geen CSV-import). Admin-gedeelte beschermd via NextAuth v5 (Google OAuth).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Prisma 7, Nodemailer, Zod, Vitest, Railway deployment

**Referentiebestanden (lees deze bij twijfel):**
- Prisma schema: `packages/database/prisma/schema.prisma`
- Auth package: `packages/auth/src/index.ts`, `packages/auth/src/allowlist.ts`, `packages/auth/src/checks.ts`
- API helpers (kopieer patroon): `apps/team-indeling/src/lib/api/response.ts`, `apps/team-indeling/src/lib/api/validate.ts`
- Types: `packages/types/src/index.ts`, `packages/types/src/constanten.ts`
- App referentie: `apps/team-indeling/package.json`, `apps/team-indeling/Dockerfile`, `apps/team-indeling/next.config.ts`
- Bestaande evaluatie types: `apps/team-indeling/src/components/scenario/types.ts` (regels 137-171)

**Conventies (VERPLICHT):**
- Logger: `import { logger } from "@oranje-wit/types"` — nooit `console.log`
- API routes: `ok(data)` / `fail(message)` uit `@/lib/api`
- Validatie: Zod schema's via `parseBody(request, Schema)`
- Constanten: importeer `HUIDIG_SEIZOEN`, `PEILJAAR` uit `@oranje-wit/types`
- Taal: alle UI-teksten in het Nederlands
- Max 400 regels per bestand

---

## Fase 1: Database & App-fundament

### Task 1: Prisma schema uitbreiden

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Voeg nieuwe modellen toe aan schema**

Voeg onderaan het bestaande schema toe (na het `Evaluatie` model):

```prisma
// ============================================================
// EVALUATIE-RONDE
// ============================================================
model EvaluatieRonde {
  id       String @id @default(cuid())
  seizoen  String
  ronde    Int
  naam     String                          // "Evaluatieronde 1"
  type     String @default("trainer")      // "trainer" | "speler"
  deadline DateTime @db.Timestamptz(6)
  status   String @default("concept")      // "concept" | "actief" | "gesloten"

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  uitnodigingen EvaluatieUitnodiging[]
  evaluaties    Evaluatie[]

  @@unique([seizoen, ronde, type])
  @@map("evaluatie_rondes")
}

// ============================================================
// COORDINATOR
// ============================================================
model Coordinator {
  id    String @id @default(cuid())
  naam  String
  email String @unique

  teams CoordinatorTeam[]

  createdAt DateTime @default(now())

  @@map("coordinatoren")
}

model CoordinatorTeam {
  id            String      @id @default(cuid())
  coordinatorId String
  coordinator   Coordinator @relation(fields: [coordinatorId], references: [id], onDelete: Cascade)
  owTeamId      Int         @map("ow_team_id")
  owTeam        OWTeam      @relation(fields: [owTeamId], references: [id])
  seizoen       String

  @@unique([coordinatorId, owTeamId, seizoen])
  @@map("coordinator_teams")
}

// ============================================================
// UITNODIGING — token-gebaseerde toegang
// ============================================================
model EvaluatieUitnodiging {
  id      String         @id @default(cuid())
  rondeId String
  ronde   EvaluatieRonde @relation(fields: [rondeId], references: [id], onDelete: Cascade)

  type    String                            // "trainer" | "coordinator" | "speler"
  email   String
  naam    String

  // Voor trainers/coordinatoren: welk team
  owTeamId Int?          @map("ow_team_id")
  owTeam   OWTeam?       @relation(fields: [owTeamId], references: [id])

  // Voor spelers: welke speler
  spelerId String?

  // Token
  token    String @unique @default(cuid())

  // Status
  emailVerstuurd    DateTime? @map("email_verstuurd") @db.Timestamptz(6)
  reminderVerstuurd DateTime? @map("reminder_verstuurd") @db.Timestamptz(6)
  reminderAantal    Int       @default(0) @map("reminder_aantal")

  createdAt DateTime @default(now())

  @@unique([rondeId, email, owTeamId])
  @@map("evaluatie_uitnodigingen")
}

// ============================================================
// SPELER ZELF-EVALUATIE
// ============================================================
model SpelerZelfEvaluatie {
  id       String @id @default(cuid())
  spelerId String
  speler   Speler @relation(fields: [spelerId], references: [id])
  seizoen  String
  ronde    Int    @default(1)
  rondeId  String?

  // Plezier & Sfeer (elk 1-5)
  plezierKorfbal     Int? @map("plezier_korfbal")
  plezierTeam        Int? @map("plezier_team")
  plezierUitdaging   Int? @map("plezier_uitdaging")
  plezierToelichting String? @map("plezier_toelichting") @db.Text

  // Trainingen & Wedstrijden (elk 1-5)
  trainingZin         Int? @map("training_zin")
  trainingKwaliteit   Int? @map("training_kwaliteit")
  wedstrijdBeleving   Int? @map("wedstrijd_beleving")
  trainingVerbetering Int? @map("training_verbetering")
  trainingToelichting String? @map("training_toelichting") @db.Text

  // Toekomst
  toekomstIntentie    String? @map("toekomst_intentie")    // "stop" | "unsure" | "continue"
  toekomstAmbitie     String? @map("toekomst_ambitie")     // "higher" | "same" | "lower"
  toekomstToelichting String? @map("toekomst_toelichting") @db.Text

  // Algemeen
  algemeenOpmerking   String? @map("algemeen_opmerking") @db.Text

  // Meta
  coordinatorMemo         String?   @map("coordinator_memo") @db.Text
  status                  String    @default("concept")  // "concept" | "ingediend"
  ingediendOp             DateTime? @map("ingediend_op") @db.Timestamptz(6)

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@unique([spelerId, seizoen, ronde])
  @@map("speler_zelf_evaluaties")
}

// ============================================================
// E-MAIL TEMPLATE (beheerbaar door admin)
// ============================================================
model EmailTemplate {
  id          String @id @default(cuid())
  sleutel     String @unique                // "trainer_uitnodiging", "trainer_herinnering", etc.
  onderwerp   String
  inhoudHtml  String @map("inhoud_html") @db.Text

  updatedAt DateTime @default(now()) @updatedAt

  @@map("email_templates")
}
```

**Step 2: Breid bestaand `Evaluatie` model uit**

Voeg velden toe aan het bestaande `Evaluatie` model:

```prisma
model Evaluatie {
  // ... bestaande velden blijven ...

  // Nieuw:
  rondeId         String?        @map("ronde_id")
  evaluatieRonde  EvaluatieRonde? @relation(fields: [rondeId], references: [id])
  coordinatorMemo String?        @map("coordinator_memo") @db.Text
  status          String         @default("concept")  // "concept" | "ingediend"
  ingediendOp     DateTime?      @map("ingediend_op") @db.Timestamptz(6)

  // Voeg index toe:
  @@index([rondeId])
}
```

**Step 3: Voeg relaties toe aan bestaande modellen**

In model `Speler`, voeg toe bij de relaties:
```prisma
zelfEvaluaties  SpelerZelfEvaluatie[]
```

In model `OWTeam`, voeg toe bij de relaties:
```prisma
coordinatoren  CoordinatorTeam[]
uitnodigingen  EvaluatieUitnodiging[]
```

**Step 4: Genereer Prisma client**

Run: `pnpm db:generate`
Expected: Prisma client gegenereerd zonder fouten.

**LET OP: NIET `pnpm db:push` draaien — dit kan de `speler_seizoenen` VIEW droppen. Schema-wijzigingen naar de database moeten handmatig met SQL of via een aparte migratie.**

**Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(evaluatie): prisma schema uitbreiden met EvaluatieRonde, Coordinator, Uitnodiging, SpelerZelfEvaluatie, EmailTemplate"
```

---

### Task 2: Database migreren (SQL)

**Files:**
- Create: `packages/database/migrations/2026-03-03-evaluatie-modellen.sql`

**Step 1: Schrijf SQL migratie**

```sql
-- Evaluatie-rondes
CREATE TABLE IF NOT EXISTS evaluatie_rondes (
  id TEXT PRIMARY KEY,
  seizoen TEXT NOT NULL,
  ronde INTEGER NOT NULL,
  naam TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'trainer',
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'concept',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seizoen, ronde, type)
);

-- Coordinatoren
CREATE TABLE IF NOT EXISTS coordinatoren (
  id TEXT PRIMARY KEY,
  naam TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coordinator-team koppeling
CREATE TABLE IF NOT EXISTS coordinator_teams (
  id TEXT PRIMARY KEY,
  "coordinatorId" TEXT NOT NULL REFERENCES coordinatoren(id) ON DELETE CASCADE,
  ow_team_id INTEGER NOT NULL REFERENCES teams(id),
  seizoen TEXT NOT NULL,
  UNIQUE ("coordinatorId", ow_team_id, seizoen)
);

-- Evaluatie-uitnodigingen
CREATE TABLE IF NOT EXISTS evaluatie_uitnodigingen (
  id TEXT PRIMARY KEY,
  "rondeId" TEXT NOT NULL REFERENCES evaluatie_rondes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  email TEXT NOT NULL,
  naam TEXT NOT NULL,
  ow_team_id INTEGER REFERENCES teams(id),
  "spelerId" TEXT,
  token TEXT NOT NULL UNIQUE,
  email_verstuurd TIMESTAMPTZ,
  reminder_verstuurd TIMESTAMPTZ,
  reminder_aantal INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("rondeId", email, ow_team_id)
);

-- Speler zelf-evaluaties
CREATE TABLE IF NOT EXISTS speler_zelf_evaluaties (
  id TEXT PRIMARY KEY,
  "spelerId" TEXT NOT NULL REFERENCES "Speler"(id),
  seizoen TEXT NOT NULL,
  ronde INTEGER NOT NULL DEFAULT 1,
  "rondeId" TEXT,
  plezier_korfbal INTEGER,
  plezier_team INTEGER,
  plezier_uitdaging INTEGER,
  plezier_toelichting TEXT,
  training_zin INTEGER,
  training_kwaliteit INTEGER,
  wedstrijd_beleving INTEGER,
  training_verbetering INTEGER,
  training_toelichting TEXT,
  toekomst_intentie TEXT,
  toekomst_ambitie TEXT,
  toekomst_toelichting TEXT,
  algemeen_opmerking TEXT,
  coordinator_memo TEXT,
  status TEXT NOT NULL DEFAULT 'concept',
  ingediend_op TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("spelerId", seizoen, ronde)
);

-- E-mail templates
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  sleutel TEXT NOT NULL UNIQUE,
  onderwerp TEXT NOT NULL,
  inhoud_html TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluatie tabel uitbreiden
ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS ronde_id TEXT REFERENCES evaluatie_rondes(id);
ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS coordinator_memo TEXT;
ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'concept';
ALTER TABLE "Evaluatie" ADD COLUMN IF NOT EXISTS ingediend_op TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_evaluatie_ronde_id ON "Evaluatie" (ronde_id);

-- Seed: standaard e-mail templates
INSERT INTO email_templates (id, sleutel, onderwerp, inhoud_html) VALUES
  ('tpl_trainer_uit', 'trainer_uitnodiging', 'Uitnodiging evaluatieronde {{ronde_naam}}',
   '<h2>Hoi {{trainer_naam}},</h2><p>Je bent uitgenodigd om de evaluatie in te vullen voor <strong>{{team_naam}}</strong>.</p><p>De deadline is <strong>{{deadline}}</strong>.</p><p><a href="{{link}}">Klik hier om de evaluatie in te vullen</a></p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>'),
  ('tpl_trainer_her', 'trainer_herinnering', 'Herinnering: evaluatie {{team_naam}} — deadline {{deadline}}',
   '<h2>Hoi {{trainer_naam}},</h2><p>Dit is een herinnering om de evaluatie in te vullen voor <strong>{{team_naam}}</strong>.</p><p>De deadline is <strong>{{deadline}}</strong>.</p><p><a href="{{link}}">Klik hier om de evaluatie in te vullen</a></p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>'),
  ('tpl_trainer_bev', 'trainer_bevestiging', 'Evaluatie ontvangen — {{team_naam}}',
   '<h2>Bedankt {{trainer_naam}},</h2><p>We hebben je evaluatie voor <strong>{{team_naam}}</strong> ontvangen.</p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>'),
  ('tpl_coord_not', 'coordinator_notificatie', 'Nieuwe evaluatie ingediend — {{team_naam}}',
   '<h2>Hoi {{coordinator_naam}},</h2><p><strong>{{trainer_naam}}</strong> heeft de evaluatie voor <strong>{{team_naam}}</strong> ingediend.</p><p><a href="{{link}}">Bekijk de evaluatie</a></p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>'),
  ('tpl_coord_uit', 'coordinator_uitnodiging', 'Evaluatieronde {{ronde_naam}} — jouw teams',
   '<h2>Hoi {{coordinator_naam}},</h2><p>Er is een nieuwe evaluatieronde gestart: <strong>{{ronde_naam}}</strong>.</p><p>Jouw teams: {{team_namen}}</p><p><a href="{{link}}">Bekijk het overzicht</a></p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>'),
  ('tpl_speler_uit', 'speler_uitnodiging', 'Uitnodiging zelfevaluatie — {{ronde_naam}}',
   '<h2>Hoi {{speler_naam}},</h2><p>Je bent uitgenodigd om een zelfevaluatie in te vullen.</p><p>De deadline is <strong>{{deadline}}</strong>.</p><p><a href="{{link}}">Klik hier om de zelfevaluatie in te vullen</a></p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>'),
  ('tpl_speler_her', 'speler_herinnering', 'Herinnering: zelfevaluatie — deadline {{deadline}}',
   '<h2>Hoi {{speler_naam}},</h2><p>Dit is een herinnering om je zelfevaluatie in te vullen.</p><p><a href="{{link}}">Klik hier</a></p><p>Groeten,<br>TC c.k.v. Oranje Wit</p>')
ON CONFLICT (sleutel) DO NOTHING;
```

**Step 2: Draai de migratie op de database**

Run: `psql $DATABASE_URL -f packages/database/migrations/2026-03-03-evaluatie-modellen.sql`
Expected: alle tabellen aangemaakt, geen fouten.

**Step 3: Verifieer met Prisma**

Run: `pnpm db:generate`
Expected: client gegenereerd, geen type-fouten.

**Step 4: Commit**

```bash
git add packages/database/migrations/2026-03-03-evaluatie-modellen.sql
git commit -m "feat(evaluatie): SQL migratie voor evaluatie-tabellen + seed email templates"
```

---

### Task 3: Next.js app scaffolden

**Files:**
- Create: `apps/evaluatie/package.json`
- Create: `apps/evaluatie/next.config.ts`
- Create: `apps/evaluatie/tsconfig.json`
- Create: `apps/evaluatie/postcss.config.mjs`
- Create: `apps/evaluatie/src/app/globals.css`
- Create: `apps/evaluatie/src/app/layout.tsx`
- Create: `apps/evaluatie/src/app/page.tsx`
- Create: `apps/evaluatie/src/middleware.ts`
- Create: `apps/evaluatie/src/lib/db/prisma.ts`
- Create: `apps/evaluatie/src/lib/api/index.ts`
- Create: `apps/evaluatie/src/lib/api/response.ts`
- Create: `apps/evaluatie/src/lib/api/validate.ts`
- Create: `apps/evaluatie/eslint.config.mjs`
- Create: `apps/evaluatie/vitest.config.ts`
- Create: `apps/evaluatie/Dockerfile`
- Create: `apps/evaluatie/railway.json`

**Step 1: package.json**

```json
{
  "name": "@oranje-wit/evaluatie",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 4104",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@oranje-wit/auth": "workspace:*",
    "@oranje-wit/database": "workspace:*",
    "@oranje-wit/types": "workspace:*",
    "next": "16.1.6",
    "next-auth": "5.0.0-beta.28",
    "nodemailer": "^6.9.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/nodemailer": "^6.4.0",
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

**Step 2: next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types", "@oranje-wit/auth"],
};

export default nextConfig;
```

**Step 3: tsconfig.json**

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
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Step 5: globals.css**

```css
@import "tailwindcss";
```

**Step 6: layout.tsx**

```typescript
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evaluatie | c.k.v. Oranje Wit",
  description: "Spelerevaluaties voor c.k.v. Oranje Wit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${geist.variable} bg-gray-50 font-sans text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 7: page.tsx (landing)**

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-orange-600">Evaluatie</h1>
        <p className="mt-2 text-gray-500">c.k.v. Oranje Wit</p>
      </div>
    </main>
  );
}
```

**Step 8: middleware.ts**

De middleware beschermt alleen `/admin/*` routes via NextAuth. Token-routes (`/invullen`, `/coordinator`, `/zelf`) zijn publiek — authenticatie verloopt via het token in de URL.

```typescript
import { auth } from "@oranje-wit/auth";
import { NextResponse } from "next/server";

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Admin routes: NextAuth bescherming
  if (url.pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

**Step 9: lib/db/prisma.ts**

```typescript
export { prisma } from "@oranje-wit/database";
```

**Step 10: lib/api/ (kopieer patronen uit team-indeling)**

`lib/api/index.ts`:
```typescript
export { ok, fail } from "./response";
export { parseBody } from "./validate";
```

`lib/api/response.ts`:
```typescript
import { NextResponse } from "next/server";
import type { ApiResponse } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

export function ok<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data });
}

export function fail(
  message: string,
  status = 500,
  code = "INTERNAL_ERROR",
): NextResponse<ApiResponse<never>> {
  if (status >= 500) logger.error(`[API] ${code}: ${message}`);
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}
```

`lib/api/validate.ts`:
```typescript
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { fail } from "./response";

export async function parseBody<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const body = await request.json();
    return { ok: true as const, data: schema.parse(body) };
  } catch (error) {
    if (error instanceof ZodError) {
      const msg = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return { ok: false as const, response: fail(msg, 422, "VALIDATION_ERROR") };
    }
    return { ok: false as const, response: fail("Ongeldige JSON", 400, "BAD_REQUEST") };
  }
}
```

**Step 11: eslint.config.mjs**

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { sharedRules } from "../../eslint.config.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  { rules: sharedRules },
]);

export default eslintConfig;
```

**Step 12: vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

**Step 13: Dockerfile**

```dockerfile
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/auth/package.json packages/auth/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY apps/evaluatie/package.json apps/evaluatie/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/evaluatie/ apps/evaluatie/

RUN pnpm db:generate
RUN pnpm --filter @oranje-wit/evaluatie build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "--filter", "@oranje-wit/evaluatie", "start"]
```

**Step 14: railway.json**

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd ../.. && pnpm db:generate && pnpm --filter @oranje-wit/evaluatie build"
  },
  "deploy": {
    "startCommand": "cd ../.. && pnpm --filter @oranje-wit/evaluatie start",
    "healthcheckPath": "/"
  }
}
```

**Step 15: Voeg dev script toe aan root package.json**

In root `package.json`, voeg toe in scripts:
```json
"dev:evaluatie": "pnpm --filter @oranje-wit/evaluatie dev",
"build:evaluatie": "pnpm --filter @oranje-wit/evaluatie build",
"test:evaluatie": "pnpm --filter @oranje-wit/evaluatie test"
```

**Step 16: Installeer dependencies**

Run: `pnpm install`
Expected: lockfile bijgewerkt, geen fouten.

**Step 17: Test dat de app start**

Run: `pnpm dev:evaluatie`
Expected: Next.js dev server op poort 4104, landingspagina zichtbaar.

**Step 18: Commit**

```bash
git add apps/evaluatie/ package.json pnpm-lock.yaml
git commit -m "feat(evaluatie): scaffold Next.js app met auth, API helpers, Dockerfile"
```

---

### Task 4: E-mail systeem

**Files:**
- Create: `apps/evaluatie/src/lib/mail.ts`
- Create: `apps/evaluatie/src/lib/mail.test.ts`

**Step 1: Schrijf test voor template-rendering**

```typescript
import { describe, it, expect } from "vitest";
import { renderTemplate } from "./mail";

describe("renderTemplate", () => {
  it("vervangt placeholders", () => {
    const html = "<p>Hoi {{naam}}, je team is {{team}}.</p>";
    const result = renderTemplate(html, { naam: "Jan", team: "J1" });
    expect(result).toBe("<p>Hoi Jan, je team is J1.</p>");
  });

  it("laat onbekende placeholders staan", () => {
    const html = "<p>{{naam}} — {{onbekend}}</p>";
    const result = renderTemplate(html, { naam: "Jan" });
    expect(result).toBe("<p>Jan — {{onbekend}}</p>");
  });
});
```

**Step 2: Run test — moet falen**

Run: `pnpm test:evaluatie`
Expected: FAIL — `renderTemplate` bestaat nog niet.

**Step 3: Implementeer mail.ts**

```typescript
import nodemailer from "nodemailer";
import { logger } from "@oranje-wit/types";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,     // noreply@ckvoranjewit.app
    pass: process.env.SMTP_PASSWORD,  // Google Workspace app-wachtwoord
  },
});

/** Vervang {{sleutel}} placeholders in een HTML-template */
export function renderTemplate(
  html: string,
  variabelen: Record<string, string>,
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variabelen[key] ?? match;
  });
}

/** Verstuur een e-mail */
export async function verstuurEmail(params: {
  aan: string;
  onderwerp: string;
  html: string;
}): Promise<void> {
  const afzender = process.env.SMTP_USER ?? "noreply@ckvoranjewit.app";

  try {
    await transporter.sendMail({
      from: `"c.k.v. Oranje Wit" <${afzender}>`,
      to: params.aan,
      subject: params.onderwerp,
      html: params.html,
    });
    logger.info(`E-mail verstuurd naar ${params.aan}: ${params.onderwerp}`);
  } catch (error) {
    logger.error("E-mail versturen mislukt:", error);
    throw error;
  }
}
```

**Step 4: Run test — moet slagen**

Run: `pnpm test:evaluatie`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/evaluatie/src/lib/mail.ts apps/evaluatie/src/lib/mail.test.ts
git commit -m "feat(evaluatie): e-mail systeem met Nodemailer + template rendering"
```

---

### Task 5: Token-authenticatie helper

**Files:**
- Create: `apps/evaluatie/src/lib/tokens.ts`
- Create: `apps/evaluatie/src/lib/tokens.test.ts`

**Step 1: Schrijf test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { valideerToken } from "./tokens";

// Mock prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    evaluatieUitnodiging: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";

describe("valideerToken", () => {
  it("retourneert null voor onbekend token", async () => {
    vi.mocked(prisma.evaluatieUitnodiging.findUnique).mockResolvedValue(null);
    const result = await valideerToken("onbekend");
    expect(result).toBeNull();
  });

  it("retourneert uitnodiging voor geldig token", async () => {
    const mockUitnodiging = {
      id: "uit1",
      type: "trainer",
      naam: "Jan",
      email: "jan@test.nl",
      owTeamId: 1,
      ronde: { seizoen: "2025-2026", status: "actief" },
    };
    vi.mocked(prisma.evaluatieUitnodiging.findUnique).mockResolvedValue(
      mockUitnodiging as never,
    );
    const result = await valideerToken("geldig-token");
    expect(result).toEqual(mockUitnodiging);
  });
});
```

**Step 2: Run test — moet falen**

Run: `pnpm test:evaluatie`
Expected: FAIL

**Step 3: Implementeer tokens.ts**

```typescript
import { prisma } from "@/lib/db/prisma";

/** Valideer een uitnodigings-token en retourneer de uitnodiging met ronde-info */
export async function valideerToken(token: string) {
  const uitnodiging = await prisma.evaluatieUitnodiging.findUnique({
    where: { token },
    include: {
      ronde: {
        select: { id: true, seizoen: true, ronde: true, naam: true, type: true, deadline: true, status: true },
      },
      owTeam: {
        select: { id: true, naam: true, seizoen: true },
      },
    },
  });

  if (!uitnodiging) return null;

  // Ronde moet actief zijn
  if (uitnodiging.ronde.status !== "actief") return null;

  return uitnodiging;
}
```

**Step 4: Run test — moet slagen**

Run: `pnpm test:evaluatie`
Expected: PASS (de "ronde niet actief" case wordt afgevangen)

**Step 5: Commit**

```bash
git add apps/evaluatie/src/lib/tokens.ts apps/evaluatie/src/lib/tokens.test.ts
git commit -m "feat(evaluatie): token-validatie voor uitnodigingen"
```

---

## Fase 2: Admin-portaal (TC-leden)

### Task 6: Admin layout + login

**Files:**
- Create: `apps/evaluatie/src/app/login/page.tsx`
- Create: `apps/evaluatie/src/app/admin/layout.tsx`
- Create: `apps/evaluatie/src/app/admin/page.tsx`
- Create: `apps/evaluatie/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/evaluatie/src/components/providers/SessionProvider.tsx`

**Step 1: NextAuth API route**

```typescript
import { handlers } from "@oranje-wit/auth";
export const { GET, POST } = handlers;
```

**Step 2: SessionProvider**

```typescript
"use client";
import { SessionProvider as Provider } from "next-auth/react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
```

**Step 3: Login pagina**

```typescript
import { signIn } from "@oranje-wit/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-orange-600">
          Evaluatie — Admin
        </h1>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
          >
            Inloggen met Google
          </button>
        </form>
      </div>
    </main>
  );
}
```

**Step 4: Admin layout (met SessionProvider + navigatie)**

```typescript
import SessionProvider from "@/components/providers/SessionProvider";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white px-6 py-3">
          <nav className="flex items-center gap-6">
            <span className="font-bold text-orange-600">Evaluatie</span>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Rondes</Link>
            <Link href="/admin/coordinatoren" className="text-sm text-gray-600 hover:text-gray-900">Coördinatoren</Link>
            <Link href="/admin/templates" className="text-sm text-gray-600 hover:text-gray-900">E-mail templates</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
```

**Step 5: Admin overzichtspagina (placeholder)**

```typescript
export default function AdminPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Evaluatierondes</h1>
      <p className="mt-2 text-gray-500">Hier komen de evaluatierondes.</p>
    </div>
  );
}
```

**Step 6: Update root layout met SessionProvider voor login**

Update `apps/evaluatie/src/app/layout.tsx` — voeg SessionProvider toe rond de admin routes (via conditional rendering of apart in admin layout).

**Step 7: Test login flow**

Run: `pnpm dev:evaluatie`
Navigeer naar `http://localhost:4104/admin` → redirect naar `/login` → Google OAuth → terug naar `/admin`.

**Step 8: Commit**

```bash
git add apps/evaluatie/src/
git commit -m "feat(evaluatie): admin layout, login, NextAuth integratie"
```

---

### Task 7: API — Evaluatierondes CRUD

**Files:**
- Create: `apps/evaluatie/src/app/api/rondes/route.ts` (GET + POST)
- Create: `apps/evaluatie/src/app/api/rondes/[id]/route.ts` (GET + PATCH)
- Create: `apps/evaluatie/src/app/api/rondes/[id]/teams/route.ts` (GET — teams + spelers + staf)

**Step 1: GET + POST /api/rondes**

```typescript
import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
import { z } from "zod";

const CreateRondeSchema = z.object({
  seizoen: z.string().regex(/^\d{4}-\d{4}$/),
  ronde: z.number().int().positive(),
  naam: z.string().min(1),
  type: z.enum(["trainer", "speler"]),
  deadline: z.string().datetime(),
});

export async function GET() {
  try {
    await requireEditor();
    const rondes = await prisma.evaluatieRonde.findMany({
      orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
      include: {
        _count: { select: { uitnodigingen: true, evaluaties: true } },
      },
    });
    return ok(rondes);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  try {
    await requireEditor();
    const parsed = await parseBody(request, CreateRondeSchema);
    if (!parsed.ok) return parsed.response;

    const ronde = await prisma.evaluatieRonde.create({
      data: {
        ...parsed.data,
        deadline: new Date(parsed.data.deadline),
      },
    });
    return ok(ronde);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

**Step 2: GET + PATCH /api/rondes/[id]**

```typescript
import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
import { z } from "zod";

const UpdateRondeSchema = z.object({
  status: z.enum(["concept", "actief", "gesloten"]).optional(),
  deadline: z.string().datetime().optional(),
  naam: z.string().min(1).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const ronde = await prisma.evaluatieRonde.findUnique({
      where: { id },
      include: {
        uitnodigingen: {
          include: { owTeam: { select: { id: true, naam: true } } },
          orderBy: { createdAt: "desc" },
        },
        evaluaties: {
          select: { id: true, spelerId: true, status: true, teamNaam: true, coach: true, ingediendOp: true },
        },
      },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");
    return ok(ronde);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const parsed = await parseBody(request, UpdateRondeSchema);
    if (!parsed.ok) return parsed.response;

    const ronde = await prisma.evaluatieRonde.update({
      where: { id },
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      },
    });
    return ok(ronde);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

**Step 3: GET /api/rondes/[id]/teams — teams met spelers en staf uit bestaande data**

Dit is de kernverbetering t.o.v. Lovable: data komt uit de database, geen CSV-import.

```typescript
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;

    const ronde = await prisma.evaluatieRonde.findUnique({
      where: { id },
      select: { seizoen: true },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");

    // Teams voor dit seizoen
    const teams = await prisma.oWTeam.findMany({
      where: { seizoen: ronde.seizoen },
      orderBy: { sortOrder: "asc" },
      select: { id: true, naam: true, categorie: true, kleur: true, spelvorm: true },
    });

    // Spelers per team (uit competitie_spelers, actueel seizoen)
    const spelers = await prisma.competitieSpeler.findMany({
      where: { seizoen: ronde.seizoen },
      select: {
        relCode: true,
        team: true,
        geslacht: true,
        lid: { select: { roepnaam: true, tussenvoegsel: true, achternaam: true, email: true } },
      },
    });

    // Staf (alle stafleden met een teamkoppeling)
    const staf = await prisma.staf.findMany({
      where: {
        teamStaf: { some: { team: { versie: { concept: { seizoen: ronde.seizoen } } } } },
      },
      select: { id: true, naam: true, email: true, rollen: true },
    });

    // Groepeer spelers per team
    const spelersPerTeam = new Map<string, typeof spelers>();
    for (const s of spelers) {
      const lijst = spelersPerTeam.get(s.team) ?? [];
      lijst.push(s);
      spelersPerTeam.set(s.team, lijst);
    }

    const result = teams.map((team) => ({
      ...team,
      spelers: (spelersPerTeam.get(team.naam ?? "") ?? []).map((s) => ({
        relCode: s.relCode,
        naam: s.lid
          ? `${s.lid.roepnaam} ${s.lid.tussenvoegsel ? s.lid.tussenvoegsel + " " : ""}${s.lid.achternaam}`
          : s.relCode,
        geslacht: s.geslacht,
        email: s.lid?.email,
      })),
    }));

    return ok({ teams: result, staf });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

**Step 4: Commit**

```bash
git add apps/evaluatie/src/app/api/rondes/
git commit -m "feat(evaluatie): API routes voor rondes CRUD + teams/spelers uit database"
```

---

### Task 8: API — Coördinatoren CRUD

**Files:**
- Create: `apps/evaluatie/src/app/api/coordinatoren/route.ts`
- Create: `apps/evaluatie/src/app/api/coordinatoren/[id]/route.ts`
- Create: `apps/evaluatie/src/app/api/coordinatoren/[id]/teams/route.ts`

**Step 1: Implementeer GET + POST /api/coordinatoren**

GET: alle coördinatoren met hun team-koppelingen.
POST: nieuwe coördinator aanmaken (naam + email).

**Step 2: Implementeer PATCH + DELETE /api/coordinatoren/[id]**

Naam/email wijzigen, coördinator verwijderen.

**Step 3: Implementeer POST + DELETE /api/coordinatoren/[id]/teams**

Teams koppelen/ontkoppelen voor een seizoen.

**Step 4: Commit**

---

### Task 9: API — Uitnodigingen versturen

**Files:**
- Create: `apps/evaluatie/src/app/api/rondes/[id]/uitnodigen/route.ts`
- Create: `apps/evaluatie/src/app/api/rondes/[id]/herinneren/route.ts`

**Step 1: POST /api/rondes/[id]/uitnodigen**

Logica:
1. Haal ronde op, controleer status = "actief"
2. Haal teams + staf voor dit seizoen uit database
3. Maak per trainer een `EvaluatieUitnodiging` aan (type="trainer", token=cuid)
4. Haal e-mail template `trainer_uitnodiging` uit `email_templates`
5. Render template met variabelen (trainer_naam, team_naam, deadline, link)
6. Verstuur e-mail via `verstuurEmail()`
7. Update `emailVerstuurd` timestamp

**Step 2: POST /api/rondes/[id]/herinneren**

Dezelfde flow maar:
- Filter op uitnodigingen waar nog geen evaluatie voor is ingediend
- Gebruik template `trainer_herinnering`
- Update `reminderVerstuurd` + `reminderAantal`

**Step 3: Commit**

---

### Task 10: Admin UI — Rondes beheren

**Files:**
- Create: `apps/evaluatie/src/app/admin/page.tsx` (overzicht)
- Create: `apps/evaluatie/src/app/admin/nieuw/page.tsx` (nieuwe ronde)
- Create: `apps/evaluatie/src/app/admin/[id]/page.tsx` (ronde detail)

**Step 1: Rondes overzicht**

Tabel met alle rondes: naam, seizoen, type, deadline, status, aantal uitnodigingen, aantal ingediend. Knop "Nieuwe ronde".

**Step 2: Nieuwe ronde aanmaken**

Formulier: naam, seizoen (default: HUIDIG_SEIZOEN), type (trainer/speler), deadline. Na opslaan: redirect naar detail.

**Step 3: Ronde detail**

- Status badge + status-wijzig knoppen (concept → actief → gesloten)
- Teams uit database tonen (automatisch, geen selectie nodig)
- Per team: trainers/staf met e-mailadressen
- Knop "Uitnodigingen versturen" (als status = actief)
- Knop "Herinnering sturen"
- Overzicht: wie heeft al ingeleverd, wie niet

**Step 4: Commit**

---

### Task 11: Admin UI — Coördinatoren beheren

**Files:**
- Create: `apps/evaluatie/src/app/admin/coordinatoren/page.tsx`

**Step 1: Coördinatoren pagina**

- Lijst van alle coördinatoren met naam + email
- Per coördinator: gekoppelde teams (voor huidig seizoen)
- Toevoegen/verwijderen van coördinatoren
- Teams koppelen/ontkoppelen

**Step 2: Commit**

---

### Task 12: Admin UI — E-mail templates

**Files:**
- Create: `apps/evaluatie/src/app/admin/templates/page.tsx`
- Create: `apps/evaluatie/src/app/api/templates/route.ts`
- Create: `apps/evaluatie/src/app/api/templates/[id]/route.ts`

**Step 1: API routes voor templates**

GET alle templates, PATCH een template (onderwerp + inhoud_html).

**Step 2: Templates pagina**

Lijst van alle templates. Klik op een template → bewerkformulier met onderwerp en HTML-inhoud. Toon beschikbare variabelen per template.

**Step 3: Commit**

---

## Fase 3: Trainer-evaluatie

### Task 13: Trainer evaluatieformulier — pagina + token-validatie

**Files:**
- Create: `apps/evaluatie/src/app/invullen/page.tsx`

**Step 1: Pagina met token-validatie**

```typescript
import { valideerToken } from "@/lib/tokens";
import TrainerEvaluatieForm from "@/components/TrainerEvaluatieForm";

export default async function InvullenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <FoutMelding tekst="Geen geldige link. Gebruik de link uit je uitnodigingsmail." />;
  }

  const uitnodiging = await valideerToken(token);

  if (!uitnodiging) {
    return <FoutMelding tekst="Deze link is verlopen of ongeldig." />;
  }

  // Haal spelers op voor dit team
  const spelers = await haalSpelersOp(uitnodiging.ronde.seizoen, uitnodiging.owTeam?.naam);

  return (
    <TrainerEvaluatieForm
      token={token}
      uitnodiging={uitnodiging}
      spelers={spelers}
    />
  );
}
```

**Step 2: Commit**

---

### Task 14: Trainer evaluatieformulier — component

**Files:**
- Create: `apps/evaluatie/src/components/TrainerEvaluatieForm.tsx`

**Step 1: Wizard-formulier met stappen**

Stap 1: **Team-evaluatie (Oranje Draad)**
- Plezier: 1-5 sterren + vrije tekst
- Ontwikkeling: 1-5 sterren + vrije tekst
- Prestatie: 1-5 sterren + vrije tekst

Stap 2: **Spelersbeoordelingen** (per speler in het team)
- Niveau: 1-5 sterren
- Inzet: 1-3 (minder / normaal / meer)
- Groei: 1-4 (geen / weinig / normaal / veel)
- Opmerking: vrije tekst (optioneel)

Stap 3: **Samenvatting + indienen**
- Overzicht van alle ingevulde scores
- Knop "Indienen"

**Step 2: Commit**

---

### Task 15: API — Evaluatie opslaan

**Files:**
- Create: `apps/evaluatie/src/app/api/evaluaties/route.ts`

**Step 1: POST /api/evaluaties**

Logica:
1. Valideer token uit request body
2. Haal uitnodiging + ronde op
3. Per speler in de beoordeling:
   - Zoek `Speler` record via `rel_code` (NIET naam!)
   - Sla op als `Evaluatie` record met:
     - `spelerId` = rel_code
     - `seizoen` = ronde.seizoen
     - `ronde` = ronde.ronde
     - `type` = "trainer"
     - `rondeId` = ronde.id
     - `scores` = { niveau, inzet, groei, team_plezier, team_plezier_toelichting, ... }
     - `status` = "ingediend"
     - `ingediendOp` = now()
     - `coach` = uitnodiging.naam
     - `teamNaam` = team.naam
4. Stuur bevestigingsmail naar trainer
5. Stuur notificatie naar coördinator(en) van dit team

**Step 2: Commit**

---

### Task 16: Bevestigingspagina na indienen

**Files:**
- Create: `apps/evaluatie/src/app/invullen/bedankt/page.tsx`

**Step 1: Eenvoudige bedankt-pagina**

Toon: "Bedankt, je evaluatie voor [team] is ontvangen."

**Step 2: Commit**

---

## Fase 4: Coördinator-portaal

### Task 17: Coördinator landing + token-validatie

**Files:**
- Create: `apps/evaluatie/src/app/coordinator/page.tsx`

**Step 1: Pagina met token-validatie**

Valideer token → toon overzicht van toegewezen teams voor deze ronde.
Per team: welke trainers hebben al ingeleverd, link om evaluatie te bekijken.

**Step 2: Commit**

---

### Task 18: Coördinator — evaluatie bekijken + memo

**Files:**
- Create: `apps/evaluatie/src/app/coordinator/[rondeId]/[teamId]/page.tsx`
- Create: `apps/evaluatie/src/app/api/evaluaties/[id]/memo/route.ts`

**Step 1: Evaluatie-overzicht per team**

Toon alle ingediende evaluaties voor dit team:
- Oranje Draad scores (plezier/ontwikkeling/prestatie)
- Per speler: niveau, inzet, groei, opmerkingen
- Coördinator-memo veld (bewerkbaar)

**Step 2: API voor memo opslaan**

PATCH `/api/evaluaties/[id]/memo` — slaat `coordinatorMemo` op.
Token-validatie: coördinator moet gekoppeld zijn aan dit team.

**Step 3: Commit**

---

## Fase 5: Spelerszelfevaluatie

### Task 19: API — Spelersuitnodigingen versturen

**Files:**
- Create: `apps/evaluatie/src/app/api/rondes/[id]/spelers-uitnodigen/route.ts`

**Step 1: POST route**

Logica:
1. Haal ronde op (type moet "speler" zijn)
2. Haal spelers voor het seizoen op — filter: alleen senioren/oudere jeugd (geen jeugdleden via mail)
3. Maak per speler een `EvaluatieUitnodiging` aan (type="speler", spelerId=rel_code)
4. Verstuur e-mail via template `speler_uitnodiging`

**Step 2: Commit**

---

### Task 20: Speler zelfevaluatie-formulier

**Files:**
- Create: `apps/evaluatie/src/app/zelf/page.tsx`
- Create: `apps/evaluatie/src/components/SpelerZelfEvaluatieForm.tsx`
- Create: `apps/evaluatie/src/app/api/zelf-evaluaties/route.ts`

**Step 1: Pagina met token-validatie**

Valideer token → toon zelfevaluatieformulier.

**Step 2: Formulier met secties**

Sectie 1: **Plezier & Sfeer** (elk 1-5)
- "Ik heb plezier in het korfballen"
- "Ik voel me thuis in mijn team"
- "Ik word voldoende uitgedaagd"
- Toelichting (vrij)

Sectie 2: **Trainingen & Wedstrijden** (elk 1-5)
- "Ik heb zin in trainen"
- "De trainingen zijn goed"
- "Ik geniet van wedstrijden"
- "Ik merk dat ik beter word"
- Toelichting (vrij)

Sectie 3: **Toekomst**
- Intentie: stop / twijfel / doorgaan
- Ambitie: hoger / zelfde / lager
- Toelichting (vrij)

Sectie 4: **Algemeen**
- Vrije opmerking (max 500 tekens)

Header: "Je antwoorden zijn anoniem voor trainers. Alleen de coördinator kan ze inzien."

**Step 3: API route voor opslaan**

POST `/api/zelf-evaluaties` — slaat op als `SpelerZelfEvaluatie` record.

**Step 4: Commit**

---

## Fase 6: Integratie & Deployment

### Task 21: Fix EvaluatieScores MAX_SCORE in team-indeling app

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/EvaluatieScores.tsx`

**Step 1: Pas MAX_SCORE aan per criterium**

```typescript
const SCORE_CONFIG = {
  niveau: { max: 5, label: "Niveau" },
  inzet: { max: 3, label: "Inzet" },
  groei: { max: 4, label: "Groei" },
  team_plezier: { max: 5, label: "Plezier" },
  team_ontwikkeling: { max: 5, label: "Ontwikkeling" },
  team_prestatie: { max: 5, label: "Prestatie" },
} as const;
```

Update `ScoreBalk` component om max per criterium te gebruiken.

**Step 2: Commit**

---

### Task 22: Railway deployment

**Step 1: Maak Railway service aan**

Via Railway MCP of dashboard:
- Service naam: `evaluatie`
- GitHub repo: `mrbacklog/oranje-wit`
- Branch: `master`
- Root directory: `apps/evaluatie`
- Build: Dockerfile

**Step 2: Stel environment variables in**

```
DATABASE_URL=postgresql://...
AUTH_SECRET=<zelfde als andere apps>
AUTH_GOOGLE_ID=<zelfde>
AUTH_GOOGLE_SECRET=<zelfde>
SMTP_USER=noreply@ckvoranjewit.app
SMTP_PASSWORD=<Google Workspace app-wachtwoord>
NEXTAUTH_URL=https://evaluatie.ckvoranjewit.app
```

**Step 3: Genereer Railway domein**

Via Railway MCP: genereer `.up.railway.app` domein.

**Step 4: Configureer Cloudflare Worker proxy**

Voeg route toe aan de `railway-proxy` Worker:
- `evaluatie.ckvoranjewit.app` → `evaluatie-production-<hash>.up.railway.app`

**Step 5: Voeg Google OAuth redirect URI toe**

In Google Cloud Console, voeg toe:
- `https://evaluatie.ckvoranjewit.app/api/auth/callback/google`

**Step 6: Test deployment**

Navigeer naar `https://evaluatie.ckvoranjewit.app/admin` → login → rondes pagina.

**Step 7: Commit**

---

### Task 23: Evaluatie types verplaatsen naar packages/types

**Files:**
- Modify: `packages/types/src/index.ts`
- Create: `packages/types/src/evaluatie.ts`

**Step 1: Verplaats EvaluatieScore en gerelateerde types**

De types `EvaluatieScore`, `EvaluatieData`, `TeamGemiddelde` staan nu in `apps/team-indeling/src/components/scenario/types.ts`. Verplaats naar `packages/types/src/evaluatie.ts` zodat zowel team-indeling als evaluatie-app ze kunnen gebruiken.

**Step 2: Update imports in team-indeling**

**Step 3: Commit**

---

### Task 24: Documentatie en opruimen

**Step 1: Update CLAUDE.md**

Voeg de evaluatie-app toe aan de structuur, commando's en tabelverdeling.

**Step 2: Update root package.json scripts**

Verifieer dat `dev:evaluatie`, `build:evaluatie`, `test:evaluatie` werken.

**Step 3: Archiveer het plan**

Markeer `docs/plans/2026-03-03-evaluatie-app.md` als "Afgerond".

**Step 4: Commit**

```bash
git commit -m "docs: evaluatie-app documentatie bijwerken"
```

---

## Samenvatting

| Fase | Tasks | Wat |
|---|---|---|
| 1 | 1-5 | Database schema, app scaffold, e-mail, tokens |
| 2 | 6-12 | Admin portaal (login, rondes, coördinatoren, templates) |
| 3 | 13-16 | Trainer evaluatieformulier + opslaan + bevestiging |
| 4 | 17-18 | Coördinator portaal (bekijken + memo) |
| 5 | 19-20 | Spelerszelfevaluatie |
| 6 | 21-24 | Fix MAX_SCORE, Railway deployment, types verplaatsen, docs |

**Totaal: 24 tasks, 6 fases**

Elke fase levert een werkend onderdeel op dat onafhankelijk getest kan worden. De Lovable-app blijft draaien totdat alle fases afgerond en getest zijn.
