# Werkindeling Vereenvoudiging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verwijder de Concept/Scenario-tussenlaag uit het datamodel; één Werkindeling per Blauwdruk met Versies voor historie; de Indeling-pagina opent altijd direct de editor zonder wizard.

**Architecture:** `Blauwdruk → Werkindeling → Versie[] → Team[]`. Het `Concept`-model verdwijnt volledig. `Scenario` wordt hernoemd naar `Werkindeling` in de database (tabel: `werkindelingen`) met een directe `blauwdrukId` FK. Bestaande UI-componenten voor de editor blijven; alleen de navigator/wizard-laag wordt vervangen door een Versies-panel. WhatIf blijft ongewijzigd (de relatie heette al `werkindelingId`).

**Tech Stack:** Prisma 6, Next.js 16 App Router, TypeScript, pnpm workspace, Vitest unit tests, Playwright E2E

**Spec:** `docs/superpowers/specs/2026-04-04-werkindeling-vereenvoudiging-design.md`

---

## Bestandskaart

### Aanpassen
| Bestand | Wat |
|---|---|
| `packages/database/prisma/schema.prisma` | Concept weg, Scenario→Werkindeling, directe FK |
| `apps/web/src/lib/teamindeling/db/prisma.ts` | `concept`/`scenario` → `werkindeling` |
| `apps/web/src/lib/teamindeling/db/werkindeling.ts` | Queries aanpassen aan nieuw schema |
| `apps/web/src/lib/teamindeling/db/scenario-snapshot.ts` | Hernoemd + queries |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/actions.ts` | Verplaatst + herschreven |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/team-actions.ts` | Concept-keten vervangen |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/team-volgorde-actions.ts` | Concept-keten vervangen |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.ts` | Wizard-logica weg |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-actions.ts` | `.concept.blauwdruk` → `.blauwdruk` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-impact-actions.ts` | idem |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-resolve-actions.ts` | idem |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-validatie-actions.ts` | idem |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/pins/actions.ts` | Concept-keten vervangen |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/dashboard/actions.ts` | `prisma.scenario` → `prisma.werkindeling` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/vergelijk/page.tsx` | Herschreven voor WhatIf |
| `apps/web/src/app/(teamindeling)/teamindeling/page.tsx` | `prisma.scenario` → `prisma.werkindeling` |
| `apps/web/src/app/(teamindeling)/teamindeling/scenarios/page.tsx` | Redirect → werkindeling |
| `apps/web/src/app/(teamindeling)/teamindeling/scenarios/[id]/page.tsx` | Redirect → werkindeling |
| `apps/web/src/app/(teamindeling)/teamindeling/spelers/page.tsx` | idem |
| `apps/web/src/app/(teamindeling)/teamindeling/teams/page.tsx` | idem |
| `apps/web/src/app/api/teamindeling/scenarios/[id]/teams/route.ts` | `scenarios` → `werkindelingen` |
| `apps/web/src/app/api/teamindeling/scenarios/[id]/batch-plaats/route.ts` | idem |
| `apps/web/src/app/api/teamindeling/scenarios/[id]/teamscore-sync/route.ts` | idem |
| `apps/web/src/app/api/teamindeling/cleanup/route.ts` | Concept-cleanup weg |
| `apps/web/src/lib/ai/plugins/ti-studio.ts` | `concept`/`scenario` → `werkindeling` |
| `apps/web/src/lib/ai/plugins/teamindeling.ts` | idem |
| `apps/web/src/lib/ai/daisy-acties.ts` | `scenarioId` → `werkindelingId` |
| `apps/web/src/components/teamindeling/scenario/editor/ScenarioEditorFullscreen.tsx` | Prop: `scenarioId` → `werkindelingId` |
| `apps/web/src/components/teamindeling/scenario/hooks/useScenarioEditor.ts` | idem |
| `apps/web/src/components/teamindeling/scenario/types.ts` | `ScenarioData` → `WerkindelingData` |
| `apps/web/src/components/teamindeling/dashboard/ScenarioStatus.tsx` | Label updates |
| `apps/web/src/components/teamindeling/vergelijk/ScenarioVergelijk.tsx` | Hernoemd + WhatIf props |
| `e2e/team-indeling/scenario-wizard.spec.ts` | Herschreven |
| `e2e/team-indeling/navigatie.spec.ts` | Routes bijwerken |

### Aanmaken
| Bestand | Wat |
|---|---|
| `packages/database/prisma/migrations/[nieuw]/migration.sql` | Gegenereerd door Prisma |
| `scripts/migrate/migrate-scenario-to-werkindeling.ts` | Data-migratiescript |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts` | Hernoemde + herschreven actions (was `scenarios/actions.ts`) |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/versies-actions.ts` | Nieuwe CRUD voor versies (restore + hard delete) |
| `apps/web/src/components/teamindeling/werkindeling/VersiesPanel.tsx` | Nieuw versie-beheer paneel |

### Verwijderen
| Bestand | Reden |
|---|---|
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/actions.ts` | Verplaatst naar `indeling/werkindeling-actions.ts` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/team-actions.ts` | Verplaatst naar `indeling/team-actions.ts` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/team-volgorde-actions.ts` | Verplaatst naar `indeling/team-volgorde-actions.ts` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/wizard-actions.ts` | Wizard vervangen door auto-create |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/actions.test.ts` | Verplaatst |
| `apps/web/src/components/teamindeling/scenarios/NieuwScenarioWizard.tsx` | Vervangen door auto-create |
| `apps/web/src/components/teamindeling/scenarios/StapMethode.tsx` | Onderdeel wizard |
| `apps/web/src/components/teamindeling/scenarios/wizard-stappen.tsx` | Onderdeel wizard |
| `apps/web/src/components/teamindeling/scenarios/VerwijderScenarioKnop.tsx` | Functie zit in VersiesPanel |
| `apps/web/src/components/teamindeling/scenarios/Prullenbak.tsx` | Niet meer van toepassing |

