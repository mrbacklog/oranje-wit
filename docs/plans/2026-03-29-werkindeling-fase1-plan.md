# Werkindeling fase 1 — Geïntegreerd implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De Team-Indeling omzetten van meerdere scenario's naar één werkindeling, geïntegreerd in de desktop/mobile split (`/ti-studio` en `/teamindeling`).

**Architecture:** `isWerkindeling` vlag op het Scenario model, werkindeling-guard functies, nieuwe `/ti-studio/indeling` route die direct naar de editor navigeert, mobile `/teamindeling` toont dezelfde werkindeling read-only. Bestaande scenario-editor wordt hergebruikt.

**Tech Stack:** Next.js 16, React 19, Prisma (PostgreSQL), @oranje-wit/auth, @oranje-wit/ui

**Specs:**
- `docs/specs/2026-03-29-what-if-model-design.md` (what-if model, fase 1)
- `docs/specs/2026-03-28-teamindeling-scheiding-design.md` (desktop/mobile split)
- `docs/plans/2026-03-29-what-if-technisch-ontwerp.md` (technisch ontwerp)
- `docs/design/2026-03-29-what-if-ux-spec.md` (UX-spec)

**Reeds voltooid (deze sessie):**
- Route rename: `(teamindeling)` → `(teamindeling-studio)` met `/ti-studio/*`
- Nieuwe `(teamindeling)` route group voor mobile op `/teamindeling/*`
- MobileShell, placeholder pagina's (teams, spelers, scenarios, staf)
- Portaal met twee tegels, CLAUDE.md en rules bijgewerkt

---

## Bestandsoverzicht

### Nieuw te maken

| Bestand | Verantwoordelijkheid |
|---|---|
| `apps/web/src/lib/teamindeling/db/werkindeling.ts` | Guard-functies + queries voor werkindeling |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` | Werkindeling startscherm (onboarding of redirect naar editor) |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.ts` | Server actions: getWerkindeling, promoveerTotWerkindeling |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.test.ts` | Tests voor werkindeling actions |

### Te wijzigen

| Bestand | Wijziging |
|---|---|
| `packages/database/prisma/schema.prisma` | `isWerkindeling` veld op Scenario |
| `apps/web/src/lib/teamindeling/db/prisma.ts` | Geen wijziging nodig (Scenario model bestaat al) |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions.ts` | Nieuwe `createWerkindelingVanuitBlauwdruk()` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/page.tsx` | Redirect naar `/ti-studio/indeling` als werkindeling bestaat |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/page.tsx` | Dashboard-link naar werkindeling |
| `apps/web/src/components/teamindeling/layout/TISidebar.tsx` | "Scenario's" → "Indeling" in navigatie |
| `packages/ui/src/navigation/manifest.ts` | URL bijwerken in TEAM_INDELING manifest |
| `apps/web/src/app/(teamindeling)/teamindeling/page.tsx` | Mobile dashboard: werkindeling-status tonen |
| `apps/web/src/app/(teamindeling)/teamindeling/scenarios/page.tsx` | Mobile: toon werkindeling-teams i.p.v. scenario-lijst |

---

## Task 1: Prisma schema — isWerkindeling op Scenario

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Voeg isWerkindeling veld toe aan Scenario model**

Open `packages/database/prisma/schema.prisma`, zoek het `model Scenario` blok en voeg toe na het `status` veld:

```prisma
  isWerkindeling  Boolean   @default(false)
```

- [ ] **Step 2: Genereer de migratie**

```bash
pnpm db:migrate -- --name add_werkindeling_flag
```

- [ ] **Step 3: Voeg data-migratie en partial unique index toe aan het gegenereerde SQL-bestand**

Open het gegenereerde migratiebestand in `packages/database/prisma/migrations/` (de nieuwste map). Voeg **na** de `ALTER TABLE` regel toe:

