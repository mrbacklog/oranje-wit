# Staf-datamodel Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Historische stafdata opnemen in de database met stafCode als PK, optionele relCode-koppeling, en StafToewijzing-tabel voor seizoen/team/rol-historie.

**Architecture:** Uitbreiding van bestaand Staf-model (identiteitslaag) + nieuwe StafToewijzing-tabel. stafCode (STAF-001) wordt de PK. relCode is optioneel maar steeds vaker verplicht (Sportlink-vereiste). TI-import wordt aangepast.

**Tech Stack:** Prisma (schema), PostgreSQL (Railway), Node.js (import-scripts), pg (database-client)

---

## Breaking Change: Staf.id wordt stafCode

Het huidige `Staf`-model gebruikt Sportlink ID als `@id`. Dit wordt vervangen door `stafCode` (STAF-001). Sportlink rel_code wordt een apart optioneel veld. Dit raakt:
- `apps/team-indeling/src/lib/import.ts` — upsert op `staf.id` (Sportlink ID)
- `TeamStaf.stafId` — FK naar Staf
- `Pin.stafId` — FK naar Staf

**Context:** Historisch hadden veel stafleden geen Sportlink-registratie. Tegenwoordig is rel_code verplicht in Sportlink, dus nieuwe staf zal altijd een rel_code hebben. Bij de teamindeling kan een staflid echter nog geen rel_code hebben op het moment van aanmaken.

---

### Task 1: Prisma schema uitbreiden

**Files:**
- Modify: `packages/database/prisma/schema.prisma:358-372`

**Step 1: Staf-model aanpassen**

