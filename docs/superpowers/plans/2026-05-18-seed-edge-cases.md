# Seed Edge-Case Test-Data Implementation Plan

> **Voor agentic workers:** REQUIRED SUB-SKILL: Gebruik `superpowers:subagent-driven-development` (aanbevolen) of `superpowers:executing-plans` om dit plan taak-voor-taak uit te voeren. Stappen gebruiken checkbox (`- [ ]`) syntax voor tracking.

**Goal:** `oranjewit-test` database in een volledig synthetische, reproduceerbare ideale state krijgen via `scripts/seed-edge-cases.ts`, die elke E2E workflow-run vooraf draait. Alle 6 v2-specs harderen naar harde assertions op `9900xxxxxxxx`-fixtures uit de catalogus.

**Architecture:** Wipe-and-seed-script in `scripts/` (TypeScript via tsx, Prisma client). Workflow-step toevoegen vóór Playwright. Specs verwijzen vervolgens naar exacte `rel_code`-waarden uit `docs/kennis/edge-case-testdata.md`. Geen graceful skips meer.

**Tech Stack:** Prisma 7.x · TypeScript strict · tsx · @oranje-wit/database client · pnpm workspace · GitHub Actions

**Referenties:**
- Catalogus (bron-van-waarheid): [docs/kennis/edge-case-testdata.md](docs/kennis/edge-case-testdata.md)
- Prisma schema: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
- Kennisdoc E2E: [docs/kennis/e2e-testen-tegen-studio-test.md](docs/kennis/e2e-testen-tegen-studio-test.md)
- Skill: [.claude/skills/e2e-studio-test/SKILL.md](.claude/skills/e2e-studio-test/SKILL.md)
- Bestaande herstelscripts (referentie qua Prisma-patterns): [scripts/herstel/](scripts/herstel/)

---

## File Structure

| Bestand | Aard | Doel |
|---|---|---|
| `scripts/seed-edge-cases.ts` | Nieuw | Wipe + reseed orchestrator (entrypoint) |
| `scripts/seed/seed-teams.ts` | Nieuw | Sectie 0: 25 teams + 23 standaard + 2 edge |
| `scripts/seed/seed-default-spelers.ts` | Nieuw | Default vulling per team (~150 spelers) |
| `scripts/seed/seed-status-edge.ts` | Nieuw | Sectie 1.3: 10 fixtures per `SpelerStatus` |
| `scripts/seed/seed-leeftijd-edge.ts` | Nieuw | Sectie 1.4: 8 leeftijdsgrens-fixtures |
| `scripts/seed/seed-data-incomplete.ts` | Nieuw | Sectie 1.5: 3 incomplete-fixtures |
| `scripts/seed/seed-multi-team.ts` | Nieuw | Sectie 1.6: 2 illegal-state-fixtures |
| `scripts/seed/seed-whatif.ts` | Nieuw | Sectie 1.7: 2 what-if versies |
| `scripts/seed/wipe.ts` | Nieuw | Truncate alle test-data tabellen (volgorde respecterend FK) |
| `scripts/seed/types.ts` | Nieuw | Gedeelde TS types + constanten (rel_code-bereik, peildatum) |
| `e2e/ti-studio-v2/*.spec.ts` (6×) | Modify | Skip → expect op fixtures |
| `.github/workflows/e2e-studio-test.yml` | Modify | Seed-step vóór Playwright |
| `packages/database/package.json` | Modify | Optioneel: `seed-edge` script-alias |
| `docs/kennis/edge-case-testdata.md` | Read-only | Catalogus blijft single source of truth |

**Splitsing-rationale:** elke catalog-sectie krijgt zijn eigen `.ts` bestand zodat (a) toekomstige scenario-uitbreidingen in 1 file landen, en (b) elke functie afzonderlijk testbaar is.

---

## Aannames (BEVESTIGEN VOOR START)

1. **`oranjewit-test` mag volledig leeg** voordat seed draait. Geen externe systemen consumeren live deze DB (alleen `studio-test.ckvoranjewit.app` en E2E-runs).
2. **Schema is up-to-date** op test-DB. Migratie `agent_mutaties_toevoegen` is via directe SQL toegepast (memory: test-DB migration-history-sync issue, blijft open).
3. **Seed-run-duur**: kan tot 30s nemen — moet binnen GitHub-job timeout passen. Voor 175 spelers + 25 teams + relaties verwacht <15s.
4. **Geen Sportlink-sync** tijdens seed — Sportlink loopt apart en mag test-DB niet automatisch refreshen.
5. **AgentMutatie-tabel** behouden tussen seed-runs? **Ja** — wipen verwijdert ook AgentMutatie-historie (geen zin om die te bewaren want test-state is verse).
6. **Seizoenen** worden door seed aangemaakt (`2026-2027` ACTIEF, `2027-2028` VOORBEREIDING) of bestaan al — seed upsert beide.

