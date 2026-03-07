# SelectieGroep Architectuur — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Spelers en staf koppelen aan een SelectieGroep (eigen entiteit), niet aan een leider-team. Pas bij ontkoppeling worden spelers verdeeld over de individuele teams.

**Architecture:** Nieuw model `SelectieGroep` met eigen `SelectieSpeler` en `SelectieStaf` join-tabellen. Teams verwijzen naar SelectieGroep via FK. Bij ontkoppeling worden SelectieSpeler/Staf records omgezet naar TeamSpeler/TeamStaf en de SelectieGroep verwijderd.

**Tech Stack:** Prisma 7, PostgreSQL (Railway), Next.js 16, TypeScript, dnd-kit

**LET OP:** `pnpm db:push` mag NIET draaien (zou VIEW `speler_seizoenen` droppen). Alle schema-wijzigingen via raw SQL.

---

## Task 1: Prisma schema uitbreiden

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Voeg SelectieGroep, SelectieSpeler, SelectieStaf modellen toe**

Na het bestaande `Team` model, voeg toe:

```prisma
model SelectieGroep {
  id       String @id @default(cuid())
  versie   Versie @relation(fields: [versieId], references: [id], onDelete: Cascade)
  versieId String

  naam     String?

  teams    Team[]
  spelers  SelectieSpeler[]
  staf     SelectieStaf[]

  @@index([versieId])
}

model SelectieSpeler {
  id              String        @id @default(cuid())
  selectieGroep   SelectieGroep @relation(fields: [selectieGroepId], references: [id], onDelete: Cascade)
  selectieGroepId String
  speler          Speler        @relation(fields: [spelerId], references: [id])
  spelerId        String

  statusOverride  SpelerStatus?
  notitie         String?       @db.Text

  @@unique([selectieGroepId, spelerId])
  @@index([selectieGroepId])
  @@index([spelerId])
}

model SelectieStaf {
  id              String        @id @default(cuid())
  selectieGroep   SelectieGroep @relation(fields: [selectieGroepId], references: [id], onDelete: Cascade)
  selectieGroepId String
  staf            Staf          @relation(fields: [stafId], references: [id])
  stafId          String

  rol             String

  @@unique([selectieGroepId, stafId])
  @@index([selectieGroepId])
}
```

**Step 2: Wijzig Team.selectieGroepId van self-reference naar FK naar SelectieGroep**

Verander in het Team model:
```prisma
// OUD (verwijder):
selectieGroepId String?
selectieGroep   Team?   @relation("SelectieGroep", fields: [selectieGroepId], references: [id])
selectieLeden   Team[]  @relation("SelectieGroep")

// NIEUW:
selectieGroepId String?
selectieGroep   SelectieGroep? @relation(fields: [selectieGroepId], references: [id], onDelete: SetNull)
```

**Step 3: Voeg relaties toe aan Speler en Staf modellen**

In model `Speler`, voeg toe:
```prisma
selectiePlaatsingen SelectieSpeler[]
```

In model `Staf`, voeg toe:
```prisma
selectiePlaatsingen SelectieStaf[]
```

In model `Versie`, voeg toe:
```prisma
selectieGroepen SelectieGroep[]
```

**Step 4: Genereer Prisma client**

Run: `pnpm db:generate`

---

## Task 2: Database migratie (raw SQL)

**Files:**
- Create: `scripts/migratie-selectie-groep.mjs`

**Step 1: Schrijf migratiescript**

```javascript
// scripts/migratie-selectie-groep.mjs
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// 1. Maak tabellen aan
await client.query(`
  CREATE TABLE IF NOT EXISTS "SelectieGroep" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "versieId" TEXT NOT NULL REFERENCES "Versie"(id) ON DELETE CASCADE,
    naam TEXT,
    CONSTRAINT "SelectieGroep_versieId_idx" UNIQUE ("versieId", id)
  );
  CREATE INDEX IF NOT EXISTS "SelectieGroep_versieId_idx" ON "SelectieGroep"("versieId");

  CREATE TABLE IF NOT EXISTS "SelectieSpeler" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "selectieGroepId" TEXT NOT NULL REFERENCES "SelectieGroep"(id) ON DELETE CASCADE,
    "spelerId" TEXT NOT NULL REFERENCES "Speler"(id),
    "statusOverride" TEXT,
    notitie TEXT,
    CONSTRAINT "SelectieSpeler_selectieGroepId_spelerId_key" UNIQUE ("selectieGroepId", "spelerId")
  );
  CREATE INDEX IF NOT EXISTS "SelectieSpeler_selectieGroepId_idx" ON "SelectieSpeler"("selectieGroepId");
  CREATE INDEX IF NOT EXISTS "SelectieSpeler_spelerId_idx" ON "SelectieSpeler"("spelerId");

  CREATE TABLE IF NOT EXISTS "SelectieStaf" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "selectieGroepId" TEXT NOT NULL REFERENCES "SelectieGroep"(id) ON DELETE CASCADE,
    "stafId" TEXT NOT NULL REFERENCES "Staf"(id),
    rol TEXT NOT NULL,
    CONSTRAINT "SelectieStaf_selectieGroepId_stafId_key" UNIQUE ("selectieGroepId", "stafId")
  );
  CREATE INDEX IF NOT EXISTS "SelectieStaf_selectieGroepId_idx" ON "SelectieStaf"("selectieGroepId");
