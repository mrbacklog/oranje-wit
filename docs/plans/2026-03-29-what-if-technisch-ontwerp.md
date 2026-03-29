# Technisch ontwerp: What-if model voor Team-Indeling

**Datum**: 2026-03-29
**Status**: Ontwerp, wacht op review
**Auteur**: ontwikkelaar
**Design spec**: `docs/specs/2026-03-29-what-if-model-design.md`
**Handshake**: UX-designer, product-owner, frontend

---

## Scope

Dit ontwerp dekt **fase 1** (werkindeling) en **fase 2** (what-if basis) uit de design spec. Fase 3-5 (impact-panel, validatie-uitbreiding, afhankelijkheden) worden in een vervolgontwerp uitgewerkt.

---

## 1. Prisma schema wijzigingen

### 1.1 Wijziging aan Scenario model

Bestaand model, nieuw veld:

```prisma
model Scenario {
  // ... bestaande velden ...

  isWerkindeling  Boolean   @default(false)

  // ... bestaande relaties ...
  whatIfs          WhatIf[]
}
```

De `isWerkindeling` vlag markeert welk scenario de werkindeling is. Constraint: **max 1 werkindeling per blauwdruk**. Dit wordt afgedwongen via:

1. **Applicatie-laag** (primair): de functie `promoveerTotWerkindeling()` zet alle andere scenario's in dezelfde blauwdruk op `isWerkindeling: false` voordat het gekozen scenario op `true` wordt gezet, in een `$transaction`.
2. **Partial unique index** (secundair): Prisma ondersteunt geen `WHERE`-clause in `@@unique`, dus we voegen een raw SQL partial unique index toe in de migratie:

```sql
CREATE UNIQUE INDEX "idx_scenario_werkindeling_per_blauwdruk"
ON "Scenario" ("conceptId")
WHERE "isWerkindeling" = true;
```

Dit werkt omdat alle scenario's in een blauwdruk via dezelfde concept lopen (`Scenario.conceptId` -> `Concept.blauwdrukId`). Maar een blauwdruk kan meerdere concepten hebben, dus de index moet op blauwdruk-niveau werken. Aangezien we in de praktijk per blauwdruk 1 concept gebruiken (het Concept-model wordt in de UI niet meer als zichtbaar concept getoond), is dit afdoende. Als extra zekerheid voegen we een applicatie-guard toe die controleert over alle concepten van de blauwdruk.

**Applicatie-guard** (in `src/lib/teamindeling/db/werkindeling-guard.ts`):

```typescript
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
```

### 1.2 Nieuw model: WhatIf

```prisma
model WhatIf {
  id                    String        @id @default(cuid())
  werkindelingId        String
  werkindeling          Scenario      @relation(fields: [werkindelingId], references: [id], onDelete: Cascade)

  vraag                 String        // Titel: "Wat als we een 3e senioren team maken?"
  toelichting           String?       @db.Text

  status                WhatIfStatus  @default(OPEN)

  // Snapshot: op welke versie van de werkindeling is deze what-if gebaseerd?
  basisVersieNummer     Int           // Versie.nummer op moment van aanmaken

  // Bij toepassen
  toelichtingAfwijking  String?       @db.Text
  toegepastOp           DateTime?
  verworpenOp           DateTime?

  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  // Relaties
  teams                 WhatIfTeam[]
  acties                Werkitem[]    @relation("WhatIfActies")

  @@index([werkindelingId])
  @@index([status])
  @@map("what_ifs")
}

enum WhatIfStatus {
  OPEN
  BESLISBAAR
  TOEGEPAST
  VERWORPEN
}
```

**Ontwerpkeuzes:**

- **`basisVersieNummer` i.p.v. `basisVersieId` FK**: we slaan het versienummer op (niet de ID) zodat we later de "stale basis" detectie kunnen doen door te vergelijken met het huidige versienummer van de werkindeling. Een FK zou complicaties geven als versies worden opgeruimd.
- **Geen `afhankelijkVanId` in fase 2**: afhankelijkheden komen in fase 5. Het model is additief; we voegen dat veld later toe.
- **`WACHT_OP_ANTWOORDEN` niet in fase 2**: de actie-koppeling komt in fase 5. De enum start simpel met 4 statussen. `WACHT_OP_ANTWOORDEN` en `GEBLOKKEERD` worden later toegevoegd.
- **`onDelete: Cascade` op werkindeling**: als de werkindeling verwijderd wordt, gaan alle what-ifs mee. Dit is bewust; what-ifs hebben geen zin zonder hun basis.

### 1.3 Nieuw model: WhatIfTeam