---

## Task 1: Wipe-helper schrijven

**Files:**
- Create: `scripts/seed/wipe.ts`
- Create: `scripts/seed/types.ts`

**Probleem:** Idempotency vereist dat we vóór seed alle relevante tabellen leegmaken. Volgorde: kindrecords → ouderrecords (FK-constraints).

- [ ] **Stap 1.1: Schrijf `scripts/seed/types.ts`**

```typescript
import { PrismaClient } from "@oranje-wit/database";

export const prisma = new PrismaClient();

export const REL_CODE_PREFIX = "9900";
export const TEAM_ID_PREFIX = "team-edge";
export const PEILDATUM_2026_2027 = new Date("2027-01-01"); // KNKV peildatum 1 januari

export function relCode(teamNr: number, volgnr: number): string {
  return `${REL_CODE_PREFIX}${String(teamNr).padStart(4, "0")}${String(volgnr).padStart(4, "0")}`;
}

export function teamId(nr: number): string {
  return `${TEAM_ID_PREFIX}-${String(nr).padStart(2, "0")}`;
}
```

- [ ] **Stap 1.2: Schrijf `scripts/seed/wipe.ts`**

```typescript
import { prisma } from "./types";
import { logger } from "@oranje-wit/types";

/**
 * Verwijdert ALLE test-data uit oranjewit-test in FK-veilige volgorde.
 * NOOIT tegen productie-DB draaien — script controleert URL.
 */
export async function wipeAll(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("oranjewit-test") && !url.includes("test")) {
    throw new Error(`wipe: DATABASE_URL bevat geen 'test' — geweigerd: ${url.replace(/:[^@]+@/, ":***@")}`);
  }

  logger.info("[wipe] starten — kindrecords eerst");

  // Volgorde: meest specifieke kinderen eerst
  await prisma.agentMutatie.deleteMany({});
  await prisma.teamSpeler.deleteMany({});
  await prisma.teamStaf.deleteMany({});
  await prisma.stafToewijzing.deleteMany({});
  await prisma.reserveringsspeler.deleteMany({});
  await prisma.spelerZelfEvaluatie.deleteMany({});
  await prisma.kadersSpeler.deleteMany({});
  await prisma.kadersBesluit.deleteMany({});
  await prisma.werkitem.deleteMany({});
  await prisma.actiepunt.deleteMany({});
  await prisma.activiteit.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.versie.deleteMany({});
  await prisma.werkindelingSnapshot.deleteMany({});
  await prisma.werkindeling.deleteMany({});
  await prisma.kaders.deleteMany({});
  await prisma.speler.deleteMany({});
  await prisma.staf.deleteMany({});
  await prisma.lidFoto.deleteMany({});
  await prisma.lid.deleteMany({});

  logger.info("[wipe] klaar");
}
```

- [ ] **Stap 1.3: Verifieer FK-volgorde**

Run handmatig in een lokale Prisma Studio of via:
```bash
DATABASE_URL=<test-db-url> pnpm tsx -e "import { wipeAll } from './scripts/seed/wipe'; wipeAll().then(() => console.log('OK')).catch(console.error)"
```
Verwacht: geen FK-violation errors. Bij issues: voeg ontbrekende tabel toe boven het juiste niveau.

- [ ] **Stap 1.4: Commit**

```bash
git add scripts/seed/wipe.ts scripts/seed/types.ts
git commit -m "patch: seed-edge-cases — wipe-helper + types"
```

---

## Task 2: Teams seeden (sectie 0)

**Files:**
- Create: `scripts/seed/seed-teams.ts`

- [ ] **Stap 2.1: Schrijf de 25 team-definities als data**

