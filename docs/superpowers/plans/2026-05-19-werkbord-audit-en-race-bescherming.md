# Werkbord Audit-Trail + Race-Condition Bescherming — Implementation Plan

> **Voor agentic workers:** REQUIRED SUB-SKILL: Gebruik `superpowers:subagent-driven-development` (aanbevolen) of `superpowers:executing-plans` om dit plan taak-voor-taak uit te voeren. Stappen gebruiken checkbox (`- [ ]`) syntax voor tracking.

**Goal:** Voorkomen dat werkbord-mutaties stilletjes verdwijnen (zoals Tycho de Koning op 2026-05-18) door (1) elke schrijfactie op de werkindeling forensisch te loggen en (2) parallelle sessies te detecteren met compare-and-swap op de huidige speler-locatie.

**Architecture:** Nieuwe `WerkbordMutatie` tabel die elke schrijfactie van API-route, server-actions én speler-aanmaak vastlegt met `doorId`, `sessionId`, `payload`, `inverse`. Compare-and-swap door client de "verwachte huidige locatie" mee te sturen — server vergelijkt en geeft 409 met de werkelijke state als ze afwijken. Geen optimistic-locking refactor van het hele schema, alleen op de speler-koppel-paden waar het misgaat.

**Tech Stack:** Prisma 7.x (migratie) · TypeScript strict · Next.js 16 server-actions + API routes · Vitest unit tests · Playwright E2E · pnpm workspace

**Bron-incident:** [scripts/herstel/](scripts/herstel/) bevat geen herstelscript voor dit type incident omdat er **geen audit-spoor** is. `LogEntry` en `Activiteit` op productie staan op 0 records. Tycho's koppeling is verloren — alleen de `Speler`-record bleef bestaan (id `HANDMATIG-cb5a6e89bd374005bb90434521b470b5`). Zie chat-transcript 2026-05-19.