---

## Task 1: Schema — Concept verwijderen, Scenario → Werkindeling

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

### Aanpak
Prisma kan geen tabel hernoemen met `db push` — we schrijven de migratie handmatig en genereren daarna de client.

- [ ] **Stap 1: Verwijder het Concept-model en pas Blauwdruk aan**

In `packages/database/prisma/schema.prisma`:

Vervang de `Blauwdruk`-relaties:
```prisma
// Oud:
  concepten   Concept[]

// Nieuw:
  werkindelingen  Werkindeling[]
```

Verwijder het volledige `Concept`-model (regels ~723–743) en de `ConceptStatus` enum (regels ~745–749).

- [ ] **Stap 2: Hernoem Scenario → Werkindeling**

Vervang het `Scenario`-model door:
```prisma
model Werkindeling {
  id          String    @id @default(cuid())
  blauwdruk   Blauwdruk @relation(fields: [blauwdrukId], references: [id], onDelete: Cascade)
  blauwdrukId String

  naam          String    @default("Werkindeling")
  toelichting   String?   @db.Text

  status          WerkindelingStatus @default(ACTIEF)

  // Relaties
  versies   Versie[]
  werkitems Werkitem[]
  whatIfs   WhatIf[]

  verwijderdOp DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([blauwdrukId])
  @@map("werkindelingen")
}
```

Hernoem `ScenarioStatus` → `WerkindelingStatus` (waarden ACTIEF, GEARCHIVEERD, DEFINITIEF blijven).

- [ ] **Stap 3: Update Versie-model**

In het `Versie`-model:
```prisma
// Oud:
  scenario   Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  scenarioId String

// Nieuw:
  werkindeling   Werkindeling @relation(fields: [werkindelingId], references: [id], onDelete: Cascade)
  werkindelingId String
```

En de unique constraint:
```prisma
// Oud:
  @@unique([scenarioId, nummer])
  @@index([scenarioId])

// Nieuw:
  @@unique([werkindelingId, nummer])
  @@index([werkindelingId])
```

- [ ] **Stap 4: Update WhatIf-model**

De `werkindelingId` FK verwijst al naar `Scenario` — update het target:
```prisma
// Oud:
  werkindeling          Scenario      @relation(fields: [werkindelingId], references: [id], onDelete: Cascade)

// Nieuw:
  werkindeling          Werkindeling  @relation(fields: [werkindelingId], references: [id], onDelete: Cascade)
```

- [ ] **Stap 5: Hernoem ScenarioSnapshot → WerkindelingSnapshot**

```prisma
model WerkindelingSnapshot {
  id            String @id @default(cuid())
  werkindelingId String
  naam          String
  reden         String
  data          Json
  aantalTeams   Int    @default(0)
  aantalSpelers Int    @default(0)
  auteur        String?

  createdAt DateTime @default(now())

  @@index([werkindelingId])
  @@map("werkindeling_snapshots")
}
```

- [ ] **Stap 6: Update Team-model**

In het `Team`-model — het heeft geen directe scenario-relatie maar wel via Versie. Controleer of er `Scenario`-referenties zijn en vervang door `Werkindeling`. Run:

```bash
grep -n "Scenario\|scenario" packages/database/prisma/schema.prisma
```

Verwacht: geen `Scenario` meer behalve in de nieuwe `Werkindeling` definitie.

- [ ] **Stap 7: Maak de migratie aan**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm db:migrate -- --name werkindeling_vereenvoudiging
```

Als Prisma klaagt over verwijderde data (Concept tabel bevat data in development):
```bash
pnpm db:migrate -- --name werkindeling_vereenvoudiging --create-only
```

Open dan de gegenereerde `migration.sql` en voeg bovenaan toe:
```sql
-- Kopieer scenario's die werkindeling zijn naar nieuwe tabel
INSERT INTO "werkindelingen" (id, "blauwdrukId", naam, toelichting, status, "verwijderdOp", "createdAt", "updatedAt")
SELECT s.id, c."blauwdrukId", s.naam, s.toelichting,
       s.status::text::"WerkindelingStatus", s."verwijderdOp", s."createdAt", s."updatedAt"
FROM scenarios s
JOIN concepts c ON c.id = s."conceptId"
WHERE s."isWerkindeling" = true;

-- Update versie FK's
ALTER TABLE "Versie" RENAME COLUMN "scenarioId" TO "werkindelingId";

-- Update what_ifs FK's (al correct genaamd, FK target verandert automatisch via CASCADE)
```

Dan:
```bash
pnpm db:migrate:deploy
```

- [ ] **Stap 8: Genereer de Prisma client**

```bash
pnpm db:generate
```

Verwacht: client gegenereerd zonder fouten. TypeScript-fouten in de rest van de codebase zijn op dit punt verwacht — die lossen we in volgende taken op.

- [ ] **Stap 9: Commit**

```bash
git add packages/database/prisma/
git commit -m "feat(db): Concept verwijderd, Scenario→Werkindeling, Versie.werkindelingId"
```

---

## Task 2: Data-migratiescript + DB helpers

**Files:**
- Create: `scripts/migrate/migrate-scenario-to-werkindeling.ts`
- Modify: `apps/web/src/lib/teamindeling/db/prisma.ts`
- Modify: `apps/web/src/lib/teamindeling/db/werkindeling.ts`
- Rename: `apps/web/src/lib/teamindeling/db/scenario-snapshot.ts` → `werkindeling-snapshot.ts`

- [ ] **Stap 1: Maak het migratiescript aan**

`scripts/migrate/migrate-scenario-to-werkindeling.ts`:
```typescript
/**
 * Data-migratie: archiveer niet-werkindeling scenario's als WerkindelingSnapshot.
 * Draai eenmalig na de schema-migratie.
 */