```prisma
model WhatIfTeam {
  id            String      @id @default(cuid())
  whatIfId      String
  whatIf        WhatIf      @relation(fields: [whatIfId], references: [id], onDelete: Cascade)

  // Referentie naar origineel team (null = nieuw team in what-if)
  bronTeamId    String?
  bronTeam      Team?       @relation(fields: [bronTeamId], references: [id])

  // Team-data (kopie van origineel, bewerkbaar binnen what-if)
  naam          String
  categorie     TeamCategorie
  kleur         Kleur?
  teamType      TeamType?
  niveau        String?
  volgorde      Int         @default(0)

  // Relaties
  spelers       WhatIfTeamSpeler[]
  staf          WhatIfTeamStaf[]

  @@index([whatIfId])
  @@index([bronTeamId])
  @@map("what_if_teams")
}
```

**Relatie `bronTeam`**: verwijst naar het originele `Team` in de werkindeling-versie. Dit maakt het mogelijk om bij "toepassen" de juiste teams te overschrijven. Bij een nieuw team (aangemaakt in de what-if) is `bronTeamId` null.

**Geen `onDelete: Cascade` op `bronTeam`**: als het bronteam verwijderd wordt uit de werkindeling terwijl een what-if open staat, willen we dat niet stilzwijgend cascaden. De what-if moet een "stale" melding krijgen. Prisma's default `SetNull` op optional FKs lost dit op.

### 1.4 Nieuw model: WhatIfTeamSpeler

```prisma
model WhatIfTeamSpeler {
  id              String          @id @default(cuid())
  whatIfTeamId    String
  whatIfTeam      WhatIfTeam      @relation(fields: [whatIfTeamId], references: [id], onDelete: Cascade)
  spelerId        String
  speler          Speler          @relation(fields: [spelerId], references: [id])

  statusOverride  SpelerStatus?
  notitie         String?         @db.Text

  @@unique([whatIfTeamId, spelerId])
  @@index([whatIfTeamId])
  @@index([spelerId])
  @@map("what_if_team_spelers")
}
```

### 1.5 Nieuw model: WhatIfTeamStaf

```prisma
model WhatIfTeamStaf {
  id              String      @id @default(cuid())
  whatIfTeamId    String
  whatIfTeam      WhatIfTeam  @relation(fields: [whatIfTeamId], references: [id], onDelete: Cascade)
  stafId          String
  staf            Staf        @relation(fields: [stafId], references: [id])

  rol             String?

  @@unique([whatIfTeamId, stafId])
  @@index([whatIfTeamId])
  @@map("what_if_team_staf")
}
```

### 1.6 Relatie WhatIf.acties -> Werkitem

Het bestaande `Werkitem` model heeft al `scenarioId` (optioneel). We voegen een optionele `whatIfId` toe:

```prisma
model Werkitem {
  // ... bestaande velden ...

  // NIEUW: optionele koppeling aan what-if
  whatIf       WhatIf?  @relation("WhatIfActies", fields: [whatIfId], references: [id], onDelete: Cascade)
  whatIfId     String?

  // ... bestaande relaties ...
}
```

Zo kan een Werkitem ofwel aan een scenario (legacy), ofwel aan een what-if, ofwel aan alleen de blauwdruk gekoppeld zijn.

### 1.7 Relatie-uitbreidingen op bestaande modellen

Op `Speler`:
```prisma
model Speler {
  // ... bestaand ...
  whatIfPlaatsingen    WhatIfTeamSpeler[]
}
```

Op `Staf`:
```prisma
model Staf {
  // ... bestaand ...
  whatIfPlaatsingen    WhatIfTeamStaf[]
}
```

Op `Team`:
```prisma
model Team {
  // ... bestaand ...
  whatIfKopieen       WhatIfTeam[]    // Teams die dit team als bron gebruiken
}
```

### 1.8 Indexes overzicht

| Model | Index | Reden |
|---|---|---|
| WhatIf | `werkindelingId` | Snel opvragen van what-ifs per werkindeling |
| WhatIf | `status` | Filteren op open/beslisbaar/etc. |
| WhatIfTeam | `whatIfId` | Alle teams in een what-if |
| WhatIfTeam | `bronTeamId` | Terugvinden welke what-ifs een team raken |
| WhatIfTeamSpeler | `whatIfTeamId` | Spelers per what-if team |
| WhatIfTeamSpeler | `spelerId` | Waar zit een speler in what-ifs? |
| WhatIfTeamStaf | `whatIfTeamId` | Staf per what-if team |
| Werkitem | `whatIfId` | Acties per what-if |
| Scenario | partial unique `idx_scenario_werkindeling_per_blauwdruk` | Max 1 werkindeling per concept |

### 1.9 Prisma client wrapper