**Referenties:**
- Schema: [packages/database/prisma/schema.prisma:463-493](packages/database/prisma/schema.prisma#L463-L493) (Speler), [:847-873](packages/database/prisma/schema.prisma#L847-L873) (SelectieSpeler/SelectieStaf), [:906-919](packages/database/prisma/schema.prisma#L906-L919) (TeamSpeler)
- Werkbord-API: [apps/ti-studio/src/app/api/indeling/[versieId]/route.ts](apps/ti-studio/src/app/api/indeling/%5BversieId%5D/route.ts)
- Server-actions: [apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.ts:472-557](apps/ti-studio/src/app/%28protected%29/indeling/werkindeling-actions.ts#L472-L557)
- Speler-edit: [apps/ti-studio/src/app/(protected)/personen/speler-edit-actions.ts:170-213](apps/ti-studio/src/app/%28protected%29/personen/speler-edit-actions.ts#L170-L213)
- Handmatig aanmaken: [apps/ti-studio/src/app/(protected)/personen/actions.ts:181-204](apps/ti-studio/src/app/%28protected%29/personen/actions.ts#L181-L204)
- Auth: [packages/auth/src/checks.ts](packages/auth/src/checks.ts) — `requireTC()` / `guardTC()`
- Migratie-conventies: [packages/database/MIGRATIE.md](packages/database/MIGRATIE.md)

---

## File Structure

| Bestand | Aard | Verantwoordelijkheid |
|---|---|---|
| `packages/database/prisma/schema.prisma` | Modify | Nieuw `WerkbordMutatie` model + inverse relaties op `Versie`, `Speler`, `User` |
| `packages/database/prisma/migrations/YYYYMMDD_werkbord_mutatie/migration.sql` | Nieuw | Migratie (door `prisma migrate dev` gegenereerd) |
| `apps/ti-studio/src/lib/teamindeling/audit/log-werkbord-mutatie.ts` | Nieuw | `logWerkbordMutatie()` helper — schrijft één row, gooit nooit |
| `apps/ti-studio/src/lib/teamindeling/audit/log-werkbord-mutatie.test.ts` | Nieuw | Unit-test helper (mock prisma) |
| `apps/ti-studio/src/lib/teamindeling/audit/types.ts` | Nieuw | `WerkbordMutatieType` discriminated union + Zod-schema's |
| `apps/ti-studio/src/lib/teamindeling/audit/huidige-locatie.ts` | Nieuw | `bepaalHuidigeLocatie()` + `vergelijkLocatie()` voor compare-and-swap |
| `apps/ti-studio/src/lib/teamindeling/audit/huidige-locatie.test.ts` | Nieuw | Unit-test compare-and-swap |
| `apps/ti-studio/src/app/api/indeling/[versieId]/route.ts` | Modify | Instrumenteer 3 event-types + compare-and-swap check (409 bij mismatch) |
| `apps/ti-studio/src/app/api/indeling/[versieId]/route.test.ts` | Nieuw | Integratie-test alle 3 event-types loggen + 409 bij mismatch |
| `apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.ts` | Modify | Instrumenteer `voegSelectieSpelerToe`, `verwijderSelectieSpeler`, `toggleSelectieBundeling` |
| `apps/ti-studio/src/app/(protected)/personen/speler-edit-actions.ts` | Modify | Instrumenteer `zetSpelerIndeling` + compare-and-swap |
| `apps/ti-studio/src/app/(protected)/personen/actions.ts` | Modify | Instrumenteer `maakHandmatigeSpeler` (audit alleen) |
| `apps/ti-studio/src/app/api/indeling/[versieId]/audit/route.ts` | Nieuw | Read-only GET — laatste N mutaties van een versie |
| `apps/ti-studio/src/components/werkbord/hooks/useWerkbordState.ts` | Modify | Stuur `huidigeLocatie` mee bij elke mutatie; handle 409 met toast + refresh |
| `apps/ti-studio/src/components/werkbord/ConflictToast.tsx` | Nieuw | Toast-component "Antjan heeft Tycho in Senioren 2 gezet — werkbord ververst" |

**Splitsing-rationale:** audit-helper en huidige-locatie zijn aparte, pure modules met eigen testbestanden. Server-actions worden in-place geïnstrumenteerd (geen wrappers). Conflict-UI is één toast-component.

**Niet in scope (bewust):**
- Volledige optimistic locking met revisie-nummers op SelectieGroep/Team (te grote refactor, YAGNI)
- Hard locks ("Antjan is bezig, je kunt niet bewerken") (slechte UX voor TC die parallel werken)
- Daisy-tool-mutaties auditen (komt later; Daisy logt al via `agent_mutaties`)

---

## Fase 1 — Audit-trail voor werkbord-mutaties

### Task 1: Schema + migratie voor `WerkbordMutatie`

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/<timestamp>_werkbord_mutatie/migration.sql`

- [ ] **Step 1: Voeg model toe aan schema**

Voeg toe in `packages/database/prisma/schema.prisma` (vlak na model `AgentMutatie`):

```prisma
model WerkbordMutatie {
  id              String   @id @default(cuid())
  versie          Versie   @relation(fields: [versieId], references: [id], onDelete: Cascade)
  versieId        String

  // Discriminator + payload
  type            String   // "speler_verplaatst" | "speler_naar_pool" | "team_positie" | "selectie_speler_toegevoegd" | "selectie_speler_verwijderd" | "selectie_bundeling_toggle" | "speler_indeling_gezet" | "speler_handmatig_aangemaakt"
  payload         Json     // Volledige request-payload na auth+parse
  inverse         Json?    // Hoe deze actie ongedaan te maken (optioneel — alleen bij koppelacties)

  // Subject (waar mogelijk)
  speler          Speler?  @relation(fields: [spelerId], references: [id], onDelete: SetNull)
  spelerId        String?
  vanTeamId       String?
  naarTeamId      String?
  selectieGroepId String?

  // Door wie
  door            User     @relation(fields: [doorId], references: [id])
  doorId          String
  sessionId       String?  // Browser-sessie-id (al in werkbord-events aanwezig)

  createdAt       DateTime @default(now())

  @@index([versieId, createdAt])
  @@index([spelerId, createdAt])
  @@index([doorId, createdAt])
  @@map("werkbord_mutaties")
}
```

Voeg inverse relatie toe op `model Versie` (zoek naar `model Versie {` rond regel 770):

```prisma
  // ─── Audit
  werkbordMutaties WerkbordMutatie[]
```

Voeg inverse relatie toe op `model Speler` (na bestaande `evaluaties`-rij):

```prisma
  werkbordMutaties WerkbordMutatie[]
```

Voeg inverse relatie toe op `model User` (na bestaande `gezienMarkeringen`-rij):

```prisma
  werkbordMutaties WerkbordMutatie[]
```

- [ ] **Step 2: Genereer migratie**

Run vanuit `packages/database/`:

```bash
pnpm prisma migrate dev --name werkbord_mutatie --create-only
```

Expected: nieuwe map `migrations/<timestamp>_werkbord_mutatie/migration.sql` met CREATE TABLE + 3 indexes + FK's.

- [ ] **Step 3: Inspecteer migratie-SQL handmatig**

Open de gegenereerde `migration.sql` en controleer:
- `CREATE TABLE "werkbord_mutaties"` aanwezig
- FK's: `versieId → "Versie".id ON DELETE CASCADE`, `spelerId → "Speler".id ON DELETE SET NULL`, `doorId → "User".id`
- 3 indexes aanwezig
- Géén `DROP VIEW speler_seizoenen` regel (kritiek — als die er staat, breek af en debug)

- [ ] **Step 4: Pas migratie toe lokaal**

```bash
pnpm db:migrate
pnpm db:generate
```

Expected: migratie ge-deployed, geen errors.

- [ ] **Step 5: Verifieer in DB**

```bash
PROD_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-) && DATABASE_URL="$PROD_URL" pnpm tsx -e 'import { prisma } from "./packages/database/src/index"; const r = await prisma.$queryRaw`SELECT COUNT(*) FROM werkbord_mutaties`; console.log(r); await prisma.$disconnect();'
```

Expected: `[ { count: 0n } ]` (tabel bestaat, leeg).

- [ ] **Step 6: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat(db): voeg WerkbordMutatie tabel toe voor audit-trail werkbord-acties

Vastlegt elke schrijfactie op werkindeling: speler-verplaatsing,
selectie-koppeling, handmatige speler-aanmaak. Voorkomt herhaling van
incident 2026-05-18 (Tycho de Koning) waar koppeling verloren ging
zonder forensisch spoor."
```

---

### Task 2: Helper `logWerkbordMutatie()`

**Files:**
- Create: `apps/ti-studio/src/lib/teamindeling/audit/types.ts`
- Create: `apps/ti-studio/src/lib/teamindeling/audit/log-werkbord-mutatie.ts`
- Test: `apps/ti-studio/src/lib/teamindeling/audit/log-werkbord-mutatie.test.ts`

- [ ] **Step 1: Schrijf types**

Maak `apps/ti-studio/src/lib/teamindeling/audit/types.ts`:

```typescript
import { z } from "zod";

export const WerkbordMutatieType = z.enum([
  "speler_verplaatst",
  "speler_naar_pool",
  "team_positie",
  "selectie_speler_toegevoegd",
  "selectie_speler_verwijderd",
  "selectie_bundeling_toggle",
  "speler_indeling_gezet",
  "speler_handmatig_aangemaakt",
]);
export type WerkbordMutatieType = z.infer<typeof WerkbordMutatieType>;

export interface LogInput {
  versieId: string;
  type: WerkbordMutatieType;
  doorId: string;
  payload: Record<string, unknown>;
  inverse?: Record<string, unknown> | null;
  spelerId?: string | null;
  vanTeamId?: string | null;
  naarTeamId?: string | null;
  selectieGroepId?: string | null;
  sessionId?: string | null;
}
```

- [ ] **Step 2: Schrijf de falende test eerst**

Maak `apps/ti-studio/src/lib/teamindeling/audit/log-werkbord-mutatie.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { werkbordMutatie: { create } },
}));

import { logWerkbordMutatie } from "./log-werkbord-mutatie";

describe("logWerkbordMutatie", () => {
  beforeEach(() => create.mockReset());

  it("schrijft een row met alle velden", async () => {
    create.mockResolvedValue({ id: "x" });
    await logWerkbordMutatie({
      versieId: "v1",
      type: "speler_verplaatst",
      doorId: "u1",
      spelerId: "HANDMATIG-tycho",
      vanTeamId: null,
      naarTeamId: "t-sen2",
      sessionId: "sess-1",
      payload: { type: "speler_verplaatst", spelerId: "HANDMATIG-tycho" },
    });
    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0];
    expect(arg.data.versieId).toBe("v1");
    expect(arg.data.type).toBe("speler_verplaatst");
    expect(arg.data.doorId).toBe("u1");
    expect(arg.data.spelerId).toBe("HANDMATIG-tycho");
    expect(arg.data.naarTeamId).toBe("t-sen2");
    expect(arg.data.sessionId).toBe("sess-1");
    expect(arg.data.payload).toEqual({ type: "speler_verplaatst", spelerId: "HANDMATIG-tycho" });
  });

  it("gooit niet als prisma faalt (audit mag nooit een mutatie blokkeren)", async () => {
    create.mockRejectedValue(new Error("DB weg"));
    await expect(
      logWerkbordMutatie({
        versieId: "v1",
        type: "speler_verplaatst",
        doorId: "u1",
        payload: {},
      })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test om te zien dat hij faalt**

```bash
pnpm --filter @oranje-wit/ti-studio test log-werkbord-mutatie
```

Expected: 2 tests falen met "Cannot find module './log-werkbord-mutatie'".

- [ ] **Step 4: Implementeer helper**

Maak `apps/ti-studio/src/lib/teamindeling/audit/log-werkbord-mutatie.ts`:

```typescript
import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { LogInput } from "./types";

export async function logWerkbordMutatie(input: LogInput): Promise<void> {
  try {
    await prisma.werkbordMutatie.create({
      data: {
        versieId: input.versieId,
        type: input.type,
        doorId: input.doorId,
        payload: input.payload as never,
        inverse: (input.inverse ?? null) as never,
        spelerId: input.spelerId ?? null,
        vanTeamId: input.vanTeamId ?? null,
        naarTeamId: input.naarTeamId ?? null,
        selectieGroepId: input.selectieGroepId ?? null,
        sessionId: input.sessionId ?? null,
      },
    });
  } catch (error) {
    logger.warn("logWerkbordMutatie kon niet opslaan:", error);
  }
}
```

- [ ] **Step 5: Run test om te zien dat hij slaagt**

```bash
pnpm --filter @oranje-wit/ti-studio test log-werkbord-mutatie
```

Expected: 2 tests slagen.

- [ ] **Step 6: Commit**

```bash
git add apps/ti-studio/src/lib/teamindeling/audit/
git commit -m "feat(ti-studio): audit-helper logWerkbordMutatie

Schrijft één row in WerkbordMutatie per mutatie, gooit nooit (audit mag
de mutatie zelf nooit blokkeren). 8 mutatie-types gedefinieerd."
```

---

### Task 3: Instrumenteer werkbord-API endpoint

**Files:**
- Modify: `apps/ti-studio/src/app/api/indeling/[versieId]/route.ts`
- Test: `apps/ti-studio/src/app/api/indeling/[versieId]/route.test.ts`

- [ ] **Step 1: Schrijf integratie-test (3 event types)**

Maak `apps/ti-studio/src/app/api/indeling/[versieId]/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const log = vi.fn();
vi.mock("@/lib/teamindeling/audit/log-werkbord-mutatie", () => ({
  logWerkbordMutatie: log,
}));
vi.mock("@oranje-wit/auth/checks", () => ({
  guardTC: vi.fn().mockResolvedValue({ ok: true, session: { user: { id: "u1", email: "antjan@x" } } }),
}));
vi.mock("@/lib/teamindeling/validatie-update", () => ({
  haalValidatieUpdate: vi.fn().mockResolvedValue({}),
}));

const tx = vi.fn().mockResolvedValue([]);
const upsert = vi.fn().mockResolvedValue({});
const update = vi.fn().mockResolvedValue({});
const findUniqueOrThrow = vi.fn().mockResolvedValue({ posities: {} });
const executeRaw = vi.fn().mockResolvedValue(0);

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    $transaction: tx,
    teamSpeler: { upsert },
    versie: { findUniqueOrThrow, update },
    $executeRaw: executeRaw,
  },
}));

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/indeling/[versieId]", () => {
  beforeEach(() => log.mockReset());

  it("logt speler_verplaatst", async () => {
    await POST(makeRequest({
      type: "speler_verplaatst", spelerId: "HANDMATIG-tycho", vanTeamId: null,
      naarTeamId: "t-sen2", naarGeslacht: "M", sessionId: "s1",
    }), { params: Promise.resolve({ versieId: "v1" }) });
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      versieId: "v1", type: "speler_verplaatst", doorId: "u1",
      spelerId: "HANDMATIG-tycho", naarTeamId: "t-sen2", sessionId: "s1",
    }));
  });

  it("logt speler_naar_pool", async () => {
    await POST(makeRequest({
      type: "speler_naar_pool", spelerId: "HANDMATIG-tycho",
      vanTeamId: "t-sen2", sessionId: "s1",
    }), { params: Promise.resolve({ versieId: "v1" }) });
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      type: "speler_naar_pool", spelerId: "HANDMATIG-tycho", vanTeamId: "t-sen2",
    }));
  });

  it("logt team_positie", async () => {
    await POST(makeRequest({
      type: "team_positie", teamId: "t-sen2", x: 100, y: 200, sessionId: "s1",
    }), { params: Promise.resolve({ versieId: "v1" }) });
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      type: "team_positie",
    }));
  });
});
```

- [ ] **Step 2: Run test om te zien dat hij faalt**

```bash
pnpm --filter @oranje-wit/ti-studio test route.test
```

Expected: 3 tests falen — `log` is niet aangeroepen.

- [ ] **Step 3: Instrumenteer route.ts**

Voeg toe aan `apps/ti-studio/src/app/api/indeling/[versieId]/route.ts` (na de bestaande imports):

```typescript
import { logWerkbordMutatie } from "@/lib/teamindeling/audit/log-werkbord-mutatie";
```

Vervang het bestaande `try { ... }` blok (vanaf regel 52 t/m de `return ok(...)`) door:

```typescript
  try {
    if (event.type === "speler_verplaatst") {
      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({
          where: { spelerId: event.spelerId, team: { versieId } },
        }),
        prisma.selectieSpeler.deleteMany({
          where: { spelerId: event.spelerId, selectieGroep: { versieId } },
        }),
      ]);
      await prisma.teamSpeler.upsert({
        where: {
          teamId_spelerId: { teamId: event.naarTeamId, spelerId: event.spelerId },
        },
        create: { teamId: event.naarTeamId, spelerId: event.spelerId },
        update: {},
      });
      await logWerkbordMutatie({
        versieId,
        type: "speler_verplaatst",
        doorId: auth.session.user.id,
        spelerId: event.spelerId,
        vanTeamId: event.vanTeamId,
        naarTeamId: event.naarTeamId,
        sessionId: event.sessionId,
        payload: event as unknown as Record<string, unknown>,
        inverse: event.vanTeamId
          ? { type: "speler_verplaatst", spelerId: event.spelerId, naarTeamId: event.vanTeamId }
          : { type: "speler_naar_pool", spelerId: event.spelerId, vanTeamId: event.naarTeamId },
      });
    } else if (event.type === "speler_naar_pool") {
      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({
          where: { spelerId: event.spelerId, team: { versieId } },
        }),
        prisma.selectieSpeler.deleteMany({
          where: { spelerId: event.spelerId, selectieGroep: { versieId } },
        }),
      ]);
      await logWerkbordMutatie({
        versieId,
        type: "speler_naar_pool",
        doorId: auth.session.user.id,
        spelerId: event.spelerId,
        vanTeamId: event.vanTeamId,
        sessionId: event.sessionId,
        payload: event as unknown as Record<string, unknown>,
        inverse: { type: "speler_verplaatst", spelerId: event.spelerId, naarTeamId: event.vanTeamId },
      });
    } else if (event.type === "team_positie") {
      const versie = await prisma.versie.findUniqueOrThrow({
        where: { id: versieId },
        select: { posities: true },
      });
      const posities = (versie.posities as Record<string, { x: number; y: number }>) ?? {};
      const oudePositie = posities[event.teamId] ?? null;
      posities[event.teamId] = { x: Math.round(event.x), y: Math.round(event.y) };
      await prisma.versie.update({ where: { id: versieId }, data: { posities } });
      await logWerkbordMutatie({
        versieId,
        type: "team_positie",
        doorId: auth.session.user.id,
        sessionId: event.sessionId,
        payload: event as unknown as Record<string, unknown>,
        inverse: oudePositie ? { type: "team_positie", teamId: event.teamId, ...oudePositie } : null,
      });
    }
