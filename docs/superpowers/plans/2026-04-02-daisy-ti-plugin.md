# Daisy TI-plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daisy uitbreiden met 17 tools waarmee ze meedenkt, data opzoekt en daadwerkelijk acties uitvoert in de TI-studio (lezen, schrijven, undo), inclusief audit-logging via `DaisyActie`.

**Architecture:** Alle 17 tools komen in `apps/web/src/lib/ai/plugins/ti-studio.ts`. De registry geeft `sessieId` en `gebruikerEmail` door aan de tools via een factory-functie. Elke schrijf-tool logt een `DaisyActie` met undo-payload. Undo-tools lezen de log en draaien acties in omgekeerde volgorde terug.

**Tech Stack:** Next.js 15 Server Actions, Prisma (gedeeld schema in `packages/database`), Vercel AI SDK v6, Zod v3, pnpm workspace.

---

## Bestandsoverzicht

| Bestand | Actie | Wat |
|---|---|---|
| `packages/database/prisma/schema.prisma` | Wijzig | Voeg `DaisyActie` en `Plaatsreservering` toe |
| `apps/web/src/lib/teamindeling/db/prisma.ts` | Wijzig | Voeg `daisyActie` en `plaatsreservering` toe aan `AnyPrismaModels` |
| `apps/web/src/lib/ai/daisy-acties.ts` | Maak aan | CRUD voor `DaisyActie`: loggen, undo dispatch, sessie-undo |
| `apps/web/src/lib/ai/plugins/ti-studio.ts` | Maak aan | Alle 17 tools in één bestand |
| `apps/web/src/lib/ai/plugins/registry.ts` | Wijzig | Factory-functie uitbreiden met sessieId + gebruikerEmail |
| `apps/web/src/app/api/ai/chat/route.ts` | Wijzig | `getDaisyTools` aanroepen met sessieId + gebruikerEmail |
| `apps/web/src/lib/ai/daisy.ts` | Wijzig | Systeem-prompt uitbreiden met TI-tools instructie |

---

## Task 1: Database schema — DaisyActie + Plaatsreservering

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Stap 1: Voeg modellen toe aan het schema**

Voeg toe aan het einde van `packages/database/prisma/schema.prisma` (voor de laatste `}`):

```prisma
// ============================================================
// DAISY ACTIE-LOG (audit + undo)
// ============================================================

model DaisyActie {
  id           String   @id @default(cuid())
  sessieId     String   // = gesprekId uit Daisy-chat
  tool         String   // naam van de uitgevoerde tool
  doPayload    Json     // wat er gedaan is (voor audit)
  undoPayload  Json     // minimale instructie om terug te draaien
  tijdstip     DateTime @default(now())
  namens       String?  // verplicht voor besluitVastleggen
  uitgevoerdIn String   // "werkindeling" | "scenario:<id>"
  ongedaan     Boolean  @default(false)

  @@index([sessieId])
  @@index([tijdstip])
  @@map("daisy_acties")
}

// ============================================================
// PLAATSRESERVERING (naamloze placeholder in team)
// ============================================================

model Plaatsreservering {
  id       String   @id @default(cuid())
  team     Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId   String
  naam     String
  geslacht String?  // "M" | "V" | null

  createdAt DateTime @default(now())

  @@index([teamId])
  @@map("plaatsreserveringen")
}
```

- [ ] **Stap 2: Voeg `plaatsreserveringen` relatie toe aan `Team` model**

Zoek het `Team` model (regel ~818) en voeg toe na `whatIfKopieen WhatIfTeam[]`:

```prisma
  plaatsreserveringen Plaatsreservering[]
```

- [ ] **Stap 3: Migratie aanmaken**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm db:generate
pnpm db:migrate
# Geef naam: daisy_actie_plaatsreservering
```

Verwacht: migratie aangemaakt in `packages/database/prisma/migrations/`

- [ ] **Stap 4: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat(db): voeg DaisyActie en Plaatsreservering toe aan schema"
```

---

## Task 2: Prisma-wrapper + daisy-acties.ts

**Files:**
- Modify: `apps/web/src/lib/teamindeling/db/prisma.ts`
- Create: `apps/web/src/lib/ai/daisy-acties.ts`

- [ ] **Stap 1: Voeg nieuwe modellen toe aan de wrapper**

In `apps/web/src/lib/teamindeling/db/prisma.ts`, voeg toe in `AnyPrismaModels` na `scenarioSnapshot: AnyModel;`:

```typescript
  // Daisy
  daisyActie: AnyModel;
  plaatsreservering: AnyModel;
```

- [ ] **Stap 2: Maak `daisy-acties.ts` aan**

```typescript
// apps/web/src/lib/ai/daisy-acties.ts
/**
 * CRUD voor DaisyActie — audit-log en undo-mechanisme.
 */
import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";

export interface DaisyActieRecord {
  id: string;
  sessieId: string;
  tool: string;
  doPayload: unknown;
  undoPayload: unknown;
  tijdstip: Date;
  namens: string | null;
  uitgevoerdIn: string;
  ongedaan: boolean;
}

/** Log een uitgevoerde actie. Gooi nooit — schrijf alleen warn als logging faalt. */
export async function logDaisyActie(params: {
  sessieId: string;
  tool: string;
  doPayload: unknown;
  undoPayload: unknown;
  namens?: string;
  uitgevoerdIn: string;
}): Promise<DaisyActieRecord> {
  return prisma.daisyActie.create({
    data: {
      sessieId: params.sessieId,
      tool: params.tool,
      doPayload: params.doPayload as any,
      undoPayload: params.undoPayload as any,
      namens: params.namens ?? null,
      uitgevoerdIn: params.uitgevoerdIn,
    },
  });
}

/** Haal de laatste N acties op voor een sessie (nieuwste eerst). */
export async function getDaisyActies(
  sessieId: string,
  limit = 50
): Promise<DaisyActieRecord[]> {
  return prisma.daisyActie.findMany({
    where: { sessieId, ongedaan: false },
    orderBy: { tijdstip: "desc" },
    take: limit,
  });
}

/** Markeer een actie als ongedaan. */
export async function markeerOngedaan(actieId: string): Promise<void> {
  await prisma.daisyActie.update({
    where: { id: actieId },
    data: { ongedaan: true },
  });
}

/** Haal één actie op. */
export async function getDaisyActie(actieId: string): Promise<DaisyActieRecord | null> {
  return prisma.daisyActie.findUnique({ where: { id: actieId } });
}
```

- [ ] **Stap 3: Schrijf de unit test**