```typescript
import type { OWTeamType, TeamCategorie, Kleur, TeamType } from "@oranje-wit/database";
import { prisma, teamId } from "./types";
import { logger } from "@oranje-wit/types";

interface TeamDef {
  nr: number;
  naam: string;
  alias: string | null;
  owTeamType: OWTeamType;
  categorie: TeamCategorie;
  kleur: Kleur | null;
  teamType: TeamType;
  defaultOmvang: number; // aantal spelers in default vulling
  scenarioNote: string;
}

export const TEAM_DEFS: TeamDef[] = [
  { nr: 1, naam: "Senioren 1", alias: "S1", owTeamType: "SENIOREN", categorie: "SENIOREN", kleur: null, teamType: "ACHTTAL", defaultOmvang: 10, scenarioNote: "Standaard vol team" },
  { nr: 2, naam: "Senioren 2", alias: "S2", owTeamType: "SENIOREN", categorie: "SENIOREN", kleur: null, teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "Net-aan" },
  { nr: 3, naam: "Senioren 3 (A)", alias: "S3", owTeamType: "SENIOREN", categorie: "A_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 10, scenarioNote: "Wedstrijdsport" },
  { nr: 4, naam: "Senioren 4 (B)", alias: "S4", owTeamType: "SENIOREN", categorie: "B_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 9, scenarioNote: "Korfbalplezier" },
  { nr: 5, naam: "Recreanten", alias: "RC", owTeamType: "OVERIG", categorie: "B_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "RECREANT-status spelers" },
  { nr: 6, naam: "Midweek 1", alias: "MW1", owTeamType: "OVERIG", categorie: "B_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "OVERIG type" },
  { nr: 7, naam: "U19-1", alias: "U19-1", owTeamType: "SELECTIE", categorie: "A_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 10, scenarioNote: "TOP jeugd" },
  { nr: 8, naam: "U19-2", alias: "U19-2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 9, scenarioNote: "Standaard jeugd" },
  { nr: 9, naam: "U17-1", alias: "U17-1", owTeamType: "SELECTIE", categorie: "A_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 10, scenarioNote: "TOP jeugd" },
  { nr: 10, naam: "U17-2", alias: "U17-2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "Standaard jeugd" },
  { nr: 11, naam: "U15-1", alias: "U15-1", owTeamType: "SELECTIE", categorie: "A_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 10, scenarioNote: "TOP jeugd" },
  { nr: 12, naam: "U15-2", alias: "U15-2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: null, teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "Standaard jeugd" },
  { nr: 13, naam: "Rood-1", alias: "R1", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "ROOD", teamType: "ACHTTAL", defaultOmvang: 9, scenarioNote: "Korfbalplezier" },
  { nr: 14, naam: "Rood-2", alias: "R2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "ROOD", teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "Standaard jeugd" },
  { nr: 15, naam: "Oranje-1", alias: "O1", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "ORANJE", teamType: "ACHTTAL", defaultOmvang: 9, scenarioNote: "Ontwikkelhart" },
  { nr: 16, naam: "Oranje-2", alias: "O2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "ORANJE", teamType: "ACHTTAL", defaultOmvang: 9, scenarioNote: "Standaard jeugd" },
  { nr: 17, naam: "Geel-1", alias: "G1", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "GEEL", teamType: "ACHTTAL", defaultOmvang: 9, scenarioNote: "Ontwikkelhart" },
  { nr: 18, naam: "Geel-2", alias: "G2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "GEEL", teamType: "ACHTTAL", defaultOmvang: 8, scenarioNote: "Standaard jeugd" },
  { nr: 19, naam: "Groen-1", alias: "Gr1", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "GROEN", teamType: "VIERTAL", defaultOmvang: 6, scenarioNote: "Kweekvijver" },
  { nr: 20, naam: "Groen-2", alias: "Gr2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "GROEN", teamType: "VIERTAL", defaultOmvang: 5, scenarioNote: "Standaard jeugd" },
  { nr: 21, naam: "Blauw-1", alias: "B1", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "BLAUW", teamType: "VIERTAL", defaultOmvang: 6, scenarioNote: "Kweekvijver" },
  { nr: 22, naam: "Blauw-2", alias: "B2", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "BLAUW", teamType: "VIERTAL", defaultOmvang: 4, scenarioNote: "Standaard jeugd" },
  { nr: 23, naam: "Kangoeroes", alias: "K", owTeamType: "JEUGD", categorie: "B_CATEGORIE", kleur: "PAARS", teamType: "VIERTAL", defaultOmvang: 8, scenarioNote: "Kweekvijver jongste" },
  { nr: 24, naam: "EDGE-LEEG", alias: "EDGE-LEEG", owTeamType: "SENIOREN", categorie: "SENIOREN", kleur: null, teamType: "ACHTTAL", defaultOmvang: 0, scenarioNote: "Validatie ORANJE (leeg)" },
  { nr: 25, naam: "EDGE-ONDER", alias: "EDGE-ONDER", owTeamType: "SENIOREN", categorie: "SENIOREN", kleur: null, teamType: "ACHTTAL", defaultOmvang: 6, scenarioNote: "Validatie ROOD onder-min" },
];

export async function seedTeams(versieId: string): Promise<void> {
  logger.info("[seed-teams] 25 teams aanmaken");
  for (const def of TEAM_DEFS) {
    await prisma.team.upsert({
      where: { id: teamId(def.nr) },
      create: {
        id: teamId(def.nr),
        naam: def.naam,
        alias: def.alias,
        owTeamType: def.owTeamType,
        categorie: def.categorie,
        kleur: def.kleur,
        teamType: def.teamType,
        versieId,
      },
      update: {
        naam: def.naam,
        alias: def.alias,
        owTeamType: def.owTeamType,
        categorie: def.categorie,
        kleur: def.kleur,
        teamType: def.teamType,
        versieId,
      },
    });
  }
  logger.info(`[seed-teams] klaar — ${TEAM_DEFS.length} teams`);
}
```