```sql
-- Data-migratie: promoveer het meest recente DEFINITIEF of ACTIEF scenario per blauwdruk tot werkindeling
WITH ranked AS (
  SELECT
    s.id,
    c."blauwdrukId",
    ROW_NUMBER() OVER (
      PARTITION BY c."blauwdrukId"
      ORDER BY
        CASE WHEN s.status = 'DEFINITIEF' THEN 0 ELSE 1 END,
        s."createdAt" DESC
    ) as rn
  FROM "Scenario" s
  JOIN "Concept" c ON c.id = s."conceptId"
  WHERE s."verwijderdOp" IS NULL
)
UPDATE "Scenario"
SET "isWerkindeling" = true
FROM ranked
WHERE "Scenario".id = ranked.id AND ranked.rn = 1;

-- Partial unique index: max 1 werkindeling per concept
CREATE UNIQUE INDEX "idx_scenario_werkindeling_per_concept"
ON "Scenario" ("conceptId")
WHERE "isWerkindeling" = true;
```

- [ ] **Step 4: Deploy de migratie**

```bash
pnpm db:migrate:deploy
```

- [ ] **Step 5: Regenereer Prisma client**

```bash
pnpm db:generate
```

- [ ] **Step 6: Verifieer dat build slaagt**

```bash
pnpm build
```

Verwacht: geen errors.

- [ ] **Step 7: Commit**

```bash
git add packages/database/prisma/
git commit -m "feat(db): isWerkindeling vlag op Scenario + data-migratie"
```

---

## Task 2: Werkindeling guard-functies en queries

**Files:**
- Create: `apps/web/src/lib/teamindeling/db/werkindeling.ts`

- [ ] **Step 1: Schrijf de werkindeling module**

Create `apps/web/src/lib/teamindeling/db/werkindeling.ts`:

```typescript
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";

/**
 * Haal de werkindeling op voor een blauwdruk.
 * Retourneert null als er geen werkindeling is.
 */
export async function getWerkindeling(blauwdrukId: string) {
  return prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdrukId },
      verwijderdOp: null,
    },
    select: {
      id: true,
      naam: true,
      status: true,
      isWerkindeling: true,
      toelichting: true,
      createdAt: true,
      updatedAt: true,
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          id: true,
          nummer: true,
          teams: {
            orderBy: { volgorde: "asc" },
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              teamType: true,
              volgorde: true,
              validatieStatus: true,
              _count: { select: { spelers: true, staf: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Haal het werkindeling-ID op, of null als er geen is.
 */
export async function getWerkindelingId(blauwdrukId: string): Promise<string | null> {
  const result = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdrukId },
      verwijderdOp: null,
    },
    select: { id: true },
  });
  return result?.id ?? null;
}

/**
 * Guard: controleer dat er geen werkindeling bestaat voor deze blauwdruk.
 * Gooit een fout als er al een werkindeling is.
 */
export async function assertGeenWerkindeling(blauwdrukId: string): Promise<void> {
  const bestaand = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdrukId },
      verwijderdOp: null,
    },
    select: { id: true, naam: true },
  });
  if (bestaand) {
    throw new Error(
      `Blauwdruk heeft al een werkindeling: "${bestaand.naam}" (${bestaand.id})`
    );
  }
}

/**
 * Promoveer een bestaand scenario tot werkindeling.
 * Zet alle andere scenario's in dezelfde blauwdruk op isWerkindeling: false.
 */
export async function promoveerTotWerkindeling(scenarioId: string): Promise<void> {
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    select: {
      id: true,
      concept: { select: { blauwdrukId: true, id: true } },
    },
  });

  await prisma.$transaction(async (tx: any) => {
    // Zet alle scenario's in deze blauwdruk op false
    const conceptIds = await tx.concept.findMany({
      where: { blauwdrukId: scenario.concept.blauwdrukId },
      select: { id: true },
    });
    await tx.scenario.updateMany({
      where: {
        conceptId: { in: conceptIds.map((c: any) => c.id) },
        isWerkindeling: true,
      },
      data: { isWerkindeling: false },
    });

    // Zet dit scenario op true
    await tx.scenario.update({
      where: { id: scenarioId },
      data: { isWerkindeling: true },
    });
  });

  logger.info(`Scenario ${scenarioId} gepromoveerd tot werkindeling`);
}
```