Wijzig het Staf-model van:
```prisma
model Staf {
  id           String  @id // Sportlink ID
  naam         String
  geboortejaar Int?
  email        String?
  rollen       String[] // ["trainer", "assistent", "manager", "coordinator"]
  notitie      String?  @db.Text

  teamStaf TeamStaf[]
  pins     Pin[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Naar:
```prisma
model Staf {
  id           String  @id               // stafCode: STAF-001
  relCode      String? @unique @map("rel_code")  // optionele koppeling naar leden
  naam         String
  geboortejaar Int?
  email        String?
  rollen       String[] // ["trainer", "assistent", "manager", "coordinator"]
  notitie      String?  @db.Text

  // Relaties
  lid          Lid?     @relation(fields: [relCode], references: [relCode])
  teamStaf     TeamStaf[]
  pins         Pin[]
  toewijzingen StafToewijzing[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

De `id` is nu de stafCode (STAF-001). Geen `@default(cuid())` — de code wordt door het import-script of de TI-app gegenereerd.

**Step 2: StafToewijzing-model toevoegen**

Voeg toe na het Staf-model:
```prisma
model StafToewijzing {
  id       Int    @id @default(autoincrement())
  stafId   String @map("staf_id")
  seizoen  String
  team     String
  rol      String                    // "Trainer/Coach", "Begeleider", "Verzorger"
  functie  String?                   // originele functietekst uit CSV
  bron     String  @default("staf_overzicht")

  staf     Staf   @relation(fields: [stafId], references: [id])

  @@unique([stafId, seizoen, team])
  @@index([seizoen])
  @@index([stafId])
  @@map("staf_toewijzingen")
}
```

**Step 3: Lid-model uitbreiden met Staf-relatie**

Voeg `stafleden Staf[]` toe aan het Lid-model (voor de optionele relCode-koppeling).

**Step 4: Prisma client genereren**

Run: `pnpm db:generate`
Expected: "Generated Prisma Client"

**Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: staf-model met stafCode als PK, relCode optioneel, StafToewijzing"
```

---

### Task 2: Database migratie

**Files:**
- Modify: database via Prisma

**Step 1: Check bestaande Staf-data**

Run query om te zien of er bestaande Staf-records zijn:
```sql
SELECT COUNT(*) FROM "Staf";
SELECT id, naam FROM "Staf" LIMIT 5;
```

**Step 2a: Als geen bestaande data — directe push**

Run: `pnpm db:push`
Expected: schema synced, StafToewijzing tabel aangemaakt

**Step 2b: Als wél bestaande data — migratiescript**

Schrijf `scripts/js/migreer-staf-id.js`:
1. Lees alle bestaande Staf-records (id = Sportlink ID)
2. Genereer stafCode per record (STAF-001 oplopend)
3. Maak nieuwe records met stafCode als id, oude Sportlink ID → relCode
4. Update FK-referenties in TeamStaf en Pin
5. Verwijder oude records, insert nieuwe

Run eerst de migratie, dan `pnpm db:push` voor StafToewijzing.

**Step 3: Verifieer**

```sql
SELECT id, rel_code, naam FROM "Staf" LIMIT 5;
-- Verwacht: id = STAF-001, rel_code = NXX12Y3 (of null)
```

**Step 4: Commit**

```bash
git commit -m "feat: database migratie staf-datamodel"
```

---

### Task 3: Import-script sync-staf.js

**Files:**
- Create: `scripts/js/sync-staf.js`
- Read: `scripts/js/match-staf.js` (voor naam→relCode mapping)
- Read: `docs/staf/Staf overzicht.csv` (15 seizoenen)
- Read: `docs/staf/Staf 2020-2021.csv` (COVID-seizoen, apart bestand)

**Step 1: Schrijf het import-script**

Het script:
1. Leest beide CSV's (samen 16 seizoenen compleet), parseert regels
2. Splitst teams: "S1/S2" → ["S1", "S2"] (twee StafToewijzing records)
3. Filtert niet-personen (vacatures, carrousel, n.n.b.)
4. Bepaalt unieke personen, genereert stafCodes (STAF-001, volgorde eerste voorkomen in CSV)
5. Gebruikt MANUAL_REL_CODE mapping voor relCode-toewijzing
6. Upsert Staf-records (op id = stafCode)
7. Upsert StafToewijzing-records (op [stafId, seizoen, team])
8. Rapporteert resultaten

**Step 2: Dry-run**

Run: `node scripts/js/sync-staf.js --dry-run`
Expected: overzicht van ~430 personen, ~1022+ toewijzingen

**Step 3: Echte import**

Run: `node scripts/js/sync-staf.js`

**Step 4: Verifieer**

```sql
SELECT COUNT(*) FROM "Staf";                    -- ~430
SELECT COUNT(*) FROM staf_toewijzingen;          -- ~1022+
SELECT s.id, s.naam, s.rel_code
  FROM "Staf" s WHERE s.rel_code IS NOT NULL LIMIT 5;
```

**Step 5: Commit**

```bash
git add scripts/js/sync-staf.js
git commit -m "feat: sync-staf import-script voor historische stafdata"
```

---

### Task 4: TI import-code aanpassen

**Files:**
- Modify: `apps/team-indeling/src/lib/import.ts:213-240`

**Step 1: Pas staf-upsert aan**

De huidige code doet `upsert where: { id: staf.id }` met Sportlink ID als id. Nu moet dit:
- Zoek bestaande Staf op `relCode` (als het Sportlink ID een rel_code is)
- Of maak een nieuw record met een gegenereerde stafCode
- De TI-app moet stafCodes kunnen genereren voor nieuwe stafleden

Aanpak:
```typescript
// Zoek bestaand op relCode, anders maak nieuw met stafCode
const bestaand = await prisma.staf.findUnique({ where: { relCode: staf.id } });
if (bestaand) {
  await prisma.staf.update({ where: { id: bestaand.id }, data: { naam, geboortejaar, rollen } });
} else {
  const nextCode = await generateStafCode(prisma);
  await prisma.staf.create({ data: { id: nextCode, relCode: staf.id, naam, geboortejaar, rollen } });
}
```

**Step 2: Helper voor stafCode-generatie**

```typescript
async function generateStafCode(prisma): Promise<string> {
  const last = await prisma.staf.findFirst({
    where: { id: { startsWith: 'STAF-' } },
    orderBy: { id: 'desc' }
  });
  const num = last ? parseInt(last.id.replace('STAF-', '')) + 1 : 1;
  return `STAF-${String(num).padStart(3, '0')}`;
}
```

**Step 3: Test TI-import**

Verifieer dat bestaande TI-functionaliteit (TeamStaf, Pin) nog werkt.

**Step 4: Commit**

```bash
git add apps/team-indeling/src/lib/import.ts
git commit -m "fix: TI staf-import aangepast voor stafCode als PK"
```

---

### Task 5: Opschonen

**Files:**
- Modify: `scripts/js/match-staf.js`
- Delete: `scripts/js/fuzzy-staf.js`

**Step 1: Los resterende 15 onbekende namen op**

De "Achternaam, van X." initiaal-formaten handmatig onderzoeken en toevoegen aan MANUAL_REL_CODE (of als null markeren als niet-lid).

**Step 2: Integreer mapping in sync-staf.js**

Exporteer MANUAL_REL_CODE als gedeelde module of kopieer naar sync-staf.js.

**Step 3: Verwijder fuzzy-staf.js**

Run: `rm scripts/js/fuzzy-staf.js`

**Step 4: Commit**

```bash
git add scripts/js/match-staf.js
git rm scripts/js/fuzzy-staf.js
git commit -m "chore: match-staf opgeschoond, fuzzy-staf verwijderd"
```

---

## Volgorde en afhankelijkheden

```
Task 1 (schema) → Task 2 (migratie) → Task 3 (import) → Task 4 (TI-aanpassing)
                                                        → Task 5 (opschonen)
```

Task 4 en 5 kunnen parallel na Task 3.