> **NOTE:** Het echte Team-model in schema heeft mogelijk extra verplichte velden. Implementeer **deze taak in TDD-stijl**: schrijf eerst de upsert, run, kijk welke required fields ontbreken, vul aan tot Prisma stopt met klagen.

- [ ] **Stap 2.2: Commit**

```bash
git add scripts/seed/seed-teams.ts
git commit -m "patch: seed-edge-cases — 25 teams (sectie 0)"
```

---

## Task 3: Default spelers seeden

**Files:**
- Create: `scripts/seed/seed-default-spelers.ts`

**Doel:** elk team krijgt zijn `defaultOmvang` aan standaard-spelers (`SpelerStatus = BESCHIKBAAR`, gemixt M/V). `rel_code` = `9900-NN-XXXX` waarbij NN = team-nummer, XXXX = volgnummer.

- [ ] **Stap 3.1: Schrijf seed-default-spelers.ts**

```typescript
import { TEAM_DEFS } from "./seed-teams";
import { prisma, relCode, teamId } from "./types";
import { logger } from "@oranje-wit/types";

function geboortejaarVoorTeam(owTeamType: string, alias: string): number {
  // Kies een midden-leeftijd in de KNKV-categorie zodat speler ruim binnen valt
  if (alias.startsWith("S") || alias === "MW1" || alias === "RC") return 2000;
  if (alias.startsWith("U19")) return 2007;
  if (alias.startsWith("U17")) return 2009;
  if (alias.startsWith("U15")) return 2011;
  if (alias.startsWith("R")) return 2013;
  if (alias.startsWith("O")) return 2015;
  if (alias.startsWith("G") && !alias.startsWith("Gr")) return 2017;
  if (alias.startsWith("Gr")) return 2018;
  if (alias.startsWith("B")) return 2019;
  if (alias === "K") return 2020;
  return 2010;
}

export async function seedDefaultSpelers(): Promise<void> {
  logger.info("[seed-default-spelers] starten");
  let totaal = 0;

  for (const team of TEAM_DEFS) {
    if (team.defaultOmvang === 0) continue;

    for (let i = 1; i <= team.defaultOmvang; i++) {
      const code = relCode(team.nr, i);
      const isVrouw = i % 2 === 1;
      const geboortejaar = geboortejaarVoorTeam(team.owTeamType, team.alias ?? team.naam);

      await prisma.speler.upsert({
        where: { id: code },
        create: {
          id: code,
          relCode: code,
          roepnaam: `Speler-${team.alias}-${String(i).padStart(2, "0")}`,
          achternaam: `Test`,
          geslacht: isVrouw ? "V" : "M",
          geboortedatum: new Date(`${geboortejaar}-06-15`),
          status: "BESCHIKBAAR",
        },
        update: {
          roepnaam: `Speler-${team.alias}-${String(i).padStart(2, "0")}`,
          geslacht: isVrouw ? "V" : "M",
          geboortedatum: new Date(`${geboortejaar}-06-15`),
          status: "BESCHIKBAAR",
        },
      });

      await prisma.teamSpeler.upsert({
        where: { teamId_spelerId: { teamId: teamId(team.nr), spelerId: code } },
        create: { teamId: teamId(team.nr), spelerId: code },
        update: {},
      });

      totaal++;
    }
  }

  logger.info(`[seed-default-spelers] klaar — ${totaal} spelers + toewijzingen`);
}
```