De `AnyPrismaClient` type in `src/lib/teamindeling/db/prisma.ts` moet uitgebreid worden met:

```typescript
type AnyPrismaModels = {
  // ... bestaand ...
  whatIf: AnyModel;
  whatIfTeam: AnyModel;
  whatIfTeamSpeler: AnyModel;
  whatIfTeamStaf: AnyModel;
};
```

---

## 2. Migratiestrategie

### 2.1 Migratiestappen

De migratie bestaat uit twee delen:

**Deel A: Schema-migratie (Prisma)**
```bash
pnpm db:migrate -- --name add_werkindeling_and_whatif
```

Dit genereert een migratie met:
1. Toevoegen `isWerkindeling Boolean DEFAULT false` aan `Scenario`
2. Toevoegen `whatIfId` (nullable) aan `Werkitem`
3. Aanmaken tabellen: `what_ifs`, `what_if_teams`, `what_if_team_spelers`, `what_if_team_staf`
4. Aanmaken indexes en foreign keys

**Deel B: Data-migratie (SQL in dezelfde migratie)**

Na de DDL voegen we een data-migratie toe aan het gegenereerde SQL-bestand:

```sql
-- Per blauwdruk: promoveer het meest recente DEFINITIEF of ACTIEF scenario
-- tot werkindeling
WITH ranked AS (
  SELECT
    s.id,
    s."conceptId",
    c."blauwdrukId",
    s.status,
    s."createdAt",
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
```

Vervolgens de partial unique index:

```sql
CREATE UNIQUE INDEX "idx_scenario_werkindeling_per_blauwdruk"
ON "Scenario" ("conceptId")
WHERE "isWerkindeling" = true;
```

### 2.2 Welk scenario wordt werkindeling?

**Logica** (in volgorde):
1. Als er een scenario met status `DEFINITIEF` is -> dat wordt de werkindeling
2. Als er geen definitief scenario is: het meest recente `ACTIEF` scenario -> werkindeling
3. Als er helemaal geen actief scenario is: geen werkindeling (de TC moet er een aanmaken)

**Bestaande scenario's**: alle scenario's die NIET de werkindeling worden behouden hun status ongewijzigd. Ze zijn raadpleegbaar via het archief/overzicht maar de UI focust op de werkindeling.

### 2.3 Wat gebeurt er met bestaande scenario's?

- Alle bestaande data (Scenario, Versie, Team, TeamSpeler, etc.) blijft **volledig intact**
- De migratie is **additief**: nieuwe tabellen + 1 nieuwe kolom op Scenario + 1 nieuwe kolom op Werkitem
- Geen bestaande kolommen worden verwijderd of hernoemd
- De enige data-mutatie is het zetten van `isWerkindeling = true` op max 1 scenario per blauwdruk

### 2.4 Is de migratie reversibel?

**Ja, volledig**. Rollback-SQL:

```sql
-- Stap 1: Zet alle werkindeling-vlaggen terug
UPDATE "Scenario" SET "isWerkindeling" = false;

-- Stap 2: Drop nieuwe tabellen (cascade verwijdert alle data)
DROP TABLE IF EXISTS "what_if_team_staf" CASCADE;
DROP TABLE IF EXISTS "what_if_team_spelers" CASCADE;
DROP TABLE IF EXISTS "what_if_teams" CASCADE;
DROP TABLE IF EXISTS "what_ifs" CASCADE;

-- Stap 3: Drop nieuwe kolommen
ALTER TABLE "Scenario" DROP COLUMN IF EXISTS "isWerkindeling";
ALTER TABLE "Werkitem" DROP COLUMN IF EXISTS "whatIfId";

-- Stap 4: Drop index
DROP INDEX IF EXISTS "idx_scenario_werkindeling_per_blauwdruk";
```

Geen bestaande data gaat verloren bij rollback.

---

## 3. Server actions architectuur

### 3.1 Nieuwe bestanden

```
apps/web/src/app/(teamindeling-studio)/ti-studio/
  werkindeling/
    actions.ts              # Werkindeling CRUD + what-if CRUD
    page.tsx                # Werkindeling startscherm (vervangt scenario-lijst)
  scenarios/
    actions.ts              # Behouden voor legacy scenario-operaties
    wizard-actions.ts       # Uitgebreid: "start werkindeling" optie

apps/web/src/lib/teamindeling/db/
    werkindeling-guard.ts   # assertGeenWerkindeling, assertIsWerkindeling
    whatif-snapshot.ts       # Kopieer teams naar what-if, merge terug
```

### 3.2 Werkindeling actions

**`werkindeling/actions.ts`** -- nieuwe server actions:

```typescript
// === Werkindeling ophalen ===

/** Haal de werkindeling op voor het actieve seizoen */
export async function getWerkindeling(blauwdrukId: string)

/** Promoveer een bestaand scenario tot werkindeling */
export async function promoveerTotWerkindeling(scenarioId: string)

// === What-if CRUD ===

/** Maak een nieuwe what-if aan op basis van geselecteerde teams */
export async function createWhatIf(
  werkindelingId: string,
  data: { vraag: string; toelichting?: string; teamIds: string[] }
): Promise<{ id: string }>

/** Haal een what-if op met teams en spelers */
export async function getWhatIf(whatIfId: string)

/** Haal alle what-ifs op voor een werkindeling */
export async function getWhatIfs(werkindelingId: string)

/** Werk de vraag/toelichting van een what-if bij */
export async function updateWhatIf(
  whatIfId: string,
  data: { vraag?: string; toelichting?: string }
)

// === What-if team bewerkingen ===

/** Voeg een speler toe aan een what-if team */
export async function addSpelerToWhatIfTeam(whatIfTeamId: string, spelerId: string)

/** Verwijder een speler uit een what-if team */
export async function removeSpelerFromWhatIfTeam(whatIfTeamId: string, spelerId: string)

/** Verplaats een speler tussen what-if teams */
export async function moveSpelerInWhatIf(
  spelerId: string,
  vanWhatIfTeamId: string,
  naarWhatIfTeamId: string
)

/** Voeg een extra team toe aan de what-if (uit werkindeling of nieuw) */
export async function addTeamToWhatIf(
  whatIfId: string,
  data: { bronTeamId?: string } | { naam: string; categorie: TeamCategorie; kleur?: Kleur }
)

// === What-if afsluiten ===

/** Pas what-if toe op werkindeling */
export async function pasWhatIfToe(
  whatIfId: string,
  toelichtingAfwijking?: string
): Promise<void>

/** Verwerp een what-if */
export async function verwerpWhatIf(whatIfId: string): Promise<void>
```

### 3.3 Hoe werkt "toepassen" (merge) technisch?

`pasWhatIfToe()` voert de volgende stappen uit in een **enkele `$transaction`**:

```
1. VALIDATIE
   a. Laad de what-if met alle teams + spelers
   b. Laad de werkindeling met huidige versie + teams
   c. Controleer of basisVersieNummer == huidige versie (stale check)
   d. Draai validatie op de samengevoegde staat (harde fouten -> throw)
   e. Check pins (fase 4, voorbereid met skip in fase 2)

2. SNAPSHOT
   a. Maak een ScenarioSnapshot van de huidige werkindeling (undo-punt)
   b. Maak een nieuwe Versie aan op de werkindeling (nummer + 1)

3. KOPIEER bestaande teams naar nieuwe versie
   a. Voor elk team in de huidige versie:
      - Als het team een bronTeam is van een WhatIfTeam: skip (wordt overschreven)
      - Anders: kopieer team + spelers + staf naar nieuwe versie ongewijzigd

4. MERGE what-if teams
   a. Voor elk WhatIfTeam:
      - Als bronTeamId != null: maak Team aan met data uit WhatIfTeam
        (naam, categorie, kleur, etc.) + kopieer WhatIfTeamSpeler -> TeamSpeler
      - Als bronTeamId == null: maak nieuw Team aan + spelers/staf

5. SELECTIEGROEPEN
   a. Kopieer selectiegroepen die niet geraakt zijn
   b. Als een team in een selectiegroep zat en in de what-if zit:
      herbereken de selectiegroep-spelers

6. AFRONDING
   a. Zet WhatIf.status = TOEGEPAST, WhatIf.toegepastOp = now()
   b. Als toelichtingAfwijking: maak BlauwdrukBesluit aan
   c. Revalidate paden
```

**Waarom een nieuwe Versie?** Dit maakt undo mogelijk: de vorige Versie bevat de werkindeling voor de merge. Het sluit aan bij het bestaande snapshot-mechanisme.

### 3.4 Hoe werkt "automatisch meenemen" van teams?

In fase 2 is dit een **handmatige actie** via `addTeamToWhatIf()`. De TC selecteert welke teams ze aan de what-if willen toevoegen.

De voorbereiding voor fase 3 (automatisch) zit in de data-structuur: wanneer een speler uit een impact-team naar een actief team wordt verplaatst, detecteert de frontend dat het bronteam niet in de what-if zit en toont een prompt: "Team X wordt automatisch meegenomen."

Fase 3 voegt een server action toe:

```typescript
/** Detecteer impact-teams en neem ze automatisch mee */
export async function neemImpactTeamMee(whatIfId: string, spelerId: string)
```

### 3.5 Impact-berekening (delta's)

In fase 2 worden delta's **client-side** berekend op basis van de data die al beschikbaar is:

```typescript
// In src/lib/teamindeling/whatif/delta.ts

interface TeamDelta {
  teamId: string;
  teamNaam: string;
  huidigAantal: number;
  nieuwAantal: number;
  verschil: number;
  status: 'gewijzigd' | 'nieuw' | 'ongewijzigd';
  spelersToegevoegd: string[];
  spelersVerwijderd: string[];
}

export function berekenWhatIfDelta(
  werkindelingTeams: TeamData[],
  whatIfTeams: WhatIfTeamData[]
): TeamDelta[]
```

Dit is lightweight omdat:
- De werkindeling-data al beschikbaar is (geladen door de pagina)
- De what-if teams een subset zijn (alleen gewijzigde teams)
- De berekening puur op speler-IDs werkt (set-operaties)

### 3.6 Hergebruik van bestaande scenario-actions

De bestaande actions in `scenarios/actions.ts` worden **niet gewijzigd** maar **niet hergebruikt** voor what-if operaties. Reden:

1. Scenario-actions werken op `Team`/`TeamSpeler` modellen
2. What-if actions werken op `WhatIfTeam`/`WhatIfTeamSpeler` modellen
3. De guards zijn anders (scenario -> assertScenarioBewerkbaar, what-if -> assertWhatIfBewerkbaar)

Maar de **business logic** wordt gedeeld via helper-functies in `src/lib/teamindeling/db/`:

```typescript
// Gedeeld: speler-guard logica werkt op zowel versie als what-if context
export async function assertSpelerVrijInWhatIf(
  whatIfId: string,
  spelerId: string
): Promise<void>
```

De wizard-action `createScenarioVanuitBlauwdruk` krijgt een nieuw pad dat direct `isWerkindeling: true` zet:

```typescript
export async function createWerkindelingVanuitBlauwdruk(
  blauwdrukId: string,
  naam: string,
  aantalSenioren: number,
  aCatTeams: ACatConfig[],
  bTeamOverrides?: Record<string, number>
)
```

---

## 4. Bestandsstructuur

### 4.1 Nieuwe bestanden

```
apps/web/src/lib/teamindeling/
  db/
    werkindeling-guard.ts     # Guards: assertGeenWerkindeling, assertIsWerkindeling,
                               #         assertWhatIfBewerkbaar, assertWhatIfOpen
    whatif-snapshot.ts         # kopieerTeamsNaarWhatIf(), mergeWhatIfNaarWerkindeling()
  whatif/
    delta.ts                   # berekenWhatIfDelta() - client-side delta berekening
    types.ts                   # WhatIfData, WhatIfTeamData, WhatIfTeamSpelerData, TeamDelta

apps/web/src/app/(teamindeling-studio)/ti-studio/
  werkindeling/
    actions.ts                 # Server actions voor werkindeling + what-if CRUD
    page.tsx                   # Werkindeling startscherm (PLACEHOLDER - UX ontwerpt)

apps/web/src/components/teamindeling/
  whatif/
    types.ts                   # Frontend-specifieke what-if types
```

### 4.2 Aangepaste bestaande bestanden

| Bestand | Wijziging |
|---|---|
| `packages/database/prisma/schema.prisma` | Nieuwe modellen + isWerkindeling veld |
| `src/lib/teamindeling/db/prisma.ts` | AnyPrismaModels uitbreiden met whatIf, whatIfTeam, etc. |
| `ti-studio/scenarios/wizard-actions.ts` | Nieuw: `createWerkindelingVanuitBlauwdruk()` |
| `ti-studio/scenarios/page.tsx` | Redirect naar werkindeling als die bestaat |
| `ti-studio/page.tsx` | Dashboard: link naar werkindeling i.p.v. scenario-lijst |
| `src/components/teamindeling/scenario/types.ts` | Export WhatIf-gerelateerde types |

### 4.3 Gedeelde data-laag (mobile + studio)

De what-if data wordt beschikbaar via de gedeelde lib-laag:

```
src/lib/teamindeling/
  whatif/
    delta.ts          # Gebruikt door zowel studio als mobile
    types.ts          # Gedeelde types

src/app/(teamindeling-studio)/ti-studio/werkindeling/
    actions.ts        # Studio: volledige CRUD

src/app/(teamindeling)/teamindeling/
    (hergebruikt getWhatIfs() en getWhatIf() uit studio actions via import)
```

Mobile importeert de read-actions uit studio. Dit werkt omdat server actions gewoon functies zijn die vanuit elke server component aangeroepen kunnen worden. De write-actions (create, update, merge) worden niet geimporteerd in mobile (conform design: "geen bewerking van what-ifs op mobile").

---

## 5. Validatie-uitbreiding