```

(Behoud de bestaande `pg_notify` + `validatieUpdates` + `return ok` blokken erna ongewijzigd.)

**Let op:** `guardTC()` retourneert geen `user.id` standaard. Controleer in [packages/auth/src/checks.ts](packages/auth/src/checks.ts) of `auth.session.user.id` bestaat. Zo niet — vervang door `await prisma.user.findUniqueOrThrow({ where: { email: auth.session.user.email }, select: { id: true } })` boven het try-blok.

- [ ] **Step 4: Run tests om te zien dat ze slagen**

```bash
pnpm --filter @oranje-wit/ti-studio test route.test
```

Expected: 3 tests slagen.

- [ ] **Step 5: Commit**

```bash
git add apps/ti-studio/src/app/api/indeling/
git commit -m "feat(ti-studio): log werkbord-API mutaties naar WerkbordMutatie

speler_verplaatst, speler_naar_pool en team_positie krijgen elk een
audit-row met inverse (voor mogelijke undo). Logging gooit nooit, dus
mutatie zelf wordt niet geblokkeerd door DB-fout."
```

---

### Task 4: Instrumenteer selectie-server-actions

**Files:**
- Modify: `apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.ts`
- Modify: `apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.test.ts`

- [ ] **Step 1: Voeg test-cases toe**

Voeg toe aan de bestaande [werkindeling-actions.test.ts](apps/ti-studio/src/app/%28protected%29/indeling/werkindeling-actions.test.ts) een nieuwe `describe`-blok:

```typescript
describe("audit-trail", () => {
  const log = vi.fn();
  beforeEach(() => {
    vi.doMock("@/lib/teamindeling/audit/log-werkbord-mutatie", () => ({
      logWerkbordMutatie: log,
    }));
    log.mockReset();
  });

  it("voegSelectieSpelerToe logt selectie_speler_toegevoegd", async () => {
    // ... mock prisma findUniqueOrThrow + $transaction
    const { voegSelectieSpelerToe } = await import("./werkindeling-actions");
    await voegSelectieSpelerToe("sg-1", "HANDMATIG-tycho", "sess-1");
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      type: "selectie_speler_toegevoegd",
      selectieGroepId: "sg-1",
      spelerId: "HANDMATIG-tycho",
      sessionId: "sess-1",
    }));
  });

  it("verwijderSelectieSpeler logt selectie_speler_verwijderd met inverse", async () => {
    const { verwijderSelectieSpeler } = await import("./werkindeling-actions");
    await verwijderSelectieSpeler("sg-1", "HANDMATIG-tycho", "sess-1");
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      type: "selectie_speler_verwijderd",
      selectieGroepId: "sg-1",
      spelerId: "HANDMATIG-tycho",
      inverse: expect.objectContaining({
        type: "selectie_speler_toegevoegd",
        selectieGroepId: "sg-1",
        spelerId: "HANDMATIG-tycho",
      }),
    }));
  });
});
```

- [ ] **Step 2: Run test om te zien dat hij faalt**

```bash
pnpm --filter @oranje-wit/ti-studio test werkindeling-actions.test
```

Expected: nieuwe testcases falen — log niet aangeroepen.

- [ ] **Step 3: Helper voor `doorId` ophalen**

Voeg toe boven `notifyWerkbord` in `werkindeling-actions.ts`:

```typescript
import { logWerkbordMutatie } from "@/lib/teamindeling/audit/log-werkbord-mutatie";