- [ ] **Step 2: Verifieer dat build slaagt**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/teamindeling/db/werkindeling.ts
git commit -m "feat: werkindeling guard-functies en queries"
```

---

## Task 3: Werkindeling server actions en tests

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.test.ts`

- [ ] **Step 1: Schrijf de test**

Create `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

// Mock de database module
vi.mock("@/lib/teamindeling/db/werkindeling", () => ({
  getWerkindeling: vi.fn(),
  getWerkindelingId: vi.fn(),
}));

vi.mock("@/lib/teamindeling/seizoen", () => ({
  getActiefSeizoen: vi.fn().mockResolvedValue("2026-2027"),
}));

describe("werkindeling actions", () => {
  it("module kan geïmporteerd worden", async () => {
    const actions = await import("./actions");
    expect(actions).toBeDefined();
    expect(typeof actions.getWerkindelingVoorSeizoen).toBe("function");
  });
});
```

- [ ] **Step 2: Draai de test, verwacht fail**

```bash
pnpm test -- --run apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/actions.test.ts
```

Verwacht: FAIL (module bestaat nog niet)

- [ ] **Step 3: Schrijf de server actions**

Create `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.ts`:

```typescript
"use server";

import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindeling, getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import { prisma } from "@/lib/teamindeling/db/prisma";

/**
 * Haal de werkindeling op voor het actieve seizoen.
 * Retourneert de werkindeling met teams-samenvatting, of null.
 */
export async function getWerkindelingVoorSeizoen() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return null;
  return getWerkindeling(blauwdruk.id);
}

/**
 * Check of er een werkindeling bestaat voor het actieve seizoen.
 * Retourneert het scenario-ID of null.
 */
export async function getWerkindelingIdVoorSeizoen(): Promise<string | null> {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return null;
  return getWerkindelingId(blauwdruk.id);
}
```

- [ ] **Step 4: Draai de test, verwacht pass**

```bash
pnpm test -- --run apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/actions.test.ts
```

Verwacht: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/"(teamindeling-studio)"/ti-studio/indeling/
git commit -m "feat: werkindeling server actions met test"
```

---

## Task 4: Werkindeling startscherm (studio)

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

- [ ] **Step 1: Schrijf de werkindeling pagina**

Create `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getWerkindelingVoorSeizoen } from "./actions";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getSpelerBasisData } from "@/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions";
import NieuwScenarioWizard from "@/components/teamindeling/scenarios/NieuwScenarioWizard";

export default async function IndelingPage() {
  const werkindeling = await getWerkindelingVoorSeizoen();

  // Als er een werkindeling is, ga direct naar de editor
  if (werkindeling) {
    redirect(`/ti-studio/scenarios/${werkindeling.id}`);
  }

  // Geen werkindeling — toon onboarding
  const seizoen = await getActiefSeizoen();
  const [blauwdruk, spelers] = await Promise.all([
    getBlauwdruk(seizoen),
    getSpelerBasisData(),
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          padding: "2rem",
          borderRadius: "var(--radius-xl, 16px)",
          backgroundColor: "var(--surface-raised)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Nog geen werkindeling
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
          }}
        >
          Start de werkindeling vanuit de blauwdruk. Dit wordt de
          teamindeling waar het hele seizoen aan gewerkt wordt.
        </p>
        <NieuwScenarioWizard
          blauwdrukId={blauwdruk.id}
          spelers={spelers}
          bestaandeScenarios={[]}
          label="Start werkindeling"
        />
      </div>
    </div>
  );
}
```

**Opmerking:** De `NieuwScenarioWizard` component krijgt een optionele `label` prop. Als die niet bestaat, voegen we die toe in de volgende step.

- [ ] **Step 2: Check of NieuwScenarioWizard een label prop accepteert**

Lees `apps/web/src/components/teamindeling/scenarios/NieuwScenarioWizard.tsx` en check de props. Als er geen `label` prop is, voeg die toe:

```typescript
interface NieuwScenarioWizardProps {
  blauwdrukId: string;
  spelers: SpelerBasis[];
  bestaandeScenarios: { id: string; naam: string }[];
  label?: string; // NIEUW: optioneel alternatief label voor de trigger-knop
}
```

En gebruik `label ?? "Nieuw scenario"` in de trigger-knop.

- [ ] **Step 3: Build en verifieer**

```bash
pnpm build
```

Open `http://localhost:3000/ti-studio/indeling` — verwacht: onboarding-scherm als er geen werkindeling is, redirect naar scenario-editor als er wel een is.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/"(teamindeling-studio)"/ti-studio/indeling/ apps/web/src/components/teamindeling/scenarios/NieuwScenarioWizard.tsx
git commit -m "feat: werkindeling startscherm met onboarding"
```

---

## Task 5: createWerkindelingVanuitBlauwdruk in wizard

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions.ts`