import { PrismaClient } from "@oranje-wit/database";

const prisma = new PrismaClient();

async function main() {
  // Alle scenario's die GEEN werkindeling zijn (legacy data)
  const oudScenarios = await (prisma as any).scenario.findMany({
    where: { isWerkindeling: false, verwijderdOp: null },
    include: {
      versies: { include: { teams: { include: { spelers: true, staf: true } } } },
      werkitems: true,
    },
  });

  console.log(`${oudScenarios.length} niet-werkindeling scenario's gevonden om te archiveren`);

  for (const scenario of oudScenarios) {
    await (prisma as any).werkindelingSnapshot.create({
      data: {
        werkindelingId: scenario.id,
        naam: scenario.naam,
        reden: "GEMIGREERD",
        data: JSON.parse(JSON.stringify(scenario)),
        aantalTeams: scenario.versies.reduce((s: number, v: any) => s + v.teams.length, 0),
        aantalSpelers: scenario.versies.reduce(
          (s: number, v: any) =>
            s + v.teams.reduce((ts: number, t: any) => ts + t.spelers.length, 0),
          0
        ),
        auteur: "migratie-script",
      },
    });
    console.log(`  Gearchiveerd: ${scenario.naam} (${scenario.id})`);
  }

  console.log("Migratie klaar.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Stap 2: Draai het script (development)**

```bash
cd c:/Users/Antjan/oranje-wit
npx tsx scripts/migrate/migrate-scenario-to-werkindeling.ts
```

Verwacht: output toont aantal gearchiveerde scenario's, geen fouten.

- [ ] **Stap 3: Update `prisma.ts`**

In `apps/web/src/lib/teamindeling/db/prisma.ts`, pas `AnyPrismaModels` aan:

```typescript
// Oud (verwijder deze regels):
  concept: AnyModel;
  scenario: AnyModel;
  scenarioSnapshot: AnyModel;

// Nieuw (voeg toe):
  werkindeling: AnyModel;
  werkindelingSnapshot: AnyModel;
```

- [ ] **Stap 4: Herschrijf `werkindeling.ts`**

Vervang de volledige inhoud van `apps/web/src/lib/teamindeling/db/werkindeling.ts`:

```typescript
"use server";

import { prisma } from "./prisma";
import { logger } from "@oranje-wit/types";

/**
 * Haal de werkindeling op voor een blauwdruk.
 * Retourneert null als er geen werkindeling is.
 */
export async function getWerkindeling(blauwdrukId: string) {
  return prisma.werkindeling.findFirst({
    where: { blauwdrukId, verwijderdOp: null },
    select: {
      id: true,
      naam: true,
      status: true,
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
  const result = await prisma.werkindeling.findFirst({
    where: { blauwdrukId, verwijderdOp: null },
    select: { id: true },
  });
  return result?.id ?? null;
}

/**
 * Maak een werkindeling aan voor een blauwdruk (eerste lege versie).
 * Wordt automatisch aangeroepen als er nog geen werkindeling bestaat.
 */
export async function maakWerkindelingAan(blauwdrukId: string, auteur: string): Promise<string> {
  const werkindeling = await prisma.werkindeling.create({
    data: {
      blauwdrukId,
      naam: "Werkindeling",
      versies: {
        create: {
          nummer: 1,
          naam: "Initieel",
          auteur,
        },
      },
    },
    select: { id: true },
  });
  logger.info(`Werkindeling aangemaakt voor blauwdruk ${blauwdrukId}`);
  return werkindeling.id;
}
```

- [ ] **Stap 5: Hernoem en herschrijf snapshot helper**

Verwijder `apps/web/src/lib/teamindeling/db/scenario-snapshot.ts`.

Maak `apps/web/src/lib/teamindeling/db/werkindeling-snapshot.ts` aan:

```typescript
"use server";

import { prisma } from "./prisma";
import { logger } from "@oranje-wit/types";

type SnapshotReden = "VERWIJDERD" | "HANDMATIG" | "PRE_DEFINITIEF" | "GEMIGREERD";

/**
 * Maak een JSON-snapshot van een volledige werkindeling.
 */
export async function maakWerkindelingSnapshot(
  werkindelingId: string,
  reden: SnapshotReden,
  auteur?: string
): Promise<string> {
  const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
    where: { id: werkindelingId },
    include: {
      versies: {
        include: {
          teams: { include: { spelers: true, staf: true } },
          selectieGroepen: { include: { spelers: true, staf: true } },
          logItems: true,
        },
        orderBy: { nummer: "desc" },
      },
      werkitems: { include: { actiepunten: true } },
    },
  });

  let aantalTeams = 0;
  let aantalSpelers = 0;
  for (const versie of werkindeling.versies) {
    aantalTeams += versie.teams?.length ?? 0;
    for (const team of versie.teams ?? []) {
      aantalSpelers += team.spelers?.length ?? 0;
    }
  }

  const snapshot = await prisma.werkindelingSnapshot.create({
    data: {
      werkindelingId,
      naam: werkindeling.naam,
      reden,
      data: JSON.parse(JSON.stringify(werkindeling)),
      aantalTeams,
      aantalSpelers,
      auteur,
    },
  });

  logger.info(
    `[snapshot] ${reden}: werkindeling "${werkindeling.naam}" (${aantalTeams} teams, ${aantalSpelers} spelers)`
  );

  return snapshot.id;
}
```

- [ ] **Stap 6: Commit**

```bash
git add scripts/migrate/ apps/web/src/lib/teamindeling/db/
git commit -m "feat(db): werkindeling helpers — auto-create, snapshot, prisma client"
```

---

## Task 3: Server actions sweep

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/versies-actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-impact-actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-resolve-actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-validatie-actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/pins/actions.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/dashboard/actions.ts`
- Modify: `apps/web/src/app/(teamindeling)/teamindeling/page.tsx` (en alle andere mobile TI pages)
- Delete: `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/actions.ts` (en alle bestanden in die map)

- [ ] **Stap 1: Maak `werkindeling-actions.ts` aan**

Dit is de verplaatste en herschreven versie van `scenarios/actions.ts`. Vervang alle `.concept.blauwdruk` chains door `.blauwdruk` direct.

`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts`:

```typescript
"use server";

import { prisma, anyTeam } from "@/lib/teamindeling/db/prisma";
import type { Prisma, TeamCategorie, Kleur } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import { assertSpelerVrij } from "@/lib/teamindeling/db/speler-guard";
import { maakWerkindelingSnapshot } from "@/lib/teamindeling/db/werkindeling-snapshot";

const NIET_VERWIJDERD = { verwijderdOp: null } as const;

async function assertTeamBewerkbaar(teamId: string) {
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      versie: {
        select: {
          werkindeling: { select: { blauwdruk: { select: { seizoen: true } } } },
        },
      },
    },
  })) as { versie: { werkindeling: { blauwdruk: { seizoen: string } } } };
  await assertBewerkbaar(team.versie.werkindeling.blauwdruk.seizoen);
}