```typescript
// apps/web/src/lib/ai/daisy-acties.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logDaisyActie, getDaisyActies, markeerOngedaan } from "./daisy-acties";

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    daisyActie: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/teamindeling/db/prisma";

describe("daisy-acties", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logDaisyActie slaat correcte velden op", async () => {
    const mock = prisma.daisyActie.create as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({ id: "act-1", ongedaan: false });

    await logDaisyActie({
      sessieId: "gesprek-1",
      tool: "spelerVerplaatsen",
      doPayload: { spelerId: "s1", van: "T1", naar: "T2" },
      undoPayload: { spelerId: "s1", van: "T2", naar: "T1" },
      uitgevoerdIn: "werkindeling",
    });

    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessieId: "gesprek-1",
          tool: "spelerVerplaatsen",
          uitgevoerdIn: "werkindeling",
        }),
      })
    );
  });

  it("getDaisyActies filtert op sessieId en ongedaan=false", async () => {
    const mock = prisma.daisyActie.findMany as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue([]);

    await getDaisyActies("gesprek-1");

    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessieId: "gesprek-1", ongedaan: false },
      })
    );
  });
});
```

- [ ] **Stap 4: Run de test**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm test -- daisy-acties
```

Verwacht: 2 tests PASS

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/lib/ai/daisy-acties.ts apps/web/src/lib/ai/daisy-acties.test.ts apps/web/src/lib/teamindeling/db/prisma.ts
git commit -m "feat(daisy): DaisyActie CRUD + unit tests"
```

---

## Task 3: Registry refactor — sessiecontext injecteren

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/registry.ts`
- Modify: `apps/web/src/app/api/ai/chat/route.ts`

- [ ] **Stap 1: Update de registry**

Vervang de huidige inhoud van `apps/web/src/lib/ai/plugins/registry.ts`:

```typescript
/**
 * Plugin-registry voor Daisy — combineert alle tools op basis van clearance
 */
import type { Clearance } from "@oranje-wit/types";
import { planningTools } from "./planning";
import { monitorTools } from "./monitor";
import { teamindelingTools } from "./teamindeling";
import { getTiStudioTools } from "./ti-studio";

export interface DaisyContext {
  clearance: Clearance;
  sessieId: string;
  gebruikerEmail: string;
}

/**
 * Geeft alle beschikbare Daisy-tools terug op basis van context.
 * Clearance 0 = geen tools.
 * Clearance 1+ = alle tools inclusief TI-studio schrijf-tools.
 */
export function getDaisyTools(context: DaisyContext) {
  if (context.clearance < 1) {
    return {} as Record<string, never>;
  }

  return {
    ...planningTools,
    ...monitorTools,
    ...teamindelingTools,
    ...getTiStudioTools(context.sessieId, context.gebruikerEmail),
  };
}
```

- [ ] **Stap 2: Update de chat route**

In `apps/web/src/app/api/ai/chat/route.ts`, vervang:

```typescript
const tools = getDaisyTools(session.user.clearance) as unknown as ToolSet;
```

door:

```typescript
const tools = getDaisyTools({
  clearance: session.user.clearance,
  sessieId: gesprekId ?? gesprek.id,
  gebruikerEmail: session.user.email ?? "onbekend",
}) as unknown as ToolSet;
```

- [ ] **Stap 3: Bouw controleren**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm build 2>&1 | tail -5
```

Verwacht: build slaagt (ti-studio.ts bestaat nog niet, maar we exporteren een lege functie tijdelijk)

**Tijdelijke stub** — maak aan als de build faalt:

```typescript
// apps/web/src/lib/ai/plugins/ti-studio.ts
export function getTiStudioTools(_sessieId: string, _gebruikerEmail: string) {
  return {};
}
```

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/lib/ai/plugins/registry.ts apps/web/src/app/api/ai/chat/route.ts apps/web/src/lib/ai/plugins/ti-studio.ts
git commit -m "feat(daisy): registry uitbreiden met sessiecontext + ti-studio stub"
```

---

## Task 4: Lees-tools (4 tools)

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts`

- [ ] **Stap 1: Vervang de stub met de 4 lees-tools**