`);

console.log("Tabellen aangemaakt");

// 2. Migreer bestaande selectie-data
// Zoek alle teams die een selectieGroepId hebben (= leden)
// Hun leider-team = het team waar selectieGroepId naar verwijst
const { rows: leiders } = await client.query(`
  SELECT DISTINCT t_leider.id as leider_id, t_leider."versieId"
  FROM "Team" t_lid
  JOIN "Team" t_leider ON t_leider.id = t_lid."selectieGroepId"
`);

console.log(`${leiders.length} bestaande selecties gevonden`);

for (const leider of leiders) {
  // Maak SelectieGroep aan
  const { rows: [groep] } = await client.query(`
    INSERT INTO "SelectieGroep" (id, "versieId")
    VALUES (gen_random_uuid()::text, $1)
    RETURNING id
  `, [leider.versieId]);

  console.log(`  SelectieGroep ${groep.id} voor leider ${leider.leider_id}`);

  // Koppel leider-team aan SelectieGroep
  // Verplaats spelers van leider-team naar SelectieSpeler
  await client.query(`
    INSERT INTO "SelectieSpeler" (id, "selectieGroepId", "spelerId", "statusOverride", notitie)
    SELECT gen_random_uuid()::text, $1, ts."spelerId", ts."statusOverride", ts.notitie
    FROM "TeamSpeler" ts
    WHERE ts."teamId" = $2
  `, [groep.id, leider.leider_id]);

  // Verplaats staf van leider-team naar SelectieStaf
  await client.query(`
    INSERT INTO "SelectieStaf" (id, "selectieGroepId", "stafId", rol)
    SELECT gen_random_uuid()::text, $1, ts."stafId", ts.rol
    FROM "TeamStaf" ts
    WHERE ts."teamId" = $2
  `, [groep.id, leider.leider_id]);

  // Verwijder TeamSpeler/TeamStaf van leider-team
  await client.query(`DELETE FROM "TeamSpeler" WHERE "teamId" = $1`, [leider.leider_id]);
  await client.query(`DELETE FROM "TeamStaf" WHERE "teamId" = $1`, [leider.leider_id]);

  // Stel selectieGroepId in op alle teams (leider + leden)
  // Eerst: drop de bestaande FK constraint (self-reference)
  // Dan: update naar nieuwe SelectieGroep id
  await client.query(`
    UPDATE "Team" SET "selectieGroepId" = $1
    WHERE id = $2 OR "selectieGroepId" = $2
  `, [groep.id, leider.leider_id]);
}

// 3. Drop oude FK constraint (self-reference) en maak nieuwe aan
await client.query(`
  ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_selectieGroepId_fkey";
  ALTER TABLE "Team" ADD CONSTRAINT "Team_selectieGroepId_fkey"
    FOREIGN KEY ("selectieGroepId") REFERENCES "SelectieGroep"(id) ON DELETE SET NULL;
`);

console.log("FK constraint bijgewerkt");

// Verify
const { rows: [count] } = await client.query(`SELECT count(*) FROM "SelectieGroep"`);
console.log(`\nKlaar. ${count.count} SelectieGroepen aangemaakt.`);

await client.end();
```

**Step 2: Draai migratie**

Run: `node scripts/migratie-selectie-groep.mjs`

**Step 3: Regenereer Prisma client**

Run: `pnpm db:generate`

---

## Task 3: TypeScript types updaten

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/types.ts`

**Step 1: Voeg SelectieGroepData type toe en update TeamData**

```typescript
// Nieuw type
export interface SelectieGroepData {
  id: string;
  naam: string | null;
  spelers: SelectieSpelerData[];
  staf: SelectieStafData[];
}

export interface SelectieSpelerData {
  id: string;
  spelerId: string;
  statusOverride: SpelerStatus | null;
  notitie: string | null;
  speler: SpelerData;
}