- [ ] **Step 1: Voeg createWerkindelingVanuitBlauwdruk toe**

Voeg de volgende functie toe aan `wizard-actions.ts`, na de bestaande `createScenarioVanuitBlauwdruk`:

```typescript
/**
 * Maak een werkindeling aan vanuit de blauwdruk-wizard.
 * Identiek aan createScenarioVanuitBlauwdruk, maar zet isWerkindeling: true.
 */
export async function createWerkindelingVanuitBlauwdruk(
  blauwdrukId: string,
  naam: string,
  aantalSenioren: number,
  aCatTeams: ACatConfig[],
  bTeamOverrides?: Record<string, number>
) {
  // Guard: max 1 werkindeling per blauwdruk
  const { assertGeenWerkindeling } = await import("@/lib/teamindeling/db/werkindeling");
  await assertGeenWerkindeling(blauwdrukId);

  const concept = await prisma.concept.upsert({
    where: { id: await findConceptIdForBlauwdruk(blauwdrukId) },
    create: {
      blauwdrukId,
      naam: "Standaard",
      uitgangsprincipe: "Automatisch aangemaakt",
      keuzes: {},
    },
    update: {},
  });

  const spelers = await prisma.speler.findMany({
    select: { id: true, geboortejaar: true, geslacht: true, status: true },
  });

  const spelerBasis: SpelerBasis[] = spelers.map((s) => ({
    id: s.id,
    geboortejaar: s.geboortejaar,
    geslacht: s.geslacht as "M" | "V",
    status: s.status,
  }));

  const teamVoorstellen = bouwTeamVoorstellen(
    spelerBasis,
    PEILJAAR,
    aantalSenioren,
    aCatTeams,
    bTeamOverrides
  );

  const scenario = await prisma.scenario.create({
    data: {
      conceptId: concept.id,
      naam,
      isWerkindeling: true,
      toelichting: null,
      aannames: {
        methode: "blauwdruk",
        aantalSenioren,
        aCatTeams,
        bTeamOverrides: bTeamOverrides ?? null,
      } as unknown as Prisma.InputJsonValue,
      versies: {
        create: {
          nummer: 1,
          auteur: "Systeem",
          naam: "Initieel",
          teams: {
            create: teamVoorstellen.map((tv, index) => ({
              naam: tv.naam,
              categorie: tv.categorie,
              kleur: tv.kleur,
              volgorde: index,
            })),
          },
        },
      },
    },
  });

  redirect(`/ti-studio/scenarios/${scenario.id}`);
}
```