async function huidigeUserId(): Promise<string> {
  const session = await import("@oranje-wit/auth").then((m) => m.auth());
  const email = session?.user?.email;
  if (!email) throw new Error("Geen sessie");
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });
  return user.id;
}
```

(Pas import-pad aan op basis van wat `packages/auth/src/index.ts` exporteert — als `auth()` direct beschikbaar is, gebruik die.)

- [ ] **Step 4: Instrumenteer `voegSelectieSpelerToe`**

In `voegSelectieSpelerToe` (rond regel 482), voeg toe vlak na de `notifyWerkbord(...)`-call (regel 522):

```typescript
    await logWerkbordMutatie({
      versieId,
      type: "selectie_speler_toegevoegd",
      doorId: await huidigeUserId(),
      spelerId,
      selectieGroepId,
      sessionId: sessionId ?? null,
      payload: { selectieGroepId, spelerId, sessionId },
      inverse: { type: "selectie_speler_verwijderd", selectieGroepId, spelerId },
    });
```

- [ ] **Step 5: Instrumenteer `verwijderSelectieSpeler`**

In `verwijderSelectieSpeler` (rond regel 531), voeg toe na de `notifyWerkbord(...)` binnen het if-blok:

```typescript
      await logWerkbordMutatie({
        versieId: selectieGroep.versieId,
        type: "selectie_speler_verwijderd",
        doorId: await huidigeUserId(),
        spelerId,
        selectieGroepId,
        sessionId: sessionId ?? null,
        payload: { selectieGroepId, spelerId, sessionId },
        inverse: { type: "selectie_speler_toegevoegd", selectieGroepId, spelerId },
      });
```

- [ ] **Step 6: Instrumenteer `toggleSelectieBundeling`**

In `toggleSelectieBundeling` (rond regel 559), voeg toe vlak vóór de `return { ok: true, ... }` aan het einde:

```typescript
    await logWerkbordMutatie({
      versieId: groepTeams[0] ? (await prisma.team.findUniqueOrThrow({
        where: { id: groepTeams[0].id }, select: { versieId: true },
      })).versieId : "",
      type: "selectie_bundeling_toggle",
      doorId: await huidigeUserId(),
      selectieGroepId,
      payload: {
        selectieGroepId, gebundeld, primaryTeamId,
        spelersVerplaatst, stafVerplaatst,
      },
    });
```

- [ ] **Step 7: Run tests**

```bash
pnpm --filter @oranje-wit/ti-studio test werkindeling-actions
```

Expected: alle tests slagen.

- [ ] **Step 8: Commit**

```bash
git add apps/ti-studio/src/app/\(protected\)/indeling/
git commit -m "feat(ti-studio): log selectie-acties naar WerkbordMutatie

voegSelectieSpelerToe, verwijderSelectieSpeler en toggleSelectieBundeling
schrijven elk een audit-row met inverse waar mogelijk."
```

---

### Task 5: Instrumenteer `zetSpelerIndeling` + `maakHandmatigeSpeler`

**Files:**
- Modify: `apps/ti-studio/src/app/(protected)/personen/speler-edit-actions.ts`
- Modify: `apps/ti-studio/src/app/(protected)/personen/actions.ts`

- [ ] **Step 1: Schrijf falende test voor `zetSpelerIndeling`**

Voeg toe aan (of maak nieuw) `apps/ti-studio/src/app/(protected)/personen/speler-edit-actions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const log = vi.fn();
vi.mock("@/lib/teamindeling/audit/log-werkbord-mutatie", () => ({
  logWerkbordMutatie: log,
}));

// Mocks voor requireTC en prisma — bestaande patroon volgen uit andere tests