> **Verifieer Prisma model-veld-namen** (geboortedatum, status, teamSpeler unique-constraint) tegen `schema.prisma`. Pas aan indien afwijkend.

- [ ] **Stap 3.2: Commit**

---

## Task 4: Edge-case fixtures seeden (secties 1.3–1.6)

**Files:**
- Create: `scripts/seed/seed-status-edge.ts` — 10 fixtures, 1 per `SpelerStatus`
- Create: `scripts/seed/seed-leeftijd-edge.ts` — 8 grens-fixtures
- Create: `scripts/seed/seed-data-incomplete.ts` — 3 incomplete-fixtures
- Create: `scripts/seed/seed-multi-team.ts` — 2 illegal-state fixtures

- [ ] **Stap 4.1: `seed-status-edge.ts`**

```typescript
import { prisma, relCode } from "./types";
import type { SpelerStatus, Geslacht } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

interface StatusEdgeFixture {
  volgnr: number;
  naam: string;
  status: SpelerStatus;
  geslacht: Geslacht;
}

const FIXTURES: StatusEdgeFixture[] = [
  { volgnr: 1, naam: "Edge-Beschikbaar-V", status: "BESCHIKBAAR", geslacht: "V" },
  { volgnr: 2, naam: "Edge-Twijfelt-V", status: "TWIJFELT", geslacht: "V" },
  { volgnr: 3, naam: "Edge-Geblesseerd-V", status: "GEBLESSEERD", geslacht: "V" },
  { volgnr: 4, naam: "Edge-GaatStoppen-V", status: "GAAT_STOPPEN", geslacht: "V" },
  { volgnr: 5, naam: "Edge-Gestopt-M", status: "GESTOPT", geslacht: "M" },
  { volgnr: 6, naam: "Edge-NieuwPotent-M", status: "NIEUW_POTENTIEEL", geslacht: "M" },
  { volgnr: 7, naam: "Edge-NieuwDef-M", status: "NIEUW_DEFINITIEF", geslacht: "M" },
  { volgnr: 8, naam: "Edge-AlgReserve-V", status: "ALGEMEEN_RESERVE", geslacht: "V" },
  { volgnr: 9, naam: "Edge-Recreant-M", status: "RECREANT", geslacht: "M" },
  { volgnr: 10, naam: "Edge-NietSpelend-V", status: "NIET_SPELEND", geslacht: "V" },
];

export async function seedStatusEdge(): Promise<void> {
  logger.info("[seed-status-edge] 10 status-fixtures");
  for (const f of FIXTURES) {
    const code = `99001000${String(f.volgnr).padStart(4, "0")}`;
    await prisma.speler.upsert({
      where: { id: code },
      create: {
        id: code,
        relCode: code,
        roepnaam: f.naam,
        achternaam: "Edge",
        geslacht: f.geslacht,
        geboortedatum: new Date("2000-06-15"),
        status: f.status,
      },
      update: { status: f.status },
    });
  }
}
```

- [ ] **Stap 4.2: `seed-leeftijd-edge.ts`** — analoog patroon, 8 grens-spelers met geboortedatums `2020-01-01`, `2018-01-01`, ..., `2006-01-01`, `rel_code` reeks `990020000001` t/m `990020000008`.

- [ ] **Stap 4.3: `seed-data-incomplete.ts`** — 3 spelers met respectievelijk `geboortedatum = null`, `geslacht = null` (let op: schema vereist mogelijk geslacht non-null; check eerst), `roepnaam = ""`. `rel_code` reeks `990030000001` t/m `990030000003`.

- [ ] **Stap 4.4: `seed-multi-team.ts`** — 2 spelers, beide aan **twee** teams toegewezen via `prisma.teamSpeler.create` (2× per speler). Bewuste illegale state. `rel_code` `990040000001` en `990040000002`.

- [ ] **Stap 4.5: Commit per file (4 commits)**