- [ ] **Step 2: Build en verifieer**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/"(teamindeling-studio)"/ti-studio/scenarios/wizard-actions.ts
git commit -m "feat: createWerkindelingVanuitBlauwdruk in wizard"
```

---

## Task 6: Navigatie-update — "Scenario's" → "Indeling"

**Files:**
- Modify: `apps/web/src/components/teamindeling/layout/TISidebar.tsx`
- Modify: `packages/ui/src/navigation/manifest.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/page.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/page.tsx`

- [ ] **Step 1: Update TISidebar navigatie**

In `apps/web/src/components/teamindeling/layout/TISidebar.tsx`, wijzig het "Scenario's" item:

```typescript
navigation: [
  { label: "Dashboard", href: "/ti-studio", icon: "🏠" },
  { label: "Blauwdruk", href: "/ti-studio/blauwdruk", icon: "🗂️" },
  { label: "Werkbord", href: "/ti-studio/werkbord", icon: "📋" },
  { label: "Indeling", href: "/ti-studio/indeling", icon: "🏗️" },
],
```

- [ ] **Step 2: Update manifest.ts**

In `packages/ui/src/navigation/manifest.ts`, zoek het `TEAM_INDELING` manifest en update het "Scenario's" item naar "Indeling" met href `/ti-studio/indeling`.

- [ ] **Step 3: Voeg redirect toe aan scenarios/page.tsx**

In `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/page.tsx`, voeg bovenaan de component toe (na de seizoen-fetch):

```typescript
import { getWerkindelingIdVoorSeizoen } from "@/app/(teamindeling-studio)/ti-studio/indeling/actions";