```typescript
// apps/web/src/lib/ai/plugins/ti-studio.ts
/**
 * TI-studio plugin voor Daisy — 17 tools voor de teamindeling.
 *
 * Lees-tools (4): spelersZoeken, teamSamenstelling, scenarioVergelijken, blauwdrukToetsen
 * Schrijf-tools spelers (6): spelerVerplaatsen, spelerStatusZetten, spelerNotitieZetten,
 *   nieuwLidInBlauwdruk, plaatsreserveringZetten, besluitVastleggen
 * Schrijf-tools teams & staf (3): teamAanmaken, selectieAanmaken, stafPlaatsen
 * Schrijf-tools werkbord & scenario (2): whatIfScenarioAanmaken, actiePlaatsen
 * Undo (2): actieOngedaanMaken, sessieTerugdraaien
 */
import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { HUIDIG_SEIZOEN, PEILJAAR } from "@oranje-wit/types";
import { logDaisyActie, getDaisyActies, markeerOngedaan, getDaisyActie } from "@/lib/ai/daisy-acties";

// ─── Helpers ────────────────────────────────────────────────────

async function getWerkBlauwdruk() {
  return prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true, kaders: true, keuzes: true },
  });
}

async function getLaatsteVersie(scenarioId: string) {
  return prisma.versie.findFirst({
    where: { scenarioId },
    orderBy: { nummer: "desc" },
    select: { id: true, nummer: true },
  });
}

// ─── Lees-tools ─────────────────────────────────────────────────

const leesTools = {
  spelersZoeken: {
    description:
      "Zoek spelers op met filters. Gebruik dit om kandidaten te vinden voor verplaatsing of analyse.",
    parameters: z.object({
      geslacht: z.enum(["M", "V"]).optional().describe("Filter op geslacht"),
      geboortejaar: z.number().optional().describe("Filter op exact geboortejaar"),
      leeftijdVolgendSeizoen: z
        .number()
        .optional()
        .describe(`Leeftijd volgend seizoen (peiljaar ${PEILJAAR})`),
      ussMin: z.number().optional().describe("Minimale USS-score"),
      ussMax: z.number().optional().describe("Maximale USS-score"),
      retentierisico: z
        .enum(["hoog", "middel", "laag"])
        .optional()
        .describe("Filter op retentierisico"),
      team: z.string().optional().describe("Filter op huidig team (gedeeltelijke naam)"),
      status: z
        .enum([
          "BESCHIKBAAR",
          "TWIJFELT",
          "GAAT_STOPPEN",
          "NIEUW_POTENTIEEL",
          "NIEUW_DEFINITIEF",
          "ALGEMEEN_RESERVE",
        ])
        .optional()
        .describe("Filter op spelerstatus"),
    }),
    execute: async (params: {
      geslacht?: "M" | "V";
      geboortejaar?: number;
      leeftijdVolgendSeizoen?: number;
      ussMin?: number;
      ussMax?: number;
      retentierisico?: "hoog" | "middel" | "laag";
      team?: string;
      status?: string;
    }) => {
      const where: Record<string, any> = {};
      if (params.geslacht) where.geslacht = params.geslacht;
      if (params.geboortejaar) where.geboortejaar = params.geboortejaar;
      if (params.leeftijdVolgendSeizoen)
        where.geboortejaar = PEILJAAR - params.leeftijdVolgendSeizoen;
      if (params.status) where.status = params.status;

      const spelers = await prisma.speler.findMany({
        where,
        select: {
          id: true,
          roepnaam: true,
          achternaam: true,
          geboortejaar: true,
          geslacht: true,
          status: true,
          rating: true,
          ratingBerekend: true,
          retentie: true,
          huidig: true,
          notitie: true,
        },
        orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
        take: 50,
      });

      let resultaat = spelers.map((s) => ({
        id: s.id,
        naam: `${s.roepnaam} ${s.achternaam}`,
        geslacht: s.geslacht,
        geboortejaar: s.geboortejaar,
        leeftijdVolgendSeizoen: PEILJAAR - s.geboortejaar,
        status: s.status,
        uss: s.rating ?? s.ratingBerekend ?? null,
        retentierisico: (s.retentie as any)?.risico ?? null,
        huidigTeam: (s.huidig as any)?.team ?? null,
        notitie: s.notitie ?? null,
      }));

      // Client-side filters die niet in Prisma zitten
      if (params.ussMin != null)
        resultaat = resultaat.filter((s) => s.uss != null && s.uss >= params.ussMin!);
      if (params.ussMax != null)
        resultaat = resultaat.filter((s) => s.uss != null && s.uss <= params.ussMax!);
      if (params.retentierisico)
        resultaat = resultaat.filter((s) => s.retentierisico === params.retentierisico);
      if (params.team)
        resultaat = resultaat.filter((s) =>
          s.huidigTeam?.toLowerCase().includes(params.team!.toLowerCase())
        );

      return { aantalGevonden: resultaat.length, spelers: resultaat };
    },
  },

  teamSamenstelling: {
    description:
      "Geeft de volledige bezetting van een team: spelers, USS-scores, geslachtsverhouding en staf. Zoek op (deel van) teamnaam.",
    parameters: z.object({
      teamNaam: z.string().describe("(Deel van) de teamnaam, bijv. 'Sen 1' of 'U15'"),
      inContext: z
        .string()
        .optional()
        .describe(
          'Optioneel: "werkindeling" (standaard) of een scenarioId om in een specifiek scenario te kijken'
        ),
    }),
    execute: async ({ teamNaam, inContext }: { teamNaam: string; inContext?: string }) => {
      // Zoek het team in de werkindeling of een specifiek scenario
      let versieId: string | null = null;

      if (!inContext || inContext === "werkindeling") {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve werkindeling gevonden" };

        const werkindeling = await prisma.scenario.findFirst({
          where: { concept: { blauwdrukId: blauwdruk.id }, isWerkindeling: true },
          select: { id: true },
        });
        if (!werkindeling) return { fout: "Geen werkindeling scenario gevonden" };

        const versie = await getLaatsteVersie(werkindeling.id);
        versieId = versie?.id ?? null;
      } else {
        const versie = await getLaatsteVersie(inContext);
        versieId = versie?.id ?? null;
      }

      if (!versieId) return { fout: "Geen versie gevonden" };

      const teams = await prisma.team.findMany({
        where: {
          versieId,
          naam: { contains: teamNaam, mode: "insensitive" },
        },
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
                  geslacht: true,
                  rating: true,
                  ratingBerekend: true,
                  status: true,
                },
              },
            },
          },
          staf: {
            select: {
              staf: { select: { naam: true } },
              rol: true,
            },
          },
        },
      });

      if (teams.length === 0) return { fout: `Geen team gevonden met naam "${teamNaam}"` };

      return teams.map((team) => {
        const spelers = team.spelers.map((ts) => ({
          id: ts.speler.id,
          naam: `${ts.speler.roepnaam} ${ts.speler.achternaam}`,
          geslacht: ts.speler.geslacht,
          uss: ts.speler.rating ?? ts.speler.ratingBerekend ?? null,
          status: ts.speler.status,
        }));
        const mannen = spelers.filter((s) => s.geslacht === "M").length;
        const vrouwen = spelers.filter((s) => s.geslacht === "V").length;
        const gemUss =
          spelers.filter((s) => s.uss != null).length > 0
            ? Math.round(
                spelers.filter((s) => s.uss != null).reduce((sum, s) => sum + s.uss!, 0) /
                  spelers.filter((s) => s.uss != null).length
              )
            : null;
        return {
          id: team.id,
          naam: team.naam,
          categorie: team.categorie,
          aantalSpelers: spelers.length,
          mannen,
          vrouwen,
          gemiddeldeUss: gemUss,
          spelers,
          staf: team.staf.map((ts) => ({ naam: ts.staf.naam, rol: ts.rol })),
        };
      });
    },
  },

  scenarioVergelijken: {
    description:
      "Vergelijkt twee scenario's en toont wie verschoven is en wat de score-impact is.",
    parameters: z.object({
      scenarioIdA: z.string().describe("ID van het eerste scenario"),
      scenarioIdB: z.string().describe("ID van het tweede scenario"),
    }),
    execute: async ({
      scenarioIdA,
      scenarioIdB,
    }: {
      scenarioIdA: string;
      scenarioIdB: string;
    }) => {
      async function getTeamplaatsingen(scenarioId: string) {
        const versie = await getLaatsteVersie(scenarioId);
        if (!versie) return new Map<string, string>();
        const spelers = await prisma.teamSpeler.findMany({
          where: { team: { versieId: versie.id } },
          select: {
            spelerId: true,
            team: { select: { naam: true } },
            speler: { select: { roepnaam: true, achternaam: true } },
          },
        });
        return new Map(
          spelers.map((s) => [
            s.spelerId,
            {
              team: s.team.naam,
              naam: `${s.speler.roepnaam} ${s.speler.achternaam}`,
            },
          ])
        );
      }

      const [plaatsingenA, plaatsingenB] = await Promise.all([
        getTeamplaatsingen(scenarioIdA),
        getTeamplaatsingen(scenarioIdB),
      ]);

      const verschuivingen: Array<{ naam: string; van: string; naar: string }> = [];
      const alleSpelers = new Set([...plaatsingenA.keys(), ...plaatsingenB.keys()]);

      for (const spelerId of alleSpelers) {
        const a = plaatsingenA.get(spelerId);
        const b = plaatsingenB.get(spelerId);
        if (a?.team !== b?.team) {
          verschuivingen.push({
            naam: a?.naam ?? b?.naam ?? spelerId,
            van: a?.team ?? "(niet geplaatst)",
            naar: b?.team ?? "(niet geplaatst)",
          });
        }
      }

      return {
        aantalVerschuivingen: verschuivingen.length,
        verschuivingen: verschuivingen.sort((a, b) => a.naam.localeCompare(b.naam)),
      };
    },
  },

  blauwdrukToetsen: {
    description:
      "Toetst de huidige werkindeling aan de blauwdruk-kaders: teamgrootte, categorieën, niveau en eventuele knelpunten.",
    parameters: z.object({}),
    execute: async () => {
      const blauwdruk = await getWerkBlauwdruk();
      if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

      const werkindeling = await prisma.scenario.findFirst({
        where: { concept: { blauwdrukId: blauwdruk.id }, isWerkindeling: true },
        select: { id: true, naam: true },
      });
      if (!werkindeling) return { fout: "Geen werkindeling gevonden" };

      const versie = await getLaatsteVersie(werkindeling.id);
      if (!versie) return { fout: "Geen versie gevonden in werkindeling" };

      const teams = await prisma.team.findMany({
        where: { versieId: versie.id },
        select: {
          naam: true,
          categorie: true,
          _count: { select: { spelers: true } },
        },
      });

      const kaders = blauwdruk.kaders as any;
      const knelpunten: string[] = [];

      for (const team of teams) {
        const aantal = team._count.spelers;
        if (aantal < 8) knelpunten.push(`${team.naam}: te weinig spelers (${aantal}, min 8)`);
        if (aantal > 14) knelpunten.push(`${team.naam}: te veel spelers (${aantal}, max 14)`);
      }

      return {
        seizoen: blauwdruk.seizoen,
        werkindeling: werkindeling.naam,
        aantalTeams: teams.length,
        teams: teams.map((t) => ({
          naam: t.naam,
          categorie: t.categorie,
          aantalSpelers: t._count.spelers,
        })),
        knelpunten,
        kaders: kaders ?? {},
      };
    },
  },
};

export function getTiStudioTools(_sessieId: string, _gebruikerEmail: string) {
  return leesTools;
}
```