```bash
git add scripts/seed/seed-status-edge.ts && git commit -m "patch: seed-edge-cases — 10 status fixtures (sectie 1.3)"
git add scripts/seed/seed-leeftijd-edge.ts && git commit -m "patch: seed-edge-cases — 8 leeftijdsgrens fixtures (sectie 1.4)"
git add scripts/seed/seed-data-incomplete.ts && git commit -m "patch: seed-edge-cases — 3 data-incomplete fixtures (sectie 1.5)"
git add scripts/seed/seed-multi-team.ts && git commit -m "patch: seed-edge-cases — 2 multi-team illegal fixtures (sectie 1.6)"
```

---

## Task 5: What-if versies + werkindeling seeden (sectie 1.7)

**Files:**
- Create: `scripts/seed/seed-whatif.ts`

- [ ] **Stap 5.1: Werkindeling + 3 versies upserten**

```typescript
import { prisma, teamId } from "./types";
import { logger } from "@oranje-wit/types";

const WERKINDELING_ID = "wi-edge-2026-2027";

export async function seedWerkindelingEnVersies(): Promise<{ actieveVersieId: string }> {
  // Kaders (vereist door werkindeling)
  const kaders = await prisma.kaders.upsert({
    where: { seizoen: "2026-2027" },
    create: { seizoen: "2026-2027", isWerkseizoen: true, kaders: {} },
    update: { isWerkseizoen: true },
  });

  // Werkindeling
  const wi = await prisma.werkindeling.upsert({
    where: { id: WERKINDELING_ID },
    create: { id: WERKINDELING_ID, naam: "TI 2026-2027", seizoen: "2026-2027", status: "ACTIEF", kadersId: kaders.id },
    update: { naam: "TI 2026-2027", status: "ACTIEF" },
  });

  // 3 versies
  const versieActief = await prisma.versie.upsert({
    where: { id: "versie-edge-actief" },
    create: { id: "versie-edge-actief", werkindelingId: wi.id, nummer: 1, naam: "Basis", isActief: true },
    update: { isActief: true },
  });
  await prisma.versie.upsert({
    where: { id: "versie-edge-whatif-conflict" },
    create: { id: "versie-edge-whatif-conflict", werkindelingId: wi.id, nummer: 2, naam: "What-if conflict", isActief: false },
    update: { isActief: false },
  });
  await prisma.versie.upsert({
    where: { id: "versie-edge-leeg" },
    create: { id: "versie-edge-leeg", werkindelingId: wi.id, nummer: 3, naam: "Leeg", isActief: false },
    update: { isActief: false },
  });

  return { actieveVersieId: versieActief.id };
}
```

> **Verifieer schema-naam** voor `nummer`/`isActief`-velden — pas aan indien anders.

- [ ] **Stap 5.2: Commit**

---

## Task 6: Orchestrator-entrypoint

**Files:**
- Create: `scripts/seed-edge-cases.ts`

- [ ] **Stap 6.1: Schrijf orchestrator**

```typescript
#!/usr/bin/env tsx
/**
 * Seed-script voor edge-case test-data op oranjewit-test.
 * Wipe + reseed naar de ideale state uit docs/kennis/edge-case-testdata.md.
 *
 * Gebruik: pnpm tsx scripts/seed-edge-cases.ts
 * Env: DATABASE_URL moet 'test' bevatten (anders weigert wipe).
 */
import { logger } from "@oranje-wit/types";
import { prisma } from "./seed/types";
import { wipeAll } from "./seed/wipe";
import { seedWerkindelingEnVersies } from "./seed/seed-whatif";
import { seedTeams } from "./seed/seed-teams";
import { seedDefaultSpelers } from "./seed/seed-default-spelers";
import { seedStatusEdge } from "./seed/seed-status-edge";
import { seedLeeftijdEdge } from "./seed/seed-leeftijd-edge";
import { seedDataIncomplete } from "./seed/seed-data-incomplete";
import { seedMultiTeam } from "./seed/seed-multi-team";

async function main(): Promise<void> {
  const start = Date.now();
  logger.info("[seed-edge-cases] starten");

  await wipeAll();
  const { actieveVersieId } = await seedWerkindelingEnVersies();
  await seedTeams(actieveVersieId);
  await seedDefaultSpelers();
  await seedStatusEdge();
  await seedLeeftijdEdge();
  await seedDataIncomplete();
  await seedMultiTeam();

  const duur = Date.now() - start;
  logger.info(`[seed-edge-cases] klaar in ${duur}ms`);
}

main()
  .catch((error) => {
    logger.error("[seed-edge-cases] mislukt:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Stap 6.2: Lokaal verifiëren tegen test-DB**

```bash
DATABASE_URL=<test-db-url-uit-Railway> pnpm tsx scripts/seed-edge-cases.ts
```
Verwacht: `[seed-edge-cases] klaar in <duur>ms`, geen errors. Daarna handmatige check via Prisma Studio of een SQL count:
```sql
SELECT COUNT(*) FROM spelers; -- ~175
SELECT COUNT(*) FROM teams; -- 25
SELECT COUNT(*) FROM team_spelers; -- 175 + 2 extra (multi-team)
```

- [ ] **Stap 6.3: Optioneel: package.json alias**

In `packages/database/package.json` (of root):
```json
"scripts": {
  "seed:edge": "tsx scripts/seed-edge-cases.ts"
}
```

- [ ] **Stap 6.4: Commit**

```bash
git add scripts/seed-edge-cases.ts package.json
git commit -m "patch: seed-edge-cases — orchestrator + pnpm seed:edge alias"
```

---

## Task 7: Workflow-step toevoegen

**Files:**
- Modify: `.github/workflows/e2e-studio-test.yml`

- [ ] **Stap 7.1: Voeg seed-step toe vóór Playwright**

```yaml
      - name: Seed edge-case test-data
        run: pnpm tsx scripts/seed-edge-cases.ts
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: E2E tests uitvoeren tegen studio-test
        run: pnpm exec playwright test --project=studio-test-auth-setup --project=ti-studio-v2-remote --reporter=html