### 5.1 Huidige structuur

Het validatiesysteem in `lib/teamindeling/validatie/` werkt al met:
- `valideerTeam(team, seizoenJaar, overrides?, kaders?)` -> `TeamValidatie`
- Harde regels (ROOD): teamgrootte, bandbreedte, leeftijd
- Zachte regels (ORANJE): gender, duplicaten
- Cross-team: `valideerDubbeleSpelersOverTeams(teams[])`

### 5.2 What-if validatie (fase 2, basis)

In fase 2 hergebruiken we het bestaande systeem direct:

```typescript
// src/lib/teamindeling/whatif/validatie.ts

import { valideerTeam, valideerDubbeleSpelersOverTeams } from '../validatie/regels';

/**
 * Valideer een what-if: controleer alle what-if teams plus
 * de samengevoegde staat met ongewijzigde werkindeling-teams.
 */
export function valideerWhatIf(
  whatIfTeams: TeamData[],
  werkindelingTeams: TeamData[],
  seizoenJaar: number,
  kaders?: BlauwdrukKaders
): WhatIfValidatie {
  const resultaten: Map<string, TeamValidatie> = new Map();

  // 1. Valideer elk what-if team individueel
  for (const team of whatIfTeams) {
    resultaten.set(team.naam, valideerTeam(team, seizoenJaar, undefined, kaders));
  }

  // 2. Bouw de samengevoegde teamlijst:
  //    - What-if teams vervangen hun bronteams
  //    - Niet-geraakte werkindeling-teams blijven
  const samengevoegd = mergeTeamlijsten(whatIfTeams, werkindelingTeams);

  // 3. Cross-team check op de samengevoegde lijst
  const crossTeamMeldingen = valideerDubbeleSpelersOverTeams(samengevoegd);

  return { resultaten, crossTeamMeldingen };
}
```

Het bestaande `valideerTeam()` werkt out-of-the-box op what-if teams omdat het puur op `TeamData` (naam, categorie, kleur, spelers) werkt -- onafhankelijk van de bron (Team of WhatIfTeam).

### 5.3 Pin-validatie (voorbereiding fase 4)

In fase 2 wordt pin-validatie **voorbereid maar niet geactiveerd**:

```typescript
// src/lib/teamindeling/whatif/pin-validatie.ts

/**
 * Controleer of pins geschonden worden in een what-if.
 * Retourneert lijst van geschonden pins.
 */
export function valideerPinsInWhatIf(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: TeamData[],
  pins: PinData[]
): PinSchending[] {
  const schendingen: PinSchending[] = [];

  for (const pin of pins) {
    if (pin.type === 'SPELER_POSITIE') {
      // Check of de speler nog steeds in het juiste team zit
      const doelTeamNaam = (pin.waarde as { teamNaam: string }).teamNaam;
      const gevonden = vindSpelerInSamengevoegdeTeams(
        pin.spelerId!, whatIfTeams, werkindelingTeams
      );
      if (gevonden && gevonden !== doelTeamNaam) {
        schendingen.push({
          pin,
          huidigTeam: gevonden,
          verwachtTeam: doelTeamNaam,
          ernst: 'kritiek', // Pin-schendingen zijn altijd hard
        });
      }
    }
  }

  return schendingen;
}
```

### 5.4 Blauwdruk-kader-validatie (voorbereiding fase 4)

Nieuw in fase 2 -- aantalcheck per categorie:

```typescript
/**
 * Check of de what-if het aantal teams per categorie wijzigt
 * t.o.v. de blauwdruk-kaders.
 */
export function valideerBlauwdrukKadersWhatIf(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: TeamData[],
  kaders: BlauwdrukKaders
): ValidatieMelding[] {
  // Tel teams per categorie in samengevoegde staat
  // Vergelijk met blauwdruk-kaders
  // Retourneer afwijkingen (ernst: 'aandacht', niet 'kritiek')
}
```

### 5.5 Delta-validatie (vergelijk what-if met werkindeling)

```typescript
// In src/lib/teamindeling/whatif/delta.ts

interface TeamDelta {
  teamNaam: string;
  bronTeamId: string | null;
  huidigAantal: number;
  nieuwAantal: number;
  verschil: number;
  isNieuw: boolean;
  spelersIn: string[];     // speler-IDs toegevoegd
  spelersUit: string[];    // speler-IDs verwijderd
  stafIn: string[];
  stafUit: string[];
}

/**
 * Bereken de exacte delta's tussen what-if en werkindeling.
 * Dit is de basis voor het impact-panel.
 */
export function berekenDelta(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: TeamData[]
): TeamDelta[]
```

---

## 6. Edge cases en risico's