describe("zetSpelerIndeling audit", () => {
  beforeEach(() => log.mockReset());

  it("logt speler_indeling_gezet bij koppeling aan selectie", async () => {
    const { zetSpelerIndeling } = await import("./speler-edit-actions");
    await zetSpelerIndeling("HANDMATIG-tycho", "v1", { type: "selectie", id: "sg-1" });
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      type: "speler_indeling_gezet",
      versieId: "v1",
      spelerId: "HANDMATIG-tycho",
      selectieGroepId: "sg-1",
    }));
  });

  it("logt speler_indeling_gezet bij ontkoppelen (doel=null)", async () => {
    const { zetSpelerIndeling } = await import("./speler-edit-actions");
    await zetSpelerIndeling("HANDMATIG-tycho", "v1", null);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      type: "speler_indeling_gezet",
      spelerId: "HANDMATIG-tycho",
      naarTeamId: null,
      selectieGroepId: null,
    }));
  });
});
```

- [ ] **Step 2: Run test om te zien dat hij faalt**

```bash
pnpm --filter @oranje-wit/ti-studio test speler-edit-actions
```

Expected: 2 tests falen.

- [ ] **Step 3: Instrumenteer `zetSpelerIndeling`**

In [apps/ti-studio/src/app/(protected)/personen/speler-edit-actions.ts:204](apps/ti-studio/src/app/%28protected%29/personen/speler-edit-actions.ts#L204), vlak vóór `revalidatePath("/personen/spelers")`:

```typescript
    await logWerkbordMutatie({
      versieId,
      type: "speler_indeling_gezet",
      doorId: await huidigeUserId(),
      spelerId,
      naarTeamId: doel?.type === "team" ? doel.id : null,
      selectieGroepId: doel?.type === "selectie" ? doel.id : null,
      payload: { spelerId, versieId, doel },
    });
```

Importeer bovenaan:

```typescript
import { logWerkbordMutatie } from "@/lib/teamindeling/audit/log-werkbord-mutatie";
import { huidigeUserId } from "@/lib/teamindeling/audit/huidige-user";
```

Verplaats `huidigeUserId` uit `werkindeling-actions.ts` naar nieuw bestand `apps/ti-studio/src/lib/teamindeling/audit/huidige-user.ts` (DRY) en importeer overal van daaruit.

- [ ] **Step 4: Instrumenteer `maakHandmatigeSpeler`**

In [apps/ti-studio/src/app/(protected)/personen/actions.ts:204](apps/ti-studio/src/app/%28protected%29/personen/actions.ts#L204), vlak na de `await prisma.$transaction([...])` voor Speler-aanmaak:

```typescript
    const huidigeVersie = await prisma.versie.findFirst({
      where: { werkindeling: { kaders: { isWerkseizoen: true }, status: "ACTIEF" } },
      orderBy: [{ werkindeling: { updatedAt: "desc" } }, { nummer: "desc" }],
      select: { id: true },
    });
    if (huidigeVersie) {
      await logWerkbordMutatie({
        versieId: huidigeVersie.id,
        type: "speler_handmatig_aangemaakt",
        doorId: await huidigeUserId(),
        spelerId: handmatigeId,
        payload: {
          handmatigeId,
          roepnaam: data.roepnaam,
          achternaam: data.achternaam,
          geslacht: data.geslacht,
          geboortedatum: data.geboortedatum,
        },
      });
    }
```

- [ ] **Step 5: Run tests om te zien dat ze slagen**

```bash
pnpm --filter @oranje-wit/ti-studio test "speler-edit-actions|actions.test"
```

Expected: alle tests slagen.

- [ ] **Step 6: Commit**

```bash
git add apps/ti-studio/src/app/\(protected\)/personen/ apps/ti-studio/src/lib/teamindeling/audit/huidige-user.ts
git commit -m "feat(ti-studio): log speler-edit en handmatige aanmaak naar WerkbordMutatie

zetSpelerIndeling en maakHandmatigeSpeler schrijven nu audit-rows.
huidigeUserId verhuisd naar gedeelde audit-module (DRY)."
```

---

### Task 6: Read-only audit-API + minimale weergave

**Files:**
- Create: `apps/ti-studio/src/app/api/indeling/[versieId]/audit/route.ts`
- Test: `apps/ti-studio/src/app/api/indeling/[versieId]/audit/route.test.ts`

- [ ] **Step 1: Schrijf falende test**

Maak `apps/ti-studio/src/app/api/indeling/[versieId]/audit/route.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  guardTC: vi.fn().mockResolvedValue({ ok: true, session: { user: { email: "antjan@x" } } }),
}));

const findMany = vi.fn();
vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { werkbordMutatie: { findMany } },
}));

import { GET } from "./route";