export default async function ScenariosPage() {
  // Als er een werkindeling is, redirect naar de indeling-pagina
  const werkindelingId = await getWerkindelingIdVoorSeizoen();
  if (werkindelingId) {
    redirect("/ti-studio/indeling");
  }

  // Bestaande code voor scenario-lijst (fallback als er geen werkindeling is)
  const seizoen = await getActiefSeizoen();
  // ... rest van de bestaande code
```

Voeg de `redirect` import toe als die er nog niet is.

- [ ] **Step 4: Update dashboard-pagina**

In `apps/web/src/app/(teamindeling-studio)/ti-studio/page.tsx`, als er een link naar `/ti-studio/scenarios` staat, wijzig die naar `/ti-studio/indeling`.

- [ ] **Step 5: Build en verifieer**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/teamindeling/layout/TISidebar.tsx packages/ui/src/navigation/manifest.ts apps/web/src/app/"(teamindeling-studio)"/ti-studio/scenarios/page.tsx apps/web/src/app/"(teamindeling-studio)"/ti-studio/page.tsx
git commit -m "feat: navigatie-update Scenario's → Indeling"
```

---

## Task 7: Mobile werkindeling-dashboard

**Files:**
- Modify: `apps/web/src/app/(teamindeling)/teamindeling/page.tsx`

- [ ] **Step 1: Update mobile dashboard met werkindeling-informatie**

Vervang de inhoud van `apps/web/src/app/(teamindeling)/teamindeling/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function TeamIndelingMobileDashboard() {
  const seizoen = await getActiefSeizoen();

  // Haal werkindeling op
  const werkindeling = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdruk: { seizoen } },
      verwijderdOp: null,
    },
    select: {
      naam: true,
      status: true,
      updatedAt: true,
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          teams: {
            orderBy: { volgorde: "asc" },
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              _count: { select: { spelers: true } },
            },
          },
        },
      },
    },
  });

  const teams = werkindeling?.versies[0]?.teams ?? [];

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.25rem",
        }}
      >
        Team-Indeling
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Seizoen {seizoen}
      </p>

      {!werkindeling ? (
        <div
          style={{
            padding: "2rem 1rem",
            textAlign: "center",
            backgroundColor: "var(--surface-raised)",
            borderRadius: "0.75rem",
          }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>
            Nog geen werkindeling voor dit seizoen.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
              Werkindeling
            </div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {werkindeling.naam}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {teams.length} teams &middot; {werkindeling.status}
            </div>
          </div>

          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Teams ({teams.length})
          </h2>
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
                  {team.categorie} {team.kleur ? `· ${team.kleur}` : ""} · {team._count.spelers} spelers
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build en verifieer**

```bash
pnpm build
```

Open `http://localhost:3000/teamindeling` — verwacht: als er een werkindeling is, toon teams-lijst. Anders "Nog geen werkindeling".

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/"(teamindeling)"/teamindeling/page.tsx
git commit -m "feat: mobile dashboard toont werkindeling-teams"
```

---

## Task 8: Mobile scenarios → werkindeling view

**Files:**
- Modify: `apps/web/src/app/(teamindeling)/teamindeling/scenarios/page.tsx`

- [ ] **Step 1: Update mobile scenario's pagina**

Vervang de inhoud van `apps/web/src/app/(teamindeling)/teamindeling/scenarios/page.tsx` zodat het de werkindeling toont in plaats van een scenario-lijst:

```tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function ScenariosPage() {
  const seizoen = await getActiefSeizoen();

  // Haal werkindeling op met teams en spelers
  const werkindeling = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdruk: { seizoen } },
      verwijderdOp: null,
    },
    select: {
      naam: true,
      status: true,
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          teams: {
            orderBy: { volgorde: "asc" },
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              spelers: {
                select: {
                  speler: {
                    select: {
                      id: true,
                      roepnaam: true,
                      achternaam: true,
                      geboortejaar: true,
                      geslacht: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const teams = werkindeling?.versies[0]?.teams ?? [];

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
        Werkindeling
      </h1>

      {teams.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)" }}>
          Nog geen werkindeling beschikbaar.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {teams.map((team) => (
            <div
              key={team.id}
              style={{
                padding: "1rem",
                backgroundColor: "var(--surface-raised)",
                borderRadius: "0.75rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                {team.naam}
                <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                  {team.spelers.length} spelers
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {team.spelers.map(({ speler }) => (
                  <a
                    key={speler.id}
                    href={`/teamindeling/spelers/${speler.id}`}
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    {speler.roepnaam} {speler.achternaam}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build en verifieer**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/"(teamindeling)"/teamindeling/scenarios/
git commit -m "feat: mobile scenarios toont werkindeling-teams met spelers"
```

---

## Task 9: Volledige verificatie

- [ ] **Step 1: Build**

```bash
pnpm build
```

Verwacht: geen errors. Alle routes zichtbaar, inclusief `/ti-studio/indeling`.

- [ ] **Step 2: Unit tests**

```bash
pnpm test
```

Verwacht: alle tests slagen.

- [ ] **Step 3: Handmatige route-test**

| URL | Verwacht |
|---|---|
| `localhost:3000/ti-studio/indeling` | Redirect naar scenario-editor (als werkindeling bestaat) of onboarding |
| `localhost:3000/ti-studio/scenarios` | Redirect naar `/ti-studio/indeling` (als werkindeling bestaat) |
| `localhost:3000/teamindeling` | Dark dashboard met werkindeling-teams (of "Nog geen werkindeling") |
| `localhost:3000/teamindeling/scenarios` | Werkindeling-teams met spelers |
| `localhost:3000/teamindeling/teams` | Teams overzicht (bestaand) |
| `localhost:3000/ti-studio/blauwdruk` | Ongewijzigd |

- [ ] **Step 4: Commit eventuele fixes**

```bash
git add -A
git commit -m "fix: final fixes na volledige verificatie"
```

---

## Buiten scope (volgende iteraties)

| Wat | Fase | Spec |
|---|---|---|
| What-if aanmaken, bewerken, toepassen | Fase 2 | what-if-model-design.md |
| What-if editor overlay (drie zones) | Fase 2 | what-if-ux-spec.md |
| Impact-panel en auto-meenemen | Fase 3 | what-if-model-design.md |
| Pin/blauwdruk-kader validatie in what-ifs | Fase 4 | what-if-model-design.md |
| Acties, afhankelijkheden, blokkering | Fase 5 | what-if-model-design.md |
| Signaal/actie-systeem | Apart | scheiding-design.md sectie 8 |
| Autorisatie scope-model | Apart | scheiding-design.md sectie 3 |
| Mobile UX-uitbouw (echte componenten) | Apart | Na UX-wireframes |
| Studio dark-mode migratie | Apart | scheiding-design.md |