### 6.1 Stale basis: werkindeling wijzigt terwijl what-if open staat

**Probleem**: TC-lid A past de werkindeling aan, TC-lid B heeft een what-if open die op de vorige versie gebaseerd is.

**Detectie**: vergelijk `whatIf.basisVersieNummer` met de huidige `versie.nummer` van de werkindeling. Als deze afwijken, is de what-if "stale".

**Oplossing (fase 2)**:
1. Bij het openen van een what-if: check of de basis nog actueel is
2. Als stale: toon waarschuwing "De werkindeling is gewijzigd sinds deze what-if is aangemaakt"
3. De TC kan de what-if verwerpen en opnieuw aanmaken, of bewust doorgaan
4. Bij "toepassen" van een stale what-if: blokkeren met foutmelding

**Latere verbetering (fase 3+)**: automatische rebase -- de what-if delta's opnieuw toepassen op de nieuwste versie.

### 6.2 Overlappende what-ifs (twee what-ifs raken dezelfde teams)

**Probleem**: What-if A verplaatst Klaas van Senioren 1 naar 2. What-if B verplaatst Klaas van Senioren 1 naar 3.

**Oplossing (fase 2)**: what-ifs zijn onafhankelijk. Beide kunnen bestaan. Maar:
- Alleen 1 what-if tegelijk actief in de editor (design spec: "een what-if tegelijk")
- Bij "toepassen" van A: de werkindeling verandert, B wordt stale (6.1)
- De stale-check blokkeert het toepassen van B

**Geen automatische conflict-detectie in fase 2**: de TC handelt dit af via het stale-mechanisme.

### 6.3 What-if toegepast, andere what-if wordt invalid

**Scenario**: What-if A voegt een 3e senioren team toe. What-if B verplaatst een speler die nu in dat 3e team zit.

**Mechanisme**: na toepassen van A wordt de werkindeling-versie opgehoogd. What-if B is nu stale (6.1). Bij openen van B ziet de TC de waarschuwing en kan de what-if opnieuw evalueren.

### 6.4 Performance bij veel teams

**Risico**: impact-berekening wordt traag bij veel teams.

**Mitigatie**:
1. Delta-berekening is client-side en werkt op in-memory data (geen database roundtrips)
2. What-ifs bevatten alleen de gewijzigde teams (niet alle 20+ teams)
3. Validatie draait per team, niet over het hele scenario tegelijk
4. De `berekenDelta()` functie werkt met set-operaties op speler-IDs: O(n) waar n = aantal spelers in de what-if teams

**Gemeten baseline**: het huidige `valideerTeam()` draait in <1ms per team. Met 20 teams is volledige validatie <20ms. What-ifs met typisch 2-5 teams zijn verwaarloosbaar.

### 6.5 Selectiegroep-complicatie

**Probleem**: als een team in een selectiegroep zit (bijv. Senioren 1+2 delen een spelerpoort), hoe werkt dat in een what-if?

**Oplossing fase 2**: bij het kopiëren van een team dat in een selectiegroep zit:
1. De what-if kopieert de spelers uit de selectiegroep als individuele WhatIfTeamSpeler-records
2. Bij toepassen: als alle teams van een selectiegroep in de what-if zitten, wordt de selectiegroep gereconstrueerd
3. Als slechts 1 team van een selectiegroep in de what-if zit: de TC krijgt een waarschuwing dat de selectie doorbroken wordt

### 6.6 Concurrent edits

**Probleem**: twee TC-leden bewerken dezelfde what-if tegelijk.

**Oplossing fase 2**: geen optimistic concurrency in deze fase. De `updatedAt` timestamp dient als last-write-wins indicator. In de praktijk werkt maar 1 TC-lid tegelijk aan een specifieke what-if (er zijn maar 3 TC-leden).

---

## 7. Implementatieplan

### Fase 1: Werkindeling (geschat: 4-6 uur)

| Stap | Wat | Bestanden |
|---|---|---|
| 1.1 | Prisma schema: `isWerkindeling` op Scenario | `schema.prisma` |
| 1.2 | Migratie genereren + data-migratie SQL toevoegen | `migrations/` |
| 1.3 | `werkindeling-guard.ts` met assert-functies | `lib/teamindeling/db/` |
| 1.4 | `getWerkindeling()` en `promoveerTotWerkindeling()` actions | `werkindeling/actions.ts` |
| 1.5 | `createWerkindelingVanuitBlauwdruk()` in wizard | `wizard-actions.ts` |
| 1.6 | Werkindeling placeholder pagina | `werkindeling/page.tsx` |
| 1.7 | Redirect scenario-lijst naar werkindeling als die bestaat | `scenarios/page.tsx` |
| 1.8 | Prisma client wrapper uitbreiden | `db/prisma.ts` |