describe("GET /api/indeling/[versieId]/audit", () => {
  it("retourneert laatste 100 mutaties van versie", async () => {
    findMany.mockResolvedValue([
      { id: "m1", type: "speler_verplaatst", createdAt: new Date(), spelerId: "HANDMATIG-tycho", door: { naam: "Merel" } },
    ]);
    const res = await GET(new Request("http://x"), { params: Promise.resolve({ versieId: "v1" }) });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { versieId: "v1" },
      take: 100,
    }));
  });
});
```

- [ ] **Step 2: Run test**

```bash
pnpm --filter @oranje-wit/ti-studio test audit/route
```

Expected: faalt — module niet gevonden.

- [ ] **Step 3: Implementeer route**

Maak `apps/ti-studio/src/app/api/indeling/[versieId]/audit/route.ts`:

```typescript
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versieId: string }> }
) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  const { versieId } = await params;
  try {
    const mutaties = await prisma.werkbordMutatie.findMany({
      where: { versieId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        door: { select: { naam: true, email: true } },
        speler: { select: { roepnaam: true, achternaam: true } },
      },
    });
    return ok(mutaties);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

- [ ] **Step 4: Run test om te zien dat hij slaagt**

```bash
pnpm --filter @oranje-wit/ti-studio test audit/route
```

Expected: slaagt.

- [ ] **Step 5: Verifieer handmatig in productie-DB**

Maak tijdelijk een handmatige mutatie via de UI (sleep een speler) en bevestig dat hij in `werkbord_mutaties` staat:

```bash
PROD_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-) && DATABASE_URL="$PROD_URL" pnpm tsx -e 'import { prisma } from "./packages/database/src/index"; const r = await prisma.werkbordMutatie.findMany({ take: 5, orderBy: { createdAt: "desc" } }); console.log(JSON.stringify(r, null, 2)); await prisma.$disconnect();'
```

Expected: minstens 1 row met je laatste mutatie.

- [ ] **Step 6: Commit**

```bash
git add apps/ti-studio/src/app/api/indeling/\[versieId\]/audit/
git commit -m "feat(ti-studio): read-only audit-API voor werkbord-mutaties

GET /api/indeling/[versieId]/audit retourneert laatste 100 mutaties met
gebruiker en speler-naam. TC-only."
```

---

## Fase 2 — Race-condition bescherming (compare-and-swap)

**Achtergrond:** Bij parallelle sessies (Antjan + Merel beiden in productie) kunnen mutaties stilletjes verdwijnen omdat de werkbord-API onvoorwaardelijk `deleteMany` doet. We voegen een lichte compare-and-swap toe: de client stuurt zijn **verwachte huidige locatie** mee, de server controleert die tegen de DB-state. Bij mismatch: 409 met de werkelijke state, geen mutatie.

### Task 7: Helper `bepaalHuidigeLocatie()` + `vergelijkLocatie()`

**Files:**
- Create: `apps/ti-studio/src/lib/teamindeling/audit/huidige-locatie.ts`
- Test: `apps/ti-studio/src/lib/teamindeling/audit/huidige-locatie.test.ts`

- [ ] **Step 1: Definieer locatie-types**

Voeg toe aan `apps/ti-studio/src/lib/teamindeling/audit/types.ts`:

```typescript
export type SpelerLocatie =
  | { soort: "pool" }
  | { soort: "team"; teamId: string }
  | { soort: "selectie"; selectieGroepId: string };

export interface ConflictResult {
  conflict: true;
  verwacht: SpelerLocatie;
  werkelijk: SpelerLocatie;
  doorWie?: { naam: string; sessionId: string | null; tijdstip: Date };
}
```

- [ ] **Step 2: Schrijf falende test**

Maak `apps/ti-studio/src/lib/teamindeling/audit/huidige-locatie.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const teamSpeler = { findFirst: vi.fn() };
const selectieSpeler = { findFirst: vi.fn() };
const werkbordMutatie = { findFirst: vi.fn() };
vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { teamSpeler, selectieSpeler, werkbordMutatie },
}));

import { bepaalHuidigeLocatie, vergelijkLocatie } from "./huidige-locatie";

describe("bepaalHuidigeLocatie", () => {
  beforeEach(() => {
    teamSpeler.findFirst.mockReset();
    selectieSpeler.findFirst.mockReset();
    werkbordMutatie.findFirst.mockReset();
  });

  it("returnt pool als geen team en geen selectie", async () => {
    teamSpeler.findFirst.mockResolvedValue(null);
    selectieSpeler.findFirst.mockResolvedValue(null);
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "pool" });
  });

  it("returnt team als TeamSpeler gevonden", async () => {
    teamSpeler.findFirst.mockResolvedValue({ teamId: "t-sen2" });
    selectieSpeler.findFirst.mockResolvedValue(null);
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "team", teamId: "t-sen2" });
  });

  it("returnt selectie als SelectieSpeler gevonden", async () => {
    teamSpeler.findFirst.mockResolvedValue(null);
    selectieSpeler.findFirst.mockResolvedValue({ selectieGroepId: "sg-1" });
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "selectie", selectieGroepId: "sg-1" });
  });
});

describe("vergelijkLocatie", () => {
  it("gelijk pool/pool", () => {
    expect(vergelijkLocatie({ soort: "pool" }, { soort: "pool" })).toBe(true);
  });
  it("ongelijk pool/team", () => {
    expect(vergelijkLocatie({ soort: "pool" }, { soort: "team", teamId: "t1" })).toBe(false);
  });
  it("gelijk team/team zelfde id", () => {
    expect(vergelijkLocatie({ soort: "team", teamId: "t1" }, { soort: "team", teamId: "t1" })).toBe(true);
  });
  it("ongelijk team/team andere id", () => {
    expect(vergelijkLocatie({ soort: "team", teamId: "t1" }, { soort: "team", teamId: "t2" })).toBe(false);
  });
});
```

- [ ] **Step 3: Run test**

```bash
pnpm --filter @oranje-wit/ti-studio test huidige-locatie
```

Expected: 7 tests falen.

- [ ] **Step 4: Implementeer**

Maak `apps/ti-studio/src/lib/teamindeling/audit/huidige-locatie.ts`:

```typescript
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { SpelerLocatie } from "./types";

export async function bepaalHuidigeLocatie(
  versieId: string,
  spelerId: string
): Promise<SpelerLocatie> {
  const teamPlaatsing = await prisma.teamSpeler.findFirst({
    where: { spelerId, team: { versieId } },
    select: { teamId: true },
  });
  if (teamPlaatsing) return { soort: "team", teamId: teamPlaatsing.teamId };

  const selPlaatsing = await prisma.selectieSpeler.findFirst({
    where: { spelerId, selectieGroep: { versieId } },
    select: { selectieGroepId: true },
  });
  if (selPlaatsing) return { soort: "selectie", selectieGroepId: selPlaatsing.selectieGroepId };

  return { soort: "pool" };
}

export function vergelijkLocatie(a: SpelerLocatie, b: SpelerLocatie): boolean {
  if (a.soort !== b.soort) return false;
  if (a.soort === "pool") return true;
  if (a.soort === "team" && b.soort === "team") return a.teamId === b.teamId;
  if (a.soort === "selectie" && b.soort === "selectie") return a.selectieGroepId === b.selectieGroepId;
  return false;
}

export async function laatsteMutatieVoor(
  versieId: string,
  spelerId: string
): Promise<{ naam: string; sessionId: string | null; tijdstip: Date } | null> {
  const m = await prisma.werkbordMutatie.findFirst({
    where: { versieId, spelerId },
    orderBy: { createdAt: "desc" },
    include: { door: { select: { naam: true } } },
  });
  if (!m) return null;
  return { naam: m.door.naam, sessionId: m.sessionId, tijdstip: m.createdAt };
}
```

- [ ] **Step 5: Run test**

```bash
pnpm --filter @oranje-wit/ti-studio test huidige-locatie
```

Expected: alle tests slagen.

- [ ] **Step 6: Commit**

```bash
git add apps/ti-studio/src/lib/teamindeling/audit/
git commit -m "feat(ti-studio): helpers voor speler-locatie en conflict-detectie"
```

---

### Task 8: API endpoint controleert verwachte locatie

**Files:**
- Modify: `apps/ti-studio/src/app/api/indeling/[versieId]/route.ts`
- Modify: `apps/ti-studio/src/app/api/indeling/[versieId]/route.test.ts`

- [ ] **Step 1: Uitbreiden Zod-schema's**

In `route.ts`, vervang de bestaande schema-definities:

```typescript
const SpelerLocatieSchema = z.discriminatedUnion("soort", [
  z.object({ soort: z.literal("pool") }),
  z.object({ soort: z.literal("team"), teamId: z.string() }),
  z.object({ soort: z.literal("selectie"), selectieGroepId: z.string() }),
]);

const SpelerVerplaatst = z.object({
  type: z.literal("speler_verplaatst"),
  spelerId: z.string(),
  vanTeamId: z.string().nullable(),
  naarTeamId: z.string(),
  naarGeslacht: z.enum(["V", "M"]),
  sessionId: z.string(),
  verwachteLocatie: SpelerLocatieSchema.optional(), // optional voor backwards-compat tijdens rollout
});

const SpelerNaarPool = z.object({
  type: z.literal("speler_naar_pool"),
  spelerId: z.string(),
  vanTeamId: z.string(),
  sessionId: z.string(),
  verwachteLocatie: SpelerLocatieSchema.optional(),
});
```

- [ ] **Step 2: Schrijf falende conflict-test**

Voeg toe aan `route.test.ts`:

```typescript
const findFirstTS = vi.fn();
const findFirstSS = vi.fn();
const findFirstWM = vi.fn();
vi.mock("@/lib/teamindeling/audit/huidige-locatie", async () => {
  const actual = await vi.importActual<typeof import("@/lib/teamindeling/audit/huidige-locatie")>(
    "@/lib/teamindeling/audit/huidige-locatie"
  );
  return actual;
});

it("retourneert 409 bij locatie-mismatch", async () => {
  // ... mock: TeamSpeler.findFirst geeft { teamId: "t-anders" } terwijl client verwachtte "pool"
  const res = await POST(
    makeRequest({
      type: "speler_verplaatst",
      spelerId: "HANDMATIG-tycho",
      vanTeamId: null,
      naarTeamId: "t-sen2",
      naarGeslacht: "M",
      sessionId: "s1",
      verwachteLocatie: { soort: "pool" },
    }),
    { params: Promise.resolve({ versieId: "v1" }) }
  );
  expect(res.status).toBe(409);
  const body = await res.json();
  expect(body.ok).toBe(false);
  expect(body.conflict).toBeDefined();
  expect(body.conflict.werkelijk).toEqual({ soort: "team", teamId: "t-anders" });
});
```

- [ ] **Step 3: Run test**

```bash
pnpm --filter @oranje-wit/ti-studio test route.test
```

Expected: faalt.

- [ ] **Step 4: Implementeer conflict-check**

In `route.ts`, vlak ná `const event = parsed.data;` (regel 50) en vóór `try {`:

```typescript
  // Compare-and-swap: alleen voor speler-verplaatsing
  if (
    (event.type === "speler_verplaatst" || event.type === "speler_naar_pool") &&
    event.verwachteLocatie
  ) {
    const werkelijk = await bepaalHuidigeLocatie(versieId, event.spelerId);
    if (!vergelijkLocatie(event.verwachteLocatie, werkelijk)) {
      const laatste = await laatsteMutatieVoor(versieId, event.spelerId);
      return new Response(
        JSON.stringify({
          ok: false,
          conflict: {
            verwacht: event.verwachteLocatie,
            werkelijk,
            doorWie: laatste,
          },
        }),
        { status: 409, headers: { "content-type": "application/json" } }
      );
    }
  }
```

Importeer bovenaan:

```typescript
import { bepaalHuidigeLocatie, vergelijkLocatie, laatsteMutatieVoor } from "@/lib/teamindeling/audit/huidige-locatie";
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @oranje-wit/ti-studio test route.test
```

Expected: alle tests slagen.

- [ ] **Step 6: Commit**

```bash
git add apps/ti-studio/src/app/api/indeling/
git commit -m "feat(ti-studio): compare-and-swap op werkbord-API bij speler-verplaatsing

Client stuurt verwachte locatie mee; server retourneert 409 met
werkelijke state + laatste mutator bij mismatch. Voorkomt stille
data-overschrijving bij parallelle sessies."
```

---

### Task 9: Client stuurt `verwachteLocatie` mee en handelt 409 af

**Files:**
- Modify: `apps/ti-studio/src/components/werkbord/hooks/useWerkbordState.ts`
- Modify: `apps/ti-studio/src/components/werkbord/hooks/useWerkbordState.test.ts`
- Create: `apps/ti-studio/src/components/werkbord/ConflictToast.tsx`

- [ ] **Step 1: Inspecteer huidige hook**

```bash
grep -n "fetch\|POST" apps/ti-studio/src/components/werkbord/hooks/useWerkbordState.ts | head -20
```

Identificeer de POST-call naar `/api/indeling/[versieId]`. Onthoud welke variabele de huidige speler-locatie weergeeft (waarschijnlijk `state.teams[X].spelers` of equivalent).

- [ ] **Step 2: Voeg falende test toe**

In `useWerkbordState.test.ts`, voeg toe:

```typescript
it("stuurt verwachteLocatie mee bij speler_verplaatst", async () => {
  // Setup: speler X staat in team A, client verplaatst naar team B
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  global.fetch = fetchMock;

  // ... trigger verplaatsing in hook
  // ... assert dat fetch met body { ..., verwachteLocatie: { soort: "team", teamId: "A" } } werd aangeroepen

  const call = fetchMock.mock.calls[0];
  const body = JSON.parse(call[1].body);
  expect(body.verwachteLocatie).toEqual({ soort: "team", teamId: "A" });
});

it("toont conflict-toast bij 409", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    status: 409,
    json: async () => ({
      ok: false,
      conflict: {
        verwacht: { soort: "pool" },
        werkelijk: { soort: "team", teamId: "t-sen2" },
        doorWie: { naam: "Merel van Gurp", tijdstip: new Date(), sessionId: null },
      },
    }),
  });
  // ... trigger verplaatsing
  // ... assert dat onConflict-callback werd aangeroepen met juiste payload
});
```

- [ ] **Step 3: Run test**

```bash
pnpm --filter @oranje-wit/ti-studio test useWerkbordState
```

Expected: faalt.

- [ ] **Step 4: Voeg helper toe in hook om verwachteLocatie te berekenen**

In `useWerkbordState.ts`, voeg toe:

```typescript
function huidigeLocatieVoorSpeler(state: WerkbordState, spelerId: string): SpelerLocatie {
  for (const team of state.teams) {
    if (team.spelers.some((s) => s.id === spelerId)) {
      return { soort: "team", teamId: team.id };
    }
  }
  for (const sg of state.selectieGroepen ?? []) {
    if (sg.spelers.some((s) => s.id === spelerId)) {
      return { soort: "selectie", selectieGroepId: sg.id };
    }
  }
  return { soort: "pool" };
}
```

Pas types aan op basis van wat al in `state` zit (raadpleeg het bestaande `WerkbordState`-type).

- [ ] **Step 5: Voeg `verwachteLocatie` toe aan elke POST**

Bij de bestaande `fetch("/api/indeling/...", { body: ... })`-call, voeg toe aan de body:

```typescript
verwachteLocatie: huidigeLocatieVoorSpeler(state, event.spelerId),
```

- [ ] **Step 6: Handle 409**

Bij de `fetch`-response, vóór de bestaande success-handling:

```typescript
if (response.status === 409) {
  const { conflict } = await response.json();
  onConflict?.(conflict);
  // Force-refresh werkbord state via revalidate
  void refreshWerkbord();
  return;
}
```

Voeg `onConflict?: (c: ConflictResult) => void` toe als optionele prop in de hook-options.

- [ ] **Step 7: Maak ConflictToast component**

Maak `apps/ti-studio/src/components/werkbord/ConflictToast.tsx`:

```typescript
"use client";
import type { ConflictResult } from "@/lib/teamindeling/audit/types";

function locatieLabel(l: ConflictResult["werkelijk"]): string {
  if (l.soort === "pool") return "spelerspool";
  if (l.soort === "team") return `team ${l.teamId}`;
  return `selectie ${l.selectieGroepId}`;
}

export function ConflictToast({ conflict, onSluit }: {
  conflict: ConflictResult;
  onSluit: () => void;
}) {
  const door = conflict.doorWie?.naam ?? "Iemand anders";
  return (
    <div role="alert" className="conflict-toast">
      <strong>Tegelijk bewerkt</strong>
      <p>
        Je verplaatste een speler, maar {door} heeft hem ondertussen in {locatieLabel(conflict.werkelijk)} gezet.
        Het werkbord is ververst — bekijk de actuele plaatsing en probeer opnieuw als je het echt anders wilt.
      </p>
      <button onClick={onSluit}>Sluit</button>
    </div>
  );
}
```

Styling volgt bestaande toast-conventies — als geen toast-systeem bestaat, gebruik dezelfde tokens als `apps/ti-studio/src/app/globals.css`.

- [ ] **Step 8: Sluit toast aan in werkbord-page**

Zoek de pagina die `useWerkbordState` gebruikt (waarschijnlijk `apps/ti-studio/src/app/(protected)/indeling/page.tsx`) en koppel `onConflict` aan een `useState<ConflictResult | null>`. Render `<ConflictToast>` conditioneel.

- [ ] **Step 9: Run tests**

```bash
pnpm --filter @oranje-wit/ti-studio test useWerkbordState
```

Expected: alle tests slagen.

- [ ] **Step 10: Manueel testen met twee browsers**

1. Open `teamindeling.ckvoranjewit.app/indeling` in twee verschillende browsers (of normale + incognito) met dezelfde versie open.
2. In browser A: sleep een speler naar Senioren 1.
3. In browser B: probeer dezelfde speler naar Senioren 2 te slepen (op basis van zijn UI die nog niet weet van A's actie).
4. Expected: browser B krijgt de conflict-toast en de speler springt naar Senioren 1.

- [ ] **Step 11: Commit**

```bash
git add apps/ti-studio/src/components/werkbord/ apps/ti-studio/src/app/\(protected\)/indeling/page.tsx
git commit -m "feat(ti-studio): werkbord-client stuurt verwachteLocatie + handelt 409 conflict af

Bij parallelle sessies springt de speler nu zichtbaar naar zijn werkelijke
positie i.p.v. dat de tweede actie stilletjes de eerste overschrijft. Toast
laat zien wie de andere mutator is."
```

---

### Task 10: E2E test voor conflict-flow

**Files:**
- Create: `e2e/ti-studio-v2/werkbord-conflict.spec.ts`

- [ ] **Step 1: Schrijf E2E test**

```typescript
import { test, expect } from "@playwright/test";

test("werkbord conflict: tweede sessie krijgt 409 en refresht", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // ... login beide via agent-login provider
  // ... beide naar /indeling met dezelfde versie

  // A sleept speler 9900xxxx naar Senioren 1
  await pageA.locator("[data-testid='speler-card-9900xxxx']").dragTo(
    pageA.locator("[data-testid='team-kaart-SEN1'] [data-testid='drop-zone-team']")
  );
  await expect(pageA.locator("[data-testid='team-kaart-SEN1']")).toContainText("9900xxxx");

  // B (UI weet nog niet van A) probeert dezelfde speler naar Senioren 2
  // Vermijd SSE-update door pageB.context().setOffline(true) tijdelijk
  await pageB.context().setOffline(true);
  await pageB.locator("[data-testid='speler-card-9900xxxx']").dragTo(
    pageB.locator("[data-testid='team-kaart-SEN2'] [data-testid='drop-zone-team']")
  );
  await pageB.context().setOffline(false);

  // Expected: conflict-toast verschijnt, speler staat in SEN1 (niet SEN2)
  await expect(pageB.locator("[role='alert']")).toContainText("Tegelijk bewerkt");
  await expect(pageB.locator("[data-testid='team-kaart-SEN1']")).toContainText("9900xxxx");
  await expect(pageB.locator("[data-testid='team-kaart-SEN2']")).not.toContainText("9900xxxx");

  await ctxA.close();
  await ctxB.close();
});
```

Gebruik bestaande fixtures uit [docs/kennis/edge-case-testdata.md](docs/kennis/edge-case-testdata.md). Volg [.claude/skills/e2e-studio-test/SKILL.md](.claude/skills/e2e-studio-test/SKILL.md) voor authenticatie en cleanup.

- [ ] **Step 2: Run E2E lokaal**

```bash
pnpm test:e2e e2e/ti-studio-v2/werkbord-conflict.spec.ts
```

Expected: slaagt. Als hij faalt door SSE-timing, voeg `await pageB.waitForTimeout(500)` toe waar nodig — maar onderzoek of het een echte bug is voordat je sleeps inbouwt.

- [ ] **Step 3: Commit**

```bash
git add e2e/ti-studio-v2/werkbord-conflict.spec.ts
git commit -m "test(e2e): werkbord-conflict tussen parallelle sessies"
```

---

## Self-Review

**Spec coverage:**
- ✅ Audit-gat: 8 mutatie-types loggen — Tasks 1-6
- ✅ Race-condition: compare-and-swap op speler-verplaatsing — Tasks 7-9
- ✅ E2E-verificatie van conflict-flow — Task 10

**Bewust niet in scope (besluit):**
- Optimistic locking met revisie-nummers op SelectieGroep/Team (te ingrijpend, en compare-and-swap dekt het kerngeval — speler-koppeling)
- Hard locks ("Antjan is bezig") — slecht UX-pattern voor TC die parallel werken
- Audit van Daisy-mutaties — die heeft al `agent_mutaties`-tabel (zie `AgentMutatie` model)
- Migratie/backfill van historische LogEntry- of Activiteit-data — beide tabellen waren toch al leeg op productie

**Open risico's:**
- `huidigeUserId()` haalt user op via email. Als email NULL kan zijn voor een sessie, gooit het. Verifieer in [packages/auth/src/index.ts](packages/auth/src/index.ts) dat email gegarandeerd is voor `requireTC`-sessies.
- `notifyWerkbord` (pg_notify) en `logWerkbordMutatie` zijn beide best-effort. Als één faalt, blijft de mutatie staan — maar dat is geaccepteerd.
- Bij `toggleSelectieBundeling` is `versieId` indirect — Task 4 step 6 doet een extra query om hem te krijgen. Performance-acceptabel (één keer per bundel-actie).
- Compare-and-swap dekt alleen speler-verplaatsing via werkbord-API. Server-actions (`voegSelectieSpelerToe` etc.) doen het niet — daar is het volume en frequentie veel lager. Pragmatische keuze.

**Validatie na deployment:**
```bash
PROD_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-) && DATABASE_URL="$PROD_URL" pnpm tsx -e 'import { prisma } from "./packages/database/src/index"; const r = await prisma.werkbordMutatie.count(); console.log("WerkbordMutatie rijen:", r); await prisma.$disconnect();'
```

Na 24u live: verwacht > 0 rijen. Als nog steeds 0 → bug in instrumentatie.

---

## Execution Handoff

Plan compleet en opgeslagen op `docs/superpowers/plans/2026-05-19-werkbord-audit-en-race-bescherming.md`. Twee uitvoeringsopties:

**1. Subagent-Driven (aanbevolen)** — fresh subagent per taak, review tussen taken, snelle iteratie. Vooral nuttig hier omdat Task 1-2 (schema + helper) onafhankelijk uitvoerbaar zijn van Task 3-6 (instrumentatie), die op hun beurt onafhankelijk zijn van Fase 2.

**2. Inline Execution** — taken in deze sessie uitvoeren met `superpowers:executing-plans`, batch met checkpoints.

**Aanvullende keuze (uniek voor dit plan):** wil je **alleen Fase 1 nu** (audit-trail eerst live, dan kijken of het probleem terugkomt en pas dán Fase 2 doen), of **beide fases in één doorloop**? Fase 1 levert direct waarde (forensisch bewijs bij toekomstige incidenten); Fase 2 is preventie en kan wachten tot je de audit een paar weken hebt zien werken.

Welke aanpak?