- [ ] **Stap 2: Build controleren**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm build 2>&1 | tail -5
```

Verwacht: build slaagt

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/lib/ai/plugins/ti-studio.ts
git commit -m "feat(daisy): lees-tools — spelersZoeken, teamSamenstelling, scenarioVergelijken, blauwdrukToetsen"
```

---

## Task 5: Schrijf-tools spelers (6 tools)

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts`

- [ ] **Stap 1: Voeg schrijf-tools voor spelers toe**

Voeg toe na de `leesTools` definitie, vóór `export function getTiStudioTools`:

```typescript
// ─── Schrijf-tools spelers ───────────────────────────────────────

function maakSchrijfToolsSpelers(sessieId: string, gebruikerEmail: string) {
  return {
    spelerVerplaatsen: {
      description:
        "Verplaatst een speler van het ene team naar het andere. Werkt in scenario of werkindeling.",
      parameters: z.object({
        spelerId: z.string().describe("ID van de speler (rel_code)"),
        naarTeam: z.string().describe("Naam van het doelteam"),
        inContext: z
          .string()
          .describe('"werkindeling" of een scenarioId'),
      }),
      execute: async ({
        spelerId,
        naarTeam,
        inContext,
      }: {
        spelerId: string;
        naarTeam: string;
        inContext: string;
      }) => {
        // Zoek de versie
        let versieId: string;
        if (inContext === "werkindeling") {
          const blauwdruk = await getWerkBlauwdruk();
          if (!blauwdruk) return { fout: "Geen actieve werkindeling" };
          const wi = await prisma.scenario.findFirst({
            where: { concept: { blauwdrukId: blauwdruk.id }, isWerkindeling: true },
          });
          if (!wi) return { fout: "Geen werkindeling scenario" };
          const v = await getLaatsteVersie(wi.id);
          if (!v) return { fout: "Geen versie in werkindeling" };
          versieId = v.id;
        } else {
          const v = await getLaatsteVersie(inContext);
          if (!v) return { fout: "Scenario niet gevonden" };
          versieId = v.id;
        }

        // Zoek huidig team
        const huidigeplaatsing = await prisma.teamSpeler.findFirst({
          where: { spelerId, team: { versieId } },
          select: { id: true, teamId: true, team: { select: { naam: true } } },
        });

        // Zoek doelteam
        const doelTeam = await prisma.team.findFirst({
          where: { versieId, naam: { contains: naarTeam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!doelTeam) return { fout: `Team "${naarTeam}" niet gevonden in deze context` };

        const speler = await prisma.speler.findUnique({
          where: { id: spelerId },
          select: { roepnaam: true, achternaam: true },
        });
        const spelerNaam = speler
          ? `${speler.roepnaam} ${speler.achternaam}`
          : spelerId;
        const vanTeamNaam = huidigeplaatsing?.team?.naam ?? "(niet geplaatst)";

        await prisma.$transaction(async (tx: any) => {
          if (huidigeplaatsing) {
            await tx.teamSpeler.delete({ where: { id: huidigeplaatsing.id } });
          }
          await tx.teamSpeler.create({
            data: { teamId: doelTeam.id, spelerId },
          });
        });

        await logDaisyActie({
          sessieId,
          tool: "spelerVerplaatsen",
          doPayload: { spelerId, spelerNaam, van: vanTeamNaam, naar: doelTeam.naam },
          undoPayload: {
            spelerId,
            vanTeamId: doelTeam.id,
            naarTeamId: huidigeplaatsing?.teamId ?? null,
            versieId,
          },
          gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          samenvatting: `${spelerNaam} verplaatst van ${vanTeamNaam} naar ${doelTeam.naam}`,
        };
      },
    },

    spelerStatusZetten: {
      description: "Zet de status van een speler (bijv. TWIJFELT, GAAT_STOPPEN, BESCHIKBAAR).",
      parameters: z.object({
        spelerId: z.string().describe("ID van de speler"),
        status: z
          .enum([
            "BESCHIKBAAR",
            "TWIJFELT",
            "GAAT_STOPPEN",
            "NIEUW_POTENTIEEL",
            "NIEUW_DEFINITIEF",
            "ALGEMEEN_RESERVE",
          ])
          .describe("Nieuwe status"),
      }),
      execute: async ({ spelerId, status }: { spelerId: string; status: string }) => {
        const speler = await prisma.speler.findUnique({
          where: { id: spelerId },
          select: { roepnaam: true, achternaam: true, status: true },
        });
        if (!speler) return { fout: `Speler ${spelerId} niet gevonden` };

        const oudeStatus = speler.status;
        await prisma.speler.update({ where: { id: spelerId }, data: { status } });

        await logDaisyActie({
          sessieId,
          tool: "spelerStatusZetten",
          doPayload: {
            spelerId,
            spelerNaam: `${speler.roepnaam} ${speler.achternaam}`,
            status,
          },
          undoPayload: { spelerId, status: oudeStatus },
          gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          samenvatting: `Status van ${speler.roepnaam} ${speler.achternaam} gezet op ${status}`,
        };
      },
    },

    spelerNotitieZetten: {
      description: "Schrijft of overschrijft de notitie op een speler.",
      parameters: z.object({
        spelerId: z.string().describe("ID van de speler"),
        notitie: z.string().describe("Nieuwe notitie (max 500 tekens)"),
      }),
      execute: async ({ spelerId, notitie }: { spelerId: string; notitie: string }) => {
        const speler = await prisma.speler.findUnique({
          where: { id: spelerId },
          select: { roepnaam: true, achternaam: true, notitie: true },
        });
        if (!speler) return { fout: `Speler ${spelerId} niet gevonden` };

        const oudeNotitie = speler.notitie ?? null;
        await prisma.speler.update({
          where: { id: spelerId },
          data: { notitie: notitie.slice(0, 500) },
        });

        await logDaisyActie({
          sessieId,
          tool: "spelerNotitieZetten",
          doPayload: {
            spelerId,
            spelerNaam: `${speler.roepnaam} ${speler.achternaam}`,
            notitie,
          },
          undoPayload: { spelerId, notitie: oudeNotitie },
          gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          samenvatting: `Notitie op ${speler.roepnaam} ${speler.achternaam} bijgewerkt`,
        };
      },
    },

    nieuwLidInBlauwdruk: {
      description:
        "Maakt een nieuw verwacht lid aan in de blauwdruk (iemand die nog niet in het systeem staat).",
      parameters: z.object({
        naam: z.string().describe("Volledige naam van het nieuwe lid"),
        geslacht: z.enum(["M", "V"]).describe("Geslacht"),
        geboortejaar: z.number().int().min(2000).max(2030).describe("Geboortejaar"),
      }),
      execute: async ({
        naam,
        geslacht,
        geboortejaar,
      }: {
        naam: string;
        geslacht: "M" | "V";
        geboortejaar: number;
      }) => {
        const delen = naam.trim().split(" ");
        const roepnaam = delen[0] ?? naam;
        const achternaam = delen.slice(1).join(" ") || roepnaam;

        const nieuweId = `NIEUW-${Date.now()}`;
        await prisma.speler.create({
          data: {
            id: nieuweId,
            roepnaam,
            achternaam,
            geslacht,
            geboortejaar,
            status: "NIEUW_POTENTIEEL",
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "nieuwLidInBlauwdruk",
          doPayload: { spelerId: nieuweId, naam, geslacht, geboortejaar },
          undoPayload: { spelerId: nieuweId },
          gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          spelerId: nieuweId,
          samenvatting: `Nieuw lid "${naam}" aangemaakt met id ${nieuweId}`,
        };
      },
    },

    plaatsreserveringZetten: {
      description:
        "Plaatst een naamloze of benoemde placeholder in een team (bijv. 'verwacht: Robin').",
      parameters: z.object({
        teamNaam: z.string().describe("Naam van het team"),
        naam: z.string().describe("Naam voor de placeholder, bijv. 'Verwacht lid'"),
        geslacht: z.enum(["M", "V"]).optional().describe("Optioneel geslacht van de placeholder"),
        inContext: z.string().describe('"werkindeling" of een scenarioId'),
      }),
      execute: async ({
        teamNaam,
        naam,
        geslacht,
        inContext,
      }: {
        teamNaam: string;
        naam: string;
        geslacht?: "M" | "V";
        inContext: string;
      }) => {
        let versieId: string;
        if (inContext === "werkindeling") {
          const blauwdruk = await getWerkBlauwdruk();
          if (!blauwdruk) return { fout: "Geen actieve werkindeling" };
          const wi = await prisma.scenario.findFirst({
            where: { concept: { blauwdrukId: blauwdruk.id }, isWerkindeling: true },
          });
          const v = wi ? await getLaatsteVersie(wi.id) : null;
          if (!v) return { fout: "Geen versie in werkindeling" };
          versieId = v.id;
        } else {
          const v = await getLaatsteVersie(inContext);
          if (!v) return { fout: "Scenario niet gevonden" };
          versieId = v.id;
        }

        const team = await prisma.team.findFirst({
          where: { versieId, naam: { contains: teamNaam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!team) return { fout: `Team "${teamNaam}" niet gevonden` };

        const reservering = await prisma.plaatsreservering.create({
          data: { teamId: team.id, naam, geslacht: geslacht ?? null },
        });

        await logDaisyActie({
          sessieId,
          tool: "plaatsreserveringZetten",
          doPayload: { reserveringId: reservering.id, team: team.naam, naam, geslacht },
          undoPayload: { reserveringId: reservering.id },
          gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          samenvatting: `Plaatsreservering "${naam}" aangemaakt in ${team.naam}`,
        };
      },
    },

    besluitVastleggen: {
      description:
        "Legt een besluit vast namens een TC-lid als werkitem van type BESLUIT. Vereist altijd een 'namens' attribuering.",
      parameters: z.object({
        besluit: z.string().describe("Tekst van het besluit"),
        namens: z.string().describe("Naam of e-mail van het TC-lid dat het besluit nam"),
      }),
      execute: async ({ besluit, namens }: { besluit: string; namens: string }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        // Zoek of maak de user
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { naam: { contains: namens, mode: "insensitive" } },
              { email: { contains: namens, mode: "insensitive" } },
            ],
          },
          select: { id: true, naam: true },
        });

        if (!user) {
          // Gebruik de Daisy-gebruiker als fallback auteur, maar log namens in doPayload
          user = await prisma.user.findFirst({
            where: { email: gebruikerEmail },
            select: { id: true, naam: true },
          });
        }
        if (!user) return { fout: "Kon geen gebruiker vinden voor auteurId" };

        const werkitem = await prisma.werkitem.create({
          data: {
            blauwdrukId: blauwdruk.id,
            titel: `Besluit: ${besluit.slice(0, 80)}`,
            beschrijving: besluit,
            type: "BESLUIT",
            status: "OPGELOST",
            resolutie: besluit,
            opgelostOp: new Date(),
            auteurId: user.id,
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "besluitVastleggen",
          doPayload: { werkitemId: werkitem.id, besluit, namens },
          undoPayload: { werkitemId: werkitem.id },
          namens,
          gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          samenvatting: `Besluit vastgelegd namens ${namens}: "${besluit.slice(0, 60)}…"`,
        };
      },
    },
  };
}
```

- [ ] **Stap 2: Update de `getTiStudioTools` export**

Vervang de laatste export:

```typescript
export function getTiStudioTools(sessieId: string, gebruikerEmail: string) {
  return {
    ...leesTools,
    ...maakSchrijfToolsSpelers(sessieId, gebruikerEmail),
  };
}
```

- [ ] **Stap 3: Build controleren**

```bash
pnpm build 2>&1 | tail -5
```

Verwacht: build slaagt

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/lib/ai/plugins/ti-studio.ts
git commit -m "feat(daisy): schrijf-tools spelers — verplaatsen, status, notitie, nieuwLid, plaatsreservering, besluit"
```

---

## Task 6: Schrijf-tools teams & staf + werkbord & scenario (5 tools)

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts`

- [ ] **Stap 1: Voeg schrijf-tools voor teams, staf, werkbord en scenario toe**

Voeg toe na `maakSchrijfToolsSpelers`, vóór `export function getTiStudioTools`:

```typescript
function maakSchrijfToolsRest(sessieId: string, gebruikerEmail: string) {
  return {
    teamAanmaken: {
      description: "Maakt een nieuw team aan in een scenario.",
      parameters: z.object({
        naam: z.string().describe("Naam van het nieuwe team"),
        categorie: z
          .enum([
            "SENIOREN",
            "JEUGD_A",
            "JEUGD_B",
            "RECREANTEN",
            "MIXED",
          ])
          .describe("Teamcategorie"),
        inContext: z.string().describe("scenarioId om het team in aan te maken"),
      }),
      execute: async ({
        naam,
        categorie,
        inContext,
      }: {
        naam: string;
        categorie: string;
        inContext: string;
      }) => {
        const versie = await getLaatsteVersie(inContext);
        if (!versie) return { fout: "Scenario niet gevonden" };

        const team = await prisma.team.create({
          data: {
            versieId: versie.id,
            naam,
            categorie,
            volgorde: 99,
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "teamAanmaken",
          doPayload: { teamId: team.id, naam, categorie },
          undoPayload: { teamId: team.id },
          gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return { gedaan: true, teamId: team.id, samenvatting: `Team "${naam}" aangemaakt` };
      },
    },

    selectieAanmaken: {
      description:
        "Maakt een selectiegroep aan en koppelt spelers. Gebruik voor U15/U19 selecties.",
      parameters: z.object({
        naam: z.string().describe("Naam van de selectiegroep"),
        spelerIds: z.array(z.string()).describe("Lijst van speler-IDs"),
        inContext: z.string().describe("scenarioId"),
      }),
      execute: async ({
        naam,
        spelerIds,
        inContext,
      }: {
        naam: string;
        spelerIds: string[];
        inContext: string;
      }) => {
        const versie = await getLaatsteVersie(inContext);
        if (!versie) return { fout: "Scenario niet gevonden" };

        const groep = await prisma.selectieGroep.create({
          data: {
            versieId: versie.id,
            naam,
            spelers: {
              create: spelerIds.map((spelerId) => ({ spelerId })),
            },
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "selectieAanmaken",
          doPayload: { groepId: groep.id, naam, spelerIds },
          undoPayload: { groepId: groep.id },
          gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          groepId: groep.id,
          samenvatting: `Selectiegroep "${naam}" aangemaakt met ${spelerIds.length} spelers`,
        };
      },
    },

    stafPlaatsen: {
      description: "Wijst een stafmedewerker toe aan een team in een scenario of werkindeling.",
      parameters: z.object({
        stafNaam: z.string().describe("Naam van de stafmedewerker (gedeeltelijk)"),
        rol: z.string().describe('Rol, bijv. "Trainer/Coach", "Assistent", "Begeleider"'),
        teamNaam: z.string().describe("Naam van het doelteam"),
        inContext: z.string().describe('"werkindeling" of een scenarioId'),
      }),
      execute: async ({
        stafNaam,
        rol,
        teamNaam,
        inContext,
      }: {
        stafNaam: string;
        rol: string;
        teamNaam: string;
        inContext: string;
      }) => {
        let versieId: string;
        if (inContext === "werkindeling") {
          const blauwdruk = await getWerkBlauwdruk();
          if (!blauwdruk) return { fout: "Geen actieve werkindeling" };
          const wi = await prisma.scenario.findFirst({
            where: { concept: { blauwdrukId: blauwdruk.id }, isWerkindeling: true },
          });
          const v = wi ? await getLaatsteVersie(wi.id) : null;
          if (!v) return { fout: "Geen versie in werkindeling" };
          versieId = v.id;
        } else {
          const v = await getLaatsteVersie(inContext);
          if (!v) return { fout: "Scenario niet gevonden" };
          versieId = v.id;
        }

        const staf = await prisma.staf.findFirst({
          where: { naam: { contains: stafNaam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!staf) return { fout: `Stafmedewerker "${stafNaam}" niet gevonden` };

        const team = await prisma.team.findFirst({
          where: { versieId, naam: { contains: teamNaam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!team) return { fout: `Team "${teamNaam}" niet gevonden` };

        const bestaand = await prisma.teamStaf.findFirst({
          where: { teamId: team.id, stafId: staf.id },
          select: { id: true },
        });

        if (bestaand) {
          await prisma.teamStaf.update({
            where: { id: bestaand.id },
            data: { rol },
          });
        } else {
          await prisma.teamStaf.create({
            data: { teamId: team.id, stafId: staf.id, rol },
          });
        }

        await logDaisyActie({
          sessieId,
          tool: "stafPlaatsen",
          doPayload: { stafId: staf.id, stafNaam: staf.naam, teamId: team.id, rol },
          undoPayload: {
            stafId: staf.id,
            teamId: team.id,
            bestaandId: bestaand?.id ?? null,
          },
          gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          samenvatting: `${staf.naam} geplaatst als ${rol} bij ${team.naam}`,
        };
      },
    },

    whatIfScenarioAanmaken: {
      description:
        "Maakt een kopie van de werkindeling als nieuw what-if scenario, klaar als speelruimte.",
      parameters: z.object({
        naam: z.string().describe("Naam voor het nieuwe scenario"),
      }),
      execute: async ({ naam }: { naam: string }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        // Zoek werkindeling concept
        const concept = await prisma.concept.findFirst({
          where: { blauwdrukId: blauwdruk.id },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        });
        if (!concept) return { fout: "Geen concept gevonden in blauwdruk" };

        // Maak het scenario aan
        const scenario = await prisma.scenario.create({
          data: {
            conceptId: concept.id,
            naam,
            status: "ACTIEF",
            isWerkindeling: false,
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "whatIfScenarioAanmaken",
          doPayload: { scenarioId: scenario.id, naam },
          undoPayload: { scenarioId: scenario.id },
          gebruikerEmail,
          uitgevoerdIn: `scenario:${scenario.id}`,
        });

        return {
          gedaan: true,
          scenarioId: scenario.id,
          samenvatting: `What-if scenario "${naam}" aangemaakt`,
        };
      },
    },

    actiePlaatsen: {
      description: "Plaatst een actiepunt/werkitem op het werkbord.",
      parameters: z.object({
        titel: z.string().describe("Korte titel van de actie"),
        beschrijving: z.string().optional().describe("Optionele uitleg"),
        toegewezenAan: z
          .string()
          .optional()
          .describe("Naam of e-mail van de persoon waaraan de actie is toegewezen"),
      }),
      execute: async ({
        titel,
        beschrijving,
        toegewezenAan,
      }: {
        titel: string;
        beschrijving?: string;
        toegewezenAan?: string;
      }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        const user = await prisma.user.findFirst({
          where: { email: gebruikerEmail },
          select: { id: true },
        });
        if (!user) return { fout: "Gebruiker niet gevonden" };

        const werkitem = await prisma.werkitem.create({
          data: {
            blauwdrukId: blauwdruk.id,
            titel,
            beschrijving: beschrijving ?? "",
            type: "STRATEGISCH",
            status: "OPEN",
            auteurId: user.id,
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "actiePlaatsen",
          doPayload: { werkitemId: werkitem.id, titel, toegewezenAan },
          undoPayload: { werkitemId: werkitem.id },
          gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          werkitemId: werkitem.id,
          samenvatting: `Actie "${titel}" aangemaakt op het werkbord`,
        };
      },
    },
  };
}
```

- [ ] **Stap 2: Update de `getTiStudioTools` export**

```typescript
export function getTiStudioTools(sessieId: string, gebruikerEmail: string) {
  return {
    ...leesTools,
    ...maakSchrijfToolsSpelers(sessieId, gebruikerEmail),
    ...maakSchrijfToolsRest(sessieId, gebruikerEmail),
  };
}
```

- [ ] **Stap 3: Build controleren**

```bash
pnpm build 2>&1 | tail -5
```

Verwacht: build slaagt

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/lib/ai/plugins/ti-studio.ts
git commit -m "feat(daisy): schrijf-tools teams, staf, werkbord, scenario"
```

---

## Task 7: Undo-tools (2 tools)

**Files:**
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts`

- [ ] **Stap 1: Voeg undo-dispatch toe aan `daisy-acties.ts`**

Voeg toe aan `apps/web/src/lib/ai/daisy-acties.ts`:

```typescript
/**
 * Voer een undo uit op basis van het undoPayload van een actie.
 * Roept de juiste database-operatie aan.
 */
export async function voerUndoUit(actie: DaisyActieRecord): Promise<string> {
  const payload = actie.undoPayload as Record<string, any>;

  switch (actie.tool) {
    case "spelerVerplaatsen": {
      const { spelerId, vanTeamId, naarTeamId, versieId } = payload;
      await prisma.$transaction(async (tx: any) => {
        await tx.teamSpeler.deleteMany({ where: { spelerId, team: { versieId } } });
        if (naarTeamId) {
          await tx.teamSpeler.create({ data: { teamId: naarTeamId, spelerId } });
        }
      });
      return `Speler teruggeplaatst`;
    }

    case "spelerStatusZetten": {
      const { spelerId, status } = payload;
      await prisma.speler.update({ where: { id: spelerId }, data: { status } });
      return `Status hersteld naar ${status}`;
    }

    case "spelerNotitieZetten": {
      const { spelerId, notitie } = payload;
      await prisma.speler.update({
        where: { id: spelerId },
        data: { notitie: notitie ?? null },
      });
      return `Notitie hersteld`;
    }

    case "nieuwLidInBlauwdruk": {
      const { spelerId } = payload;
      await prisma.speler.delete({ where: { id: spelerId } });
      return `Nieuw lid "${spelerId}" verwijderd`;
    }

    case "plaatsreserveringZetten": {
      const { reserveringId } = payload;
      await prisma.plaatsreservering.delete({ where: { id: reserveringId } });
      return `Plaatsreservering verwijderd`;
    }

    case "besluitVastleggen":
    case "actiePlaatsen": {
      const { werkitemId } = payload;
      await prisma.werkitem.delete({ where: { id: werkitemId } });
      return `Werkitem verwijderd`;
    }

    case "teamAanmaken": {
      const { teamId } = payload;
      const spelerCount = await prisma.teamSpeler.count({ where: { teamId } });
      if (spelerCount > 0) {
        return `Kan team niet verwijderen: bevat al ${spelerCount} spelers. Verwijder handmatig.`;
      }
      await prisma.team.delete({ where: { id: teamId } });
      return `Team verwijderd`;
    }

    case "selectieAanmaken": {
      const { groepId } = payload;
      await prisma.selectieGroep.delete({ where: { id: groepId } });
      return `Selectiegroep verwijderd`;
    }

    case "stafPlaatsen": {
      const { stafId, teamId, bestaandId } = payload;
      if (bestaandId) {
        // Was een update — herstel is: verwijder de nieuwe toewijzing
        await prisma.teamStaf.deleteMany({ where: { teamId, stafId } });
      } else {
        await prisma.teamStaf.deleteMany({ where: { teamId, stafId } });
      }
      return `Staaftoewijzing verwijderd`;
    }

    case "whatIfScenarioAanmaken": {
      const { scenarioId } = payload;
      const teamCount = await prisma.team.count({
        where: { versie: { scenarioId } },
      });
      if (teamCount > 0) {
        return `Kan scenario niet verwijderen: bevat al ${teamCount} teams. Verwijder handmatig in TI-studio.`;
      }
      await prisma.scenario.delete({ where: { id: scenarioId } });
      return `Scenario verwijderd`;
    }

    default:
      return `Undo niet geïmplementeerd voor tool "${actie.tool}"`;
  }
}
```

- [ ] **Stap 2: Voeg undo-tools toe aan `ti-studio.ts`**

Voeg toe vóór `export function getTiStudioTools`:

```typescript
function maakUndoTools(sessieId: string) {
  return {
    actieOngedaanMaken: {
      description:
        "Maakt de laatste Daisy-actie ongedaan (of een specifieke actie op basis van ID).",
      parameters: z.object({
        actieId: z
          .string()
          .optional()
          .describe("Optioneel: ID van een specifieke actie. Zonder ID: laatste actie."),
      }),
      execute: async ({ actieId }: { actieId?: string }) => {
        let actie;
        if (actieId) {
          actie = await getDaisyActie(actieId);
        } else {
          const acties = await getDaisyActies(sessieId, 1);
          actie = acties[0] ?? null;
        }

        if (!actie) return { fout: "Geen actie gevonden om ongedaan te maken" };
        if (actie.ongedaan) return { fout: "Deze actie is al ongedaan gemaakt" };

        const resultaat = await voerUndoUit(actie);
        await markeerOngedaan(actie.id);

        return {
          gedaan: true,
          samenvatting: `Actie "${actie.tool}" ongedaan gemaakt: ${resultaat}`,
        };
      },
    },

    sessieTerugdraaien: {
      description:
        "Draait alle Daisy-acties van de huidige chat-sessie terug in omgekeerde volgorde.",
      parameters: z.object({}),
      execute: async () => {
        const acties = await getDaisyActies(sessieId, 100);
        if (acties.length === 0) return { samenvatting: "Geen acties te herstellen in deze sessie" };

        const resultaten: string[] = [];
        for (const actie of acties) {
          const resultaat = await voerUndoUit(actie);
          await markeerOngedaan(actie.id);
          resultaten.push(`• ${actie.tool}: ${resultaat}`);
        }

        return {
          gedaan: true,
          aantalHersteld: acties.length,
          samenvatting: `${acties.length} acties teruggedraaid:\n${resultaten.join("\n")}`,
        };
      },
    },
  };
}
```

- [ ] **Stap 3: Voeg import toe aan `ti-studio.ts`**

Voeg toe aan de imports bovenaan `ti-studio.ts`:

```typescript
import { voerUndoUit } from "@/lib/ai/daisy-acties";
```

- [ ] **Stap 4: Update de `getTiStudioTools` export**

```typescript
export function getTiStudioTools(sessieId: string, gebruikerEmail: string) {
  return {
    ...leesTools,
    ...maakSchrijfToolsSpelers(sessieId, gebruikerEmail),
    ...maakSchrijfToolsRest(sessieId, gebruikerEmail),
    ...maakUndoTools(sessieId),
  };
}
```

- [ ] **Stap 5: Build controleren**

```bash
pnpm build 2>&1 | tail -5
```

Verwacht: build slaagt

- [ ] **Stap 6: Commit**

```bash
git add apps/web/src/lib/ai/plugins/ti-studio.ts apps/web/src/lib/ai/daisy-acties.ts
git commit -m "feat(daisy): undo-tools — actieOngedaanMaken + sessieTerugdraaien"
```

---

## Task 8: Systeem-prompt uitbreiden

**Files:**
- Modify: `apps/web/src/lib/ai/daisy.ts`

- [ ] **Stap 1: Voeg TI-tools instructie toe aan de systeem-prompt**

In `apps/web/src/lib/ai/daisy.ts`, vervang de laatste regel van de `return` string:

```typescript
- Als je tools hebt, gebruik ze actief om vragen te beantwoorden met echte data`;
```

door:

```typescript
- Als je tools hebt, gebruik ze actief om vragen te beantwoorden met echte data

## TI-studio tools
Je hebt 17 tools voor de teamindeling. Voor elke schrijf-actie geldt:
1. Kondig precies aan wat je gaat doen (namen, teams, actie)
2. Wacht op bevestiging
3. Voer pas daarna uit via de tool
4. Meld: "Gedaan. [samenvatting]. Je kunt dit terugdraaien met 'maak ongedaan'."

Bij meerdere stappen: toon een genummerd plan en vraag of de TC wil doorgaan.

Kun je iets niet uitvoeren? Zeg: "Dit kan ik niet uitvoeren." en voeg toe waar de gebruiker het zelf kan doen als je dat weet.

besluitVastleggen: vraag altijd "Namens wie leg ik dit vast?" als het niet uit de context blijkt.`;
```

- [ ] **Stap 2: Build + tests**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -10
```

Verwacht: build slaagt, alle tests groen

- [ ] **Stap 3: Commit + push**

```bash
git add apps/web/src/lib/ai/daisy.ts
git commit -m "feat(daisy): systeem-prompt uitbreiden met TI-studio gedragsregels"
git push origin main
```

- [ ] **Stap 4: Wacht op CI**

```bash
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') 2>&1 | tail -3
```

Verwacht: quality ✓, build ✓, e2e ✓, deploy ✓

---

## Self-review checklist (voor agentic workers)

Na het uitvoeren van alle tasks:

- [ ] Alle 17 tools aanwezig in `ti-studio.ts`? (4 lees + 6 spelers + 3 teams/staf + 2 werkbord + 2 undo)
- [ ] Elke schrijf-tool logt een `DaisyActie`?
- [ ] Elke `logDaisyActie` call heeft een `undoPayload` die door `voerUndoUit` afgehandeld wordt?
- [ ] `besluitVastleggen` gebruikt altijd `namens`-parameter?
- [ ] `getTiStudioTools` geeft alle vier groepen terug?
- [ ] Registry-signature klopt: `getDaisyTools(context: DaisyContext)`?
- [ ] Chat route geeft `sessieId` + `gebruikerEmail` door?
- [ ] Build slaagt?
- [ ] CI groen?