### Fase 2: What-if basis (geschat: 8-12 uur)

| Stap | Wat | Bestanden |
|---|---|---|
| 2.1 | Prisma schema: WhatIf + WhatIfTeam + WhatIfTeamSpeler + WhatIfTeamStaf + Werkitem.whatIfId | `schema.prisma` |
| 2.2 | Migratie genereren | `migrations/` |
| 2.3 | `whatif-snapshot.ts` (kopieer + merge logica) | `lib/teamindeling/db/` |
| 2.4 | What-if CRUD actions | `werkindeling/actions.ts` |
| 2.5 | What-if team-bewerkingen (add/remove/move speler) | `werkindeling/actions.ts` |
| 2.6 | What-if afsluiten (toepassen/verwerpen) | `werkindeling/actions.ts` |
| 2.7 | Delta-berekening | `lib/teamindeling/whatif/delta.ts` |
| 2.8 | What-if types | `lib/teamindeling/whatif/types.ts` |
| 2.9 | Basis what-if validatie | `lib/teamindeling/whatif/validatie.ts` |
| 2.10 | Speler-guard uitbreiding | `lib/teamindeling/db/speler-guard.ts` |

---

## 8. Type-contracten voor frontend (handshake)

De frontend/UX-designer kan de volgende types gebruiken voor component-planning:

### 8.1 Data types

```typescript
// Werkindeling data (geladen door page.tsx)
interface WerkindelingData {
  scenario: ScenarioData;          // Bestaand type, met isWerkindeling: true
  whatIfs: WhatIfSummary[];        // Samenvatting per what-if
}

// What-if samenvatting (voor zijbalk)
interface WhatIfSummary {
  id: string;
  vraag: string;
  status: WhatIfStatus;
  aantalTeams: number;
  aantalGewijzigdeSpelers: number;
  isStale: boolean;                // basisVersie != huidige versie
  createdAt: string;
}

// What-if detail (voor editor)
interface WhatIfDetailData {
  id: string;
  vraag: string;
  toelichting: string | null;
  status: WhatIfStatus;
  basisVersieNummer: number;
  isStale: boolean;
  teams: WhatIfTeamData[];
  deltas: TeamDelta[];             // Berekende verschillen
}

// What-if team (voor editor)
interface WhatIfTeamData {
  id: string;
  bronTeamId: string | null;
  naam: string;
  categorie: TeamCategorie;
  kleur: Kleur | null;
  teamType: TeamType | null;
  volgorde: number;
  spelers: WhatIfTeamSpelerData[];
  staf: WhatIfTeamStafData[];
}

// Speler in what-if team
interface WhatIfTeamSpelerData {
  id: string;
  spelerId: string;
  statusOverride: SpelerStatus | null;
  notitie: string | null;
  speler: SpelerData;              // Hergebruik bestaand SpelerData type
}

// Delta per team
interface TeamDelta {
  teamNaam: string;
  bronTeamId: string | null;
  huidigAantal: number;
  nieuwAantal: number;
  verschil: number;
  isNieuw: boolean;
  spelersIn: SpelerData[];
  spelersUit: SpelerData[];
}
```

### 8.2 Action signatures (voor component-integratie)

```typescript
// What-if starten (vanuit teamselectie)
createWhatIf(werkindelingId, { vraag, teamIds }) -> { id: string }

// Speler verplaatsen in what-if (drag & drop)
moveSpelerInWhatIf(spelerId, vanWhatIfTeamId, naarWhatIfTeamId) -> void

// Team toevoegen aan what-if
addTeamToWhatIf(whatIfId, { bronTeamId } | { naam, categorie, kleur }) -> void

// What-if toepassen (merge naar werkindeling)
pasWhatIfToe(whatIfId, toelichtingAfwijking?) -> void

// What-if verwerpen
verwerpWhatIf(whatIfId) -> void
```

---

## 9. Risico-matrix

| Risico | Kans | Impact | Mitigatie |
|---|---|---|---|
| Selectiegroep-complicatie bij merge | Middel | Hoog | Fase 2: waarschuwing bij gedeeltelijke selectie in what-if |
| Stale what-if na werkindeling-wijziging | Hoog | Middel | Blokkeer toepassen, toon waarschuwing |
| Performance delta-berekening | Laag | Laag | Client-side, set-operaties, <20ms verwacht |
| Concurrent edits op dezelfde what-if | Laag | Laag | 3 TC-leden, last-write-wins in fase 2 |
| Migratie-risico (bestaande data) | Laag | Hoog | Additieve migratie, volledig reversibel |
| Prisma client wrapper uitbreiding | Laag | Middel | Bestaand patroon, copy-paste |