export interface SelectieStafData {
  id: string;
  stafId: string;
  rol: string;
  staf: { id: string; naam: string };
}
```

TeamData.selectieGroepId type wijzigt niet (blijft `string | null`), maar verwijst nu naar een SelectieGroep in plaats van een Team.

---

## Task 4: Server actions herschrijven

**Files:**
- Modify: `apps/team-indeling/src/app/scenarios/team-actions.ts`
- Modify: `apps/team-indeling/src/app/scenarios/actions.ts`

### 4a: team-actions.ts

**koppelSelectie** — maak SelectieGroep, verplaats spelers/staf:

```typescript
export async function koppelSelectie(teamIds: string[]) {
  if (teamIds.length < 2) return;

  // Haal versieId op van eerste team
  const team = await anyTeam.findUniqueOrThrow({
    where: { id: teamIds[0] },
    select: { versieId: true },
  }) as { versieId: string };

  await prisma.$transaction(async (tx) => {
    // 1. Maak SelectieGroep aan
    const groep = await tx.selectieGroep.create({
      data: { versieId: team.versieId },
    });

    // 2. Koppel alle teams aan de groep
    await tx.team.updateMany({
      where: { id: { in: teamIds } },
      data: { selectieGroepId: groep.id },
    });

    // 3. Verplaats alle spelers naar SelectieSpeler
    for (const teamId of teamIds) {
      const spelers = await tx.teamSpeler.findMany({
        where: { teamId },
        select: { spelerId: true, statusOverride: true, notitie: true },
      });
      for (const sp of spelers) {
        await tx.selectieSpeler.upsert({
          where: {
            selectieGroepId_spelerId: {
              selectieGroepId: groep.id,
              spelerId: sp.spelerId,
            },
          },
          create: {
            selectieGroepId: groep.id,
            spelerId: sp.spelerId,
            statusOverride: sp.statusOverride,
            notitie: sp.notitie,
          },
          update: {},
        });
      }
      await tx.teamSpeler.deleteMany({ where: { teamId } });
    }

    // 4. Zelfde voor staf
    for (const teamId of teamIds) {
      const staf = await tx.teamStaf.findMany({
        where: { teamId },
        select: { stafId: true, rol: true },
      });
      for (const st of staf) {
        await tx.selectieStaf.upsert({
          where: {
            selectieGroepId_stafId: {
              selectieGroepId: groep.id,
              stafId: st.stafId,
            },
          },
          create: {
            selectieGroepId: groep.id,
            stafId: st.stafId,
            rol: st.rol,
          },
          update: {},
        });
      }
      await tx.teamStaf.deleteMany({ where: { teamId } });
    }
  });

  revalidatePath("/scenarios");
}
```

**ontkoppelSelectie** — simpele versie (geen verdeling, spelers blijven in pool → TBD):

```typescript
export async function ontkoppelSelectie(groepId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.team.updateMany({
      where: { selectieGroepId: groepId },
      data: { selectieGroepId: null },
    });
    await tx.selectieGroep.delete({ where: { id: groepId } });
  });
  revalidatePath("/scenarios");
}
```

**ontkoppelSelectieMetVerdeling** — verdeel spelers/staf over teams:

```typescript
export async function ontkoppelSelectieMetVerdeling(
  groepId: string,
  spelerVerdeling: Record<string, string[]>,
  stafVerdeling: Record<string, string[]>,
  alleTeamIds: string[]
) {
  await prisma.$transaction(async (tx) => {
    // 1. Haal selectie-spelers op (met statusOverride/notitie)
    const selSpelers = await tx.selectieSpeler.findMany({
      where: { selectieGroepId: groepId },
    });
    const spelerMap = new Map(selSpelers.map((s) => [s.spelerId, s]));

    // 2. Verdeel spelers over teams
    for (const [teamId, spelerIds] of Object.entries(spelerVerdeling)) {
      for (const spelerId of spelerIds) {
        const sel = spelerMap.get(spelerId);
        await tx.teamSpeler.create({
          data: {
            teamId,
            spelerId,
            statusOverride: sel?.statusOverride ?? null,
            notitie: sel?.notitie ?? null,
          },
        });
      }
    }

    // 3. Verdeel staf over teams
    const selStaf = await tx.selectieStaf.findMany({
      where: { selectieGroepId: groepId },
    });
    const stafMap = new Map(selStaf.map((s) => [s.stafId, s]));

    for (const [teamIdOrAlle, stafIds] of Object.entries(stafVerdeling)) {
      if (teamIdOrAlle === "alle") {
        for (const stafId of stafIds) {
          const sel = stafMap.get(stafId);
          if (!sel) continue;
          for (const tid of alleTeamIds) {
            await tx.teamStaf.upsert({
              where: { teamId_stafId: { teamId: tid, stafId } },
              create: { teamId: tid, stafId, rol: sel.rol },
              update: {},
            });
          }
        }
      } else {
        for (const stafId of stafIds) {
          const sel = stafMap.get(stafId);
          if (!sel) continue;
          await tx.teamStaf.create({
            data: { teamId: teamIdOrAlle, stafId, rol: sel.rol },
          });
        }
      }
    }

    // 4. Ontkoppel teams + verwijder SelectieGroep (cascade verwijdert SelectieSpeler/Staf)
    await tx.team.updateMany({
      where: { selectieGroepId: groepId },
      data: { selectieGroepId: null },
    });
    await tx.selectieGroep.delete({ where: { id: groepId } });
  });

  revalidatePath("/scenarios");
}
```

**deleteTeam** — update voor nieuwe structuur.

### 4b: actions.ts

**getScenario** — include SelectieGroep data:

Voeg aan de Prisma query toe:
```typescript
versies: {
  include: {
    selectieGroepen: {
      include: {
        spelers: { include: { speler: true } },
        staf: { include: { staf: true } },
      },
    },
    teams: { ... },
  },
}
```

**addSpelerToTeam** — check of team in selectie zit → dan naar SelectieSpeler:

```typescript
export async function addSpelerToTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  const team = await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { selectieGroepId: true },
  }) as { selectieGroepId: string | null };

  if (team.selectieGroepId) {
    // Team is onderdeel van selectie → voeg toe aan SelectieSpeler
    await prisma.selectieSpeler.create({
      data: { selectieGroepId: team.selectieGroepId, spelerId },
    });
  } else {
    await prisma.teamSpeler.create({
      data: { teamId, spelerId },
    });
  }
  revalidatePath("/scenarios");
}
```

Analoog voor removeSpeler en moveSpeler.

---

## Task 5: UI componenten aanpassen

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/SelectieBlok.tsx`
- Modify: `apps/team-indeling/src/components/scenario/Werkgebied.tsx`
- Modify: `apps/team-indeling/src/components/scenario/hooks/useScenarioEditor.ts`
- Modify: `apps/team-indeling/src/components/scenario/TeamEditPanel.tsx`
- Modify: `apps/team-indeling/src/components/scenario/view/ViewSelectieBlok.tsx`
- Modify: `apps/team-indeling/src/components/scenario/VerdeelDialoog.tsx`