async function assertVersieBewerkbaar(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: {
      werkindeling: { select: { blauwdruk: { select: { seizoen: true } } } },
    },
  });
  await assertBewerkbaar(versie.werkindeling.blauwdruk.seizoen);
}

async function assertWerkindelingBewerkbaar(werkindelingId: string) {
  const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
    where: { id: werkindelingId },
    select: { blauwdruk: { select: { seizoen: true } } },
  });
  await assertBewerkbaar(werkindeling.blauwdruk.seizoen);
}

/**
 * Haal de werkindeling op met versies en teams voor de editor.
 */
export async function getWerkindelingVoorEditor(werkindelingId: string) {
  return prisma.werkindeling.findUnique({
    where: { id: werkindelingId, ...NIET_VERWIJDERD },
    select: {
      id: true,
      naam: true,
      status: true,
      toelichting: true,
      blauwdruk: { select: { id: true, seizoen: true } },
      versies: {
        where: {},
        orderBy: { nummer: "desc" },
        select: {
          id: true,
          nummer: true,
          naam: true,
          auteur: true,
          createdAt: true,
          teams: {
            orderBy: { volgorde: "asc" },
            select: {
              id: true,
              naam: true,
              alias: true,
              categorie: true,
              kleur: true,
              teamType: true,
              niveau: true,
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

export async function getAlleSpelers() {
  // Behoudt zelfde implementatie als oude scenarios/actions.ts getAlleSpelers
  return prisma.speler.findMany({
    where: { status: { not: "INACTIEF" } },
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    select: {
      id: true, roepnaam: true, achternaam: true, geboortejaar: true,
      geboortedatum: true, geslacht: true, status: true,
      huidig: true, spelerspad: true, foto: { select: { thumbnailUrl: true } },
    },
  });
}

export async function getPosities(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: { posities: true },
  });
  return versie.posities as Record<string, { x: number; y: number }> | null;
}

export async function slaPositiesOp(versieId: string, posities: Record<string, unknown>) {
  await assertVersieBewerkbaar(versieId);
  await prisma.versie.update({ where: { id: versieId }, data: { posities } });
}

export async function hernoem(werkindelingId: string, naam: string) {
  await assertWerkindelingBewerkbaar(werkindelingId);
  if (!naam.trim()) throw new Error("Naam mag niet leeg zijn");
  await prisma.werkindeling.update({ where: { id: werkindelingId }, data: { naam: naam.trim() } });
  revalidatePath("/ti-studio/indeling");
}

export async function voegSpelerToeAanTeam(
  teamId: string,
  spelerId: string,
  statusOverride?: string
) {
  await assertTeamBewerkbaar(teamId);
  await assertSpelerVrij(spelerId, teamId);
  await anyTeam.update({
    where: { id: teamId },
    data: {
      spelers: {
        create: { spelerId, statusOverride: statusOverride ?? null },
      },
    },
  });
  revalidatePath("/ti-studio/indeling");
}

export async function verwijderSpelerUitTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  await prisma.teamSpeler.deleteMany({ where: { teamId, spelerId } });
  revalidatePath("/ti-studio/indeling");
}

export async function verwijderWerkindeling(werkindelingId: string, auteur: string) {
  await assertWerkindelingBewerkbaar(werkindelingId);
  await maakWerkindelingSnapshot(werkindelingId, "VERWIJDERD", auteur);
  await prisma.werkindeling.update({
    where: { id: werkindelingId },
    data: { verwijderdOp: new Date() },
  });
  revalidatePath("/ti-studio/indeling");
}
```

- [ ] **Stap 2: Maak `versies-actions.ts` aan**

`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/versies-actions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

/**
 * Verwijder een versie hard. De laatste versie mag niet verwijderd worden.
 */
export async function verwijderVersie(versieId: string): Promise<{ ok: true } | { ok: false; fout: string }> {
  await requireTC();

  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: { werkindelingId: true, nummer: true },
  });

  const aantalVersies = await prisma.versie.count({
    where: { werkindelingId: versie.werkindelingId },
  });

  if (aantalVersies <= 1) {
    return { ok: false, fout: "De laatste versie kan niet verwijderd worden." };
  }

  await prisma.versie.delete({ where: { id: versieId } });
  logger.info(`Versie ${versieId} (v${versie.nummer}) hard verwijderd`);
  revalidatePath("/ti-studio/indeling");
  return { ok: true };
}

/**
 * Herstel een eerdere versie door er een nieuwe versie van te maken.
 * De originele versie blijft behouden.
 */
export async function herstelVersie(versieId: string, auteur: string): Promise<{ nieuweVersieId: string }> {
  await requireTC();

  const oudeVersie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    include: {
      teams: {
        include: {
          spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
          staf: { select: { stafId: true, rol: true, notitie: true } },
        },
        orderBy: { volgorde: "asc" },
      },
    },
  });

  // Bepaal het volgende versienummer
  const hoogsteVersie = await prisma.versie.findFirst({
    where: { werkindelingId: oudeVersie.werkindelingId },
    orderBy: { nummer: "desc" },
    select: { nummer: true },
  });
  const volgendNummer = (hoogsteVersie?.nummer ?? 0) + 1;

  const nieuweVersie = await prisma.versie.create({
    data: {
      werkindelingId: oudeVersie.werkindelingId,
      nummer: volgendNummer,
      naam: `Hersteld van v${oudeVersie.nummer}`,
      auteur,
      posities: oudeVersie.posities ?? undefined,
      teams: {
        create: oudeVersie.teams.map((t) => ({
          naam: t.naam,
          alias: t.alias,
          categorie: t.categorie,
          kleur: t.kleur,
          teamType: t.teamType,
          niveau: t.niveau,
          volgorde: t.volgorde,
          spelers: { create: t.spelers },
          staf: { create: t.staf },
        })),
      },
    },
    select: { id: true },
  });

  logger.info(`Versie ${versieId} hersteld als v${volgendNummer}`);
  revalidatePath("/ti-studio/indeling");
  return { nieuweVersieId: nieuweVersie.id };
}
```

- [ ] **Stap 3: Update `indeling/actions.ts`**

Vervang de inhoud van `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/actions.ts`:

```typescript
"use server";

import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindeling, getWerkindelingId, maakWerkindelingAan } from "@/lib/teamindeling/db/werkindeling";
import { prisma } from "@/lib/teamindeling/db/prisma";