```

- [ ] **Stap 7.2: GitHub secret `TEST_DATABASE_URL` instellen**

```bash
# Haal de test-DB URL uit Railway (intern bereikbaar OF publiek proxy)
TEST_DB_URL=$(curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Authorization: Bearer 758497fe-16c0-4d3b-9fc9-11207eab0163" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { variables(projectId: \"aa87602d-316d-4d3e-8860-f75d352fae27\", environmentId: \"1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1\", serviceId: \"c6368d17-7617-4589-b093-e528ed3ddba5\") }"}' \
  | jq -r '.data.variables.DATABASE_PUBLIC_URL // .data.variables.DATABASE_URL')

echo "$TEST_DB_URL" | gh secret set TEST_DATABASE_URL -R mrbacklog/oranje-wit
```

> **Service-ID `c6368d17`** is de `oranjewit-test` PostgreSQL service. Vereist publieke proxy URL want GitHub Actions kan niet bij interne Railway URL.

- [ ] **Stap 7.3: Commit + trigger workflow**

```bash
git add .github/workflows/e2e-studio-test.yml
git commit -m "patch: E2E workflow — seed-step vóór Playwright"
git push origin main
gh workflow run "E2E tegen studio-test"
sleep 15
RUN_ID=$(gh run list --workflow="E2E tegen studio-test" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RUN_ID --exit-status
```

Verwacht: seed-step slaagt (<30s), tests draaien tegen verse state. Sommige zullen falen want specs zijn nog niet aangepast — dat is verwacht en wordt Task 8.

---

## Task 8: Specs harden — skip vervangen door fixture-asserts

**Files:**
- Modify: `e2e/ti-studio-v2/smoke.spec.ts`
- Modify: `e2e/ti-studio-v2/homepage.spec.ts`
- Modify: `e2e/ti-studio-v2/memo.spec.ts`
- Modify: `e2e/ti-studio-v2/personen.spec.ts`
- Modify: `e2e/ti-studio-v2/werkbord.spec.ts`
- Modify: `e2e/ti-studio-v2/werkbord-dragdrop.spec.ts`

Per spec: vervang `test.skip(true, "geen data")` door harde `expect()` op fixtures uit de catalogus.

- [ ] **Stap 8.1: smoke.spec — assertions op exacte fixtures**

Bv. test "toont tabel-koppen op spelers-tab":
```typescript
// VOOR:
const headers = page.locator("thead th");
if ((await headers.count()) === 0) test.skip(true, "Geen tabel-koppen");
// NA:
await expect(page.locator('[data-testid="speler-card-990010000001-spelerpool"]'))
  .toBeVisible({ timeout: 10_000 });
```

- [ ] **Stap 8.2: homepage.spec** — werkbord-widget test gaat uit van "totaal 175 spelers". Pas widget-count-asserts aan.

- [ ] **Stap 8.3: memo.spec** — als catalogus geen memo's seedt (yet), TODO: memo-fixtures toevoegen aan catalog + seed. Tot dan: skip met expliciete reden.

- [ ] **Stap 8.4: personen.spec** — `tabelRijen` asserts vervangen door bv. `page.locator('[data-testid="speler-card-990010000003-spelerpool"]')` (geblesseerde speler).

- [ ] **Stap 8.5: werkbord.spec** — `[data-team-id="team-edge-01"]` als concrete handle voor Senioren 1.

- [ ] **Stap 8.6: werkbord-dragdrop.spec** — gebruik `relCode(1, 1)` als bron-speler, `teamId(2)` als doel-team. Drag-flow blijft hetzelfde.

- [ ] **Stap 8.7: Lokaal verifiëren elke spec groen**

```bash
DATABASE_URL=<test-db-url> pnpm tsx scripts/seed-edge-cases.ts  # eerst seed
pnpm exec playwright test --project=studio-test-auth-setup --project=ti-studio-v2-remote --headed --workers=1
```
Doel: 0 failed, <10% skipped.

- [ ] **Stap 8.8: Commits per spec (6×)**

```bash
git add e2e/ti-studio-v2/smoke.spec.ts && git commit -m "patch: smoke.spec — harde asserts op fixtures"
# ... idem voor andere 5
```

---

## Task 9: Final verifieer + nightly groen

- [ ] **Stap 9.1: Push alle commits**

```bash
git push origin main
```

- [ ] **Stap 9.2: Trigger workflow + watch**

```bash
gh workflow run "E2E tegen studio-test"
sleep 15
RUN_ID=$(gh run list --workflow="E2E tegen studio-test" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RUN_ID --exit-status
```

Verwacht: 0 failed, ~50+ passed, <10 skipped (alleen met TODO-redenen voor nog niet-geseeded scenarios).

- [ ] **Stap 9.3: Catalogus + kennisdoc bijwerken**

Voeg sectie toe in `docs/kennis/edge-case-testdata.md`:
- "Seed-script live sinds commit X"
- "Hoe lokaal te testen: `DATABASE_URL=... pnpm seed:edge`"

- [ ] **Stap 9.4: Memory bijwerken**

Sla project-memory op met huidige stand (single source of truth catalogus + werkende seed + groene tests).

---

## Self-Review Checklist

- [ ] Alle 25 teams uit catalogus aanwezig in `seed-teams.ts` met exacte velden
- [ ] Alle 10 `SpelerStatus`-waarden gedekt door `seed-status-edge.ts`
- [ ] Alle 8 leeftijdsgrenzen in `seed-leeftijd-edge.ts`
- [ ] Wipe-script weigert te draaien tegen niet-test-DB (URL-check)
- [ ] Seed-script is idempotent (2× achter elkaar draaien = zelfde state)
- [ ] Workflow heeft seed-step **vóór** Playwright-step
- [ ] `TEST_DATABASE_URL` is GitHub secret (niet hardcoded)
- [ ] Geen `tabelRijen.first()` of `text=/.../` selectors meer in specs
- [ ] Nightly run groen — 0 failed
- [ ] Skip-rate <10% (alleen scenarios die nog niet geseed zijn)

---

## Open opvolg-werk (NIET in dit plan)

1. **Memo-fixtures** aan catalog + seed toevoegen — memo.spec kan dan harden
2. **Kader-fixtures** voor toekomstige kader.spec
3. **AgentMutatie-types** uitbreiden (`speler_status_wijziging`, `memo_save`) — zie eerder plan
4. **Test-DB migration-history sync** — baseline fixen zodat `pnpm db:migrate:deploy` werkt
5. **Sportlink-sync smoke** — apart mechanisme, niet via `oranjewit-test`
6. **Load-test fixture** — als productie-schaal performance-issues vergt

---

## Hoe uit te voeren

**Aanbevolen:** subagent-driven-development.

```
Skill: superpowers:subagent-driven-development
Plan: docs/superpowers/plans/2026-05-18-seed-edge-cases.md
```

Tasks 1-7 zijn sequentieel (FK-volgorde van seed-bouw). Task 8 (6 specs hardenen) kan **parallel** in 6 worktrees mits Tasks 1-7 al gemerged zijn.

**Schatting:** 4-8 uur agent-werk verspreid over 1-2 sessies.

Begin met Task 1 (wipe + types). Verifieer dat wipe weigert te draaien tegen productie-URL voordat je verder gaat — dat is de kritieke veiligheidsgate.