### 5a: useScenarioEditor.ts

- Voeg `selectieGroepen` state toe (Map<string, SelectieGroepData>)
- Parse selectieGroepen uit scenario-data
- Update handleKoppelSelectie: maak lokale SelectieGroepData, verplaats spelers
- Update handleOntkoppelSelectie/handleVerdeelBevestig
- handleDragEnd: als drop-target een team in selectie is → voeg toe aan SelectieSpeler

### 5b: SelectieBlok.tsx

Wijzig props: ontvang `selectieGroep: SelectieGroepData` i.p.v. spelers uit leider-team.

```typescript
// OUD:
const alleSpelers = leider.spelers;

// NIEUW:
const alleSpelers = selectieGroep.spelers;
```

### 5c: Werkgebied.tsx

Wijzig selectie-groepering: gebruik `team.selectieGroepId` om teams te groeperen, maar haal spelers uit `selectieGroepen` map.

### 5d: VerdeelDialoog.tsx

Props wijzigen: ontvang `selectieGroep: SelectieGroepData` voor spelers/staf i.p.v. `leiderTeam.spelers`.

---

## Task 6: AI tools + batch-plaats aanpassen

**Files:**
- Modify: `apps/team-indeling/src/lib/ai/tools.ts`
- Modify: `apps/team-indeling/src/lib/ai/tool-defs.ts`
- Modify: `apps/team-indeling/src/lib/ai/scenario-context.ts`
- Modify: `apps/team-indeling/src/app/api/scenarios/[id]/batch-plaats/route.ts`

- `batch_plaats_spelers`: als doelteam in selectie → schrijf naar SelectieSpeler
- `voeg_speler_toe`: check selectie
- `getSpelersPoolContext`: tel SelectieSpeler mee als "ingedeeld"
- `getTeamsContext`: include selectie-spelers bij selectie-teams

---

## Task 7: CLI script aanpassen

**Files:**
- Modify: `scripts/plaats-spelers.mjs`

- Bij `--show`: toon selectie-spelers apart
- Bij plaatsing: als doelteam in selectie → insert in SelectieSpeler
- Bij `--pool`: tel SelectieSpeler mee als ingedeeld

---

## Task 8: API route aanpassen

**Files:**
- Modify: `apps/team-indeling/src/app/api/scenarios/[id]/teams/route.ts`

Include selectieGroepen in response.

---

## Volgorde van uitvoering

1. Schema (Task 1) → generate
2. Migratie SQL (Task 2) → draai op productie
3. Types (Task 3)
4. Server actions (Task 4) — kern van de wijziging
5. UI (Task 5) — grootste taak qua bestanden
6. AI tools (Task 6)
7. CLI (Task 7)
8. API (Task 8)
9. Test alles in UI
10. Commit