/**
 * Haal de werkindeling op voor het actieve seizoen, of maak hem aan.
 * Retourneert altijd een werkindeling (auto-create als nodig).
 */
export async function getOfMaakWerkindelingVoorSeizoen(auteur = "systeem") {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return null;

  const bestaand = await getWerkindeling(blauwdruk.id);
  if (bestaand) return bestaand;

  const id = await maakWerkindelingAan(blauwdruk.id, auteur);
  return getWerkindeling(blauwdruk.id);
}

/**
 * Haal alleen het werkindeling-ID op voor het actieve seizoen.
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

- [ ] **Stap 4: Fix WhatIf actions — vervang `.concept.blauwdruk` chains**

In alle vier `whatif-*-actions.ts` bestanden: vervang elke query die via `concept` naar `blauwdruk` gaat:

```typescript
// Oud (voorbeeld):
const werkindeling = await prisma.scenario.findUniqueOrThrow({
  where: { id: werkindelingId },
  select: { concept: { select: { blauwdruk: { select: { seizoen: true } } } } },
});
await assertBewerkbaar(werkindeling.concept.blauwdruk.seizoen);

// Nieuw:
const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
  where: { id: werkindelingId },
  select: { blauwdruk: { select: { seizoen: true } } },
});
await assertBewerkbaar(werkindeling.blauwdruk.seizoen);
```

Doe hetzelfde patroon voor elke chain in `whatif-validatie-actions.ts` (regel ~139, 150):
```typescript
// Oud:
whatIf.werkindeling.concept.blauwdruk.pins
// Nieuw:
whatIf.werkindeling.blauwdruk.pins
```

- [ ] **Stap 5: Fix `pins/actions.ts`**

In `apps/web/src/app/(teamindeling-studio)/ti-studio/pins/actions.ts`:

```typescript
// Oud (regel ~85–95):
const scenario = await prisma.scenario.findUniqueOrThrow({
  where: { id: scenarioId },
  select: { concept: { select: { blauwdrukId: true } } },
});
...
where: { blauwdrukId: scenario.concept.blauwdrukId },

// Nieuw:
const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
  where: { id: werkindelingId },
  select: { blauwdrukId: true },
});
...
where: { blauwdrukId: werkindeling.blauwdrukId },
```

- [ ] **Stap 6: Fix `dashboard/actions.ts`**

```typescript
// Oud:
return prisma.scenario.findMany({ ... });

// Nieuw:
return prisma.werkindeling.findMany({ where: { verwijderdOp: null }, ... });
```

- [ ] **Stap 7: Fix mobile teamindeling pages**

In elk van de volgende bestanden: vervang `prisma.scenario.findFirst({ where: { isWerkindeling: true ... }})` door de nieuwe helper:

```typescript
// apps/web/src/app/(teamindeling)/teamindeling/page.tsx
// apps/web/src/app/(teamindeling)/teamindeling/spelers/page.tsx
// apps/web/src/app/(teamindeling)/teamindeling/teams/page.tsx
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";

// Vervang:
const werkindeling = await prisma.scenario.findFirst({
  where: { isWerkindeling: true, concept: { blauwdruk: { seizoen } } },
  ...
});

// Door:
const blauwdruk = await prisma.blauwdruk.findUnique({ where: { seizoen }, select: { id: true } });
const werkindelingId = blauwdruk ? await getWerkindelingId(blauwdruk.id) : null;
```

- [ ] **Stap 8: Fix API routes**

In `apps/web/src/app/api/teamindeling/scenarios/[id]/teams/route.ts`, `batch-plaats/route.ts` en `teamscore-sync/route.ts`:
- Vervang `prisma.scenario` door `prisma.werkindeling`
- Verwijder checks op `isWerkindeling`

- [ ] **Stap 9: Verwijder `scenarios/` directory**

```bash
rm -rf apps/web/src/app/\(teamindeling-studio\)/ti-studio/scenarios/
```

- [ ] **Stap 10: Build check**

```bash
pnpm --filter web build 2>&1 | grep -E "error|Error" | head -20
```

Los alle TypeScript-errors op voor je commit.

- [ ] **Stap 11: Commit**

```bash
git add apps/web/src/
git commit -m "feat(actions): scenario→werkindeling — alle server actions bijgewerkt"
```

---

## Task 4: Indeling pagina — auto-create + editor + versies panel

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`
- Create: `apps/web/src/components/teamindeling/werkindeling/VersiesPanel.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/[id]/page.tsx` → redirect
- Delete: wizard-componenten

- [ ] **Stap 1: Herschrijf `indeling/page.tsx`**

```typescript
export const dynamic = "force-dynamic";

import { getOfMaakWerkindelingVoorSeizoen } from "./actions";
import { getWerkindelingVoorEditor, getAlleSpelers, getPosities } from "./werkindeling-actions";
import ScenarioEditorFullscreen from "@/components/teamindeling/scenario/editor/ScenarioEditorFullscreen";
import type { WerkindelingData, SpelerData } from "@/components/teamindeling/scenario/types";
import type { PositionMap } from "@/components/teamindeling/scenario/hooks/useCardPositions";

export default async function IndelingPage() {
  const werkindeling = await getOfMaakWerkindelingVoorSeizoen("systeem");

  if (!werkindeling) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Geen actief seizoen gevonden. Maak eerst een seizoen aan via Beheer.
        </p>
      </div>
    );
  }

  const volledig = await getWerkindelingVoorEditor(werkindeling.id);
  if (!volledig) return null;

  const alleSpelers = await getAlleSpelers();
  const laatsteVersie = volledig.versies[0];
  const initialPosities = laatsteVersie ? await getPosities(laatsteVersie.id) : null;

  return (
    <ScenarioEditorFullscreen
      scenario={volledig as unknown as WerkindelingData}
      alleSpelers={alleSpelers as unknown as SpelerData[]}
      initialMode="edit"
      initialPosities={initialPosities as PositionMap | null}
    />
  );
}
```

- [ ] **Stap 2: Maak `VersiesPanel.tsx` aan**

`apps/web/src/components/teamindeling/werkindeling/VersiesPanel.tsx`:

```typescript
"use client";

import { useState, useTransition } from "react";
import { verwijderVersie, herstelVersie } from "@/app/(teamindeling-studio)/ti-studio/indeling/versies-actions";

interface Versie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: string;
  isHuidig: boolean;
}

interface VersiesPanelProps {
  versies: Versie[];
  gebruikerEmail: string;
}

export default function VersiesPanel({ versies, gebruikerEmail }: VersiesPanelProps) {
  const [bevestigDelete, setBevestigDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (versieId: string) => {
    if (bevestigDelete !== versieId) {
      setBevestigDelete(versieId);
      return;
    }
    startTransition(async () => {
      const result = await verwijderVersie(versieId);
      if (!result.ok) alert(result.fout);
      setBevestigDelete(null);
    });
  };

  const handleHerstel = (versieId: string) => {
    startTransition(async () => {
      await herstelVersie(versieId, gebruikerEmail);
    });
  };

  return (
    <div className="space-y-1">
      <div
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Versies
      </div>

      {versies.map((versie) => (
        <div
          key={versie.id}
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: versie.isHuidig ? "var(--state-selected)" : "transparent",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              v{versie.nummer}
              {versie.isHuidig && (
                <span className="ml-2 text-xs" style={{ color: "var(--ow-oranje-500)" }}>
                  Huidig
                </span>
              )}
            </div>
            <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
              {versie.naam ?? versie.auteur} ·{" "}
              {new Date(versie.createdAt).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {!versie.isHuidig && (
            <button
              onClick={() => handleHerstel(versie.id)}
              disabled={isPending}
              className="shrink-0 rounded px-2 py-1 text-xs"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
            >
              Herstel
            </button>
          )}

          {versies.length > 1 && (
            <button
              onClick={() => handleDelete(versie.id)}
              disabled={isPending}
              className="shrink-0 rounded px-2 py-1 text-xs"
              style={{
                color: bevestigDelete === versie.id ? "var(--color-error-500)" : "var(--text-tertiary)",
                border: `1px solid ${bevestigDelete === versie.id ? "var(--color-error-500)" : "var(--border-default)"}`,
              }}
            >
              {bevestigDelete === versie.id ? "Zeker?" : "🗑"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Stap 3: Voeg VersiesPanel toe aan de editor**

In `apps/web/src/components/teamindeling/scenario/editor/ScenarioEditorFullscreen.tsx`, zoek de plek waar de zijbalk/sidebar wordt gerenderd en voeg het VersiesPanel toe:

```typescript
import VersiesPanel from "@/components/teamindeling/werkindeling/VersiesPanel";

// In de sidebar/panel sectie:
<VersiesPanel
  versies={scenario.versies.map((v, i) => ({
    ...v,
    createdAt: v.createdAt.toString(),
    isHuidig: i === 0,
  }))}
  gebruikerEmail={gebruikerEmail}
/>
```

- [ ] **Stap 4: Zet `scenarios/[id]/page.tsx` om naar redirect**

`apps/web/src/app/(teamindeling-studio)/ti-studio/scenarios/[id]/page.tsx`:
```typescript
import { redirect } from "next/navigation";
export default function ScenarioPage() {
  redirect("/ti-studio/indeling");
}
```

- [ ] **Stap 5: Update `types.ts` — hernoem ScenarioData → WerkindelingData**

In `apps/web/src/components/teamindeling/scenario/types.ts`:
```typescript
// Hernoem de export:
export interface WerkindelingData { /* zelfde velden */ }
// Voeg backward-compat alias toe voor geleidelijke sweep:
export type ScenarioData = WerkindelingData;
```

- [ ] **Stap 6: Verwijder wizard-componenten**

```bash
rm apps/web/src/components/teamindeling/scenarios/NieuwScenarioWizard.tsx
rm apps/web/src/components/teamindeling/scenarios/StapMethode.tsx
rm apps/web/src/components/teamindeling/scenarios/wizard-stappen.tsx
rm apps/web/src/components/teamindeling/scenarios/VerwijderScenarioKnop.tsx
rm apps/web/src/components/teamindeling/scenarios/Prullenbak.tsx
rm apps/web/src/components/teamindeling/scenarios/HernoemScenarioKnop.tsx
```

- [ ] **Stap 6: Build check**

```bash
pnpm --filter web build 2>&1 | grep -E "^.*error" | head -20
```

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/
git commit -m "feat(ui): indeling auto-create werkindeling, VersiesPanel, wizard verwijderd"
```

---

## Task 5: Vergelijk pagina — WhatIf in plaats van scenario's

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/vergelijk/page.tsx`
- Modify: `apps/web/src/components/teamindeling/vergelijk/ScenarioVergelijk.tsx` (hernoemd naar `WhatIfVergelijk.tsx`)
- Modify: `apps/web/src/components/teamindeling/vergelijk/TeamDiff.tsx`

- [ ] **Stap 1: Hernoem ScenarioVergelijk → WhatIfVergelijk**

```bash
mv apps/web/src/components/teamindeling/vergelijk/ScenarioVergelijk.tsx \
   apps/web/src/components/teamindeling/vergelijk/WhatIfVergelijk.tsx
```

Pas de component-naam en props aan in `WhatIfVergelijk.tsx`:
- `scenarioA` / `scenarioB` → `whatIfA` / `whatIfB`
- Props type: `{ id, vraag, teams: [...] }` (WhatIf data shape)
- Exportnaam: `WhatIfVergelijk`

- [ ] **Stap 2: Herschrijf de vergelijk-pagina**

`apps/web/src/app/(teamindeling-studio)/ti-studio/vergelijk/page.tsx`:

```typescript
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import WhatIfVergelijk from "@/components/teamindeling/vergelijk/WhatIfVergelijk";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VergelijkPage(props: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const searchParams = await props.searchParams;
  const idA = searchParams.a;
  const idB = searchParams.b;

  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({ where: { seizoen }, select: { id: true } });
  if (!blauwdruk) return <p>Geen actief seizoen.</p>;

  const werkindelingId = await getWerkindelingId(blauwdruk.id);
  if (!werkindelingId) return <p>Geen werkindeling gevonden.</p>;

  const whatIfs = await prisma.whatIf.findMany({
    where: { werkindelingId, status: { not: "VERWORPEN" } },
    select: { id: true, vraag: true },
    orderBy: { createdAt: "desc" },
  });

  const kanVergelijken = Boolean(idA && idB && idA !== idB);
  const [whatIfA, whatIfB] = kanVergelijken
    ? await Promise.all([
        prisma.whatIf.findUnique({ where: { id: idA! }, include: { teams: { include: { spelers: true } } } }),
        prisma.whatIf.findUnique({ where: { id: idB! }, include: { teams: { include: { spelers: true } } } }),
      ])
    : [null, null];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            What-If vergelijking
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Vergelijk twee what-if varianten naast elkaar
          </p>
        </div>
        <Link href="/ti-studio/indeling" className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          ← Terug
        </Link>
      </div>

      {/* WhatIf selector */}
      <form className="flex gap-4 rounded-lg border p-4" style={{ borderColor: "var(--border-default)" }}>
        {(["a", "b"] as const).map((slot) => (
          <div key={slot} className="flex-1">
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              What-If {slot.toUpperCase()}
            </label>
            <select
              name={slot}
              defaultValue={slot === "a" ? idA ?? "" : idB ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-raised)", color: "var(--text-primary)" }}
            >
              <option value="" disabled>Selecteer what-if...</option>
              {whatIfs.map((w) => (
                <option key={w.id} value={w.id}>{w.vraag}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--ow-oranje-500)" }}
          >
            Vergelijk
          </button>
        </div>
      </form>

      {whatIfA && whatIfB && (
        <WhatIfVergelijk whatIfA={whatIfA as any} whatIfB={whatIfB as any} />
      )}
    </div>
  );
}
```

- [ ] **Stap 3: Build check**

```bash
pnpm --filter web build 2>&1 | grep -E "error" | head -10
```

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/vergelijk/ \
        apps/web/src/components/teamindeling/vergelijk/
git commit -m "feat(vergelijk): WhatIf-vergelijking vervangt scenario-vergelijking"
```

---

## Task 6: AI plugin + E2E tests + finale cleanup

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts`
- Modify: `apps/web/src/lib/ai/plugins/teamindeling.ts`
- Modify: `apps/web/src/lib/ai/daisy-acties.ts`
- Modify: `e2e/team-indeling/scenario-wizard.spec.ts`
- Modify: `e2e/team-indeling/navigatie.spec.ts`

- [ ] **Stap 1: Fix Daisy TI-studio plugin**

In `apps/web/src/lib/ai/plugins/ti-studio.ts`:

Vervang elk `prisma.concept.findFirst(...)` (regel ~820):
```typescript
// Oud:
const concept = await prisma.concept.findFirst({
  where: { blauwdrukId },
  select: { id: true },
});
// Nieuw — concept bestaat niet meer, zoek direct de werkindeling:
const werkindeling = await prisma.werkindeling.findFirst({
  where: { blauwdrukId, verwijderdOp: null },
  select: { id: true },
});
```

Pas alle queries aan die via `.concept.blauwdruk` gaan naar `.blauwdruk` direct.

- [ ] **Stap 2: Fix teamindeling plugin**

In `apps/web/src/lib/ai/plugins/teamindeling.ts` (regels ~89–106):

```typescript
// Oud:
const concepten = await prisma.concept.findMany({...});
...concept: s.concept.naam,

// Nieuw:
const werkindelingen = await prisma.werkindeling.findMany({
  where: { blauwdruk: { isWerkseizoen: true }, verwijderdOp: null },
  select: { id: true, naam: true, versies: { orderBy: { nummer: "desc" }, take: 1, select: { teams: { select: { _count: { select: { spelers: true } } } } } } },
});
```

- [ ] **Stap 3: Fix daisy-acties.ts**

In `apps/web/src/lib/ai/daisy-acties.ts`: vervang `scenarioId` referenties in queries door `werkindelingId`.

- [ ] **Stap 4: Herschrijf E2E wizard test**

`e2e/team-indeling/scenario-wizard.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Werkindeling auto-create", () => {
  test("Indeling-pagina opent direct de editor zonder wizard", async ({ page }) => {
    await page.goto("/ti-studio/indeling");
    // Geen wizard te zien
    await expect(page.getByText("Kies een methode")).not.toBeVisible();
    // Editor is zichtbaar (de drag-and-drop editor laadt)
    await expect(page.locator('[data-testid="scenario-editor"]')).toBeVisible({ timeout: 10000 });
  });

  test("Versies-panel toont tenminste 1 versie", async ({ page }) => {
    await page.goto("/ti-studio/indeling");
    await page.getByText("Versies").waitFor();
    await expect(page.getByText(/v1/)).toBeVisible();
  });
});
```

- [ ] **Stap 5: Update navigatie E2E test**

In `e2e/team-indeling/navigatie.spec.ts`: vervang alle referenties naar `/ti-studio/scenarios` door `/ti-studio/indeling`.

- [ ] **Stap 6: Draai E2E tests**

```bash
pnpm test:e2e --grep "werkindeling|navigatie"
```

Verwacht: tests groen of gefixte failures gerelateerd aan nieuwe routes.

- [ ] **Stap 7: Finale build + unit tests**

```bash
pnpm build && pnpm test
```

Verwacht: build succesvol, alle unit tests groen.

- [ ] **Stap 8: Commit**

```bash
git add apps/web/src/lib/ai/ e2e/team-indeling/
git commit -m "feat(ai+e2e): daisy plugin + e2e tests bijgewerkt na werkindeling vereenvoudiging"
```

---

## Verificatie checklist

Na alle tasks:

- [ ] `pnpm build` — geen TypeScript-errors
- [ ] `pnpm test` — alle unit tests groen
- [ ] `/ti-studio/indeling` opent direct de editor (geen wizard)
- [ ] Versies-panel zichtbaar met herstel + delete knoppen
- [ ] Laatste versie heeft geen delete-knop
- [ ] `/ti-studio/vergelijk` toont WhatIf-selector i.p.v. scenario-selector
- [ ] `/ti-studio/scenarios/*` redirect naar `/ti-studio/indeling`
- [ ] `prisma.concept` nergens meer in de codebase
- [ ] `prisma.scenario` nergens meer in de codebase (behalve eventuele legacy API routes)
- [ ] Daisy kan werkindeling ophalen via `ow_blauwdruk` MCP tool
- [ ] E2E: indeling + vergelijk tests groen

---

## Buiten scope (stap C — apart plan)

- `Blauwdruk` hernoemen naar `Seizoen` in schema en codebase
- Dit plan volgt zodra stap B stabiel is in productie
