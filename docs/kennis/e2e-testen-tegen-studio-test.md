# E2E-testen tegen studio-test.ckvoranjewit.app

**Doel**: Herhaalbare, production-like end-to-end tests draaien tegen een echte omgeving met geanonimiseerde data. Geen lokale baseline-moeite, geen stale test-fixtures.

**Status**: Live sinds 2026-05-15. Werkbord drag-drop spec is reference-implementatie.

---

## Architectuur

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Auth setup (eenmalig)                                        │
│   studio-test-auth.setup.ts                                     │
│   • Basic-Auth headers instellen (tcv2 + Railway secret)        │
│   • CSRF-token ophalen via /api/auth/csrf                       │
│   • POST /api/auth/callback/agent-login                         │
│   • Cookie __ow_agent_run_id zetten (UUID)                      │
│   • Storage state opslaan → e2e/.auth/studio-test.json          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Tests draaien (elk test-bestand)                             │
│   e2e/ti-studio-v2/<feature>.spec.ts                            │
│   • beforeAll: agentRunId uit cookie lezen                      │
│   • Tests met authenticated session (Basic Auth + OAuth)        │
│   • Elke verplaatsSpeler() call → AgentMutatie gelogd in DB     │
│   • Lees rel_code uit data-testid selectors                     │
│   • Skip mild (geen data? skip test, geen faal)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Cleanup (afterAll per spec-bestand)                          │
│   POST /api/agent/cleanup                                       │
│   • Payload: { secret, agentRunId }                             │
│   • Server query: AgentMutatie WHERE agentRunId AND             │
│     rolledBackAt IS NULL                                        │
│   • Inverse-logica uitvoeren (verplaatsSpelerInternal)          │
│   • Update rolledBackAt = now()                                 │
│   • Response: { ok: true, rolledBack: N }                       │
│   • Errors: try-catch genegeerd (cleanup mag niet falen)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lokaal draaien

### Stap 1: Environment variabelen

Zet deze in `.env.local` (NOOIT hardcoden, NOOIT committen):

```bash
STUDIO_TEST_URL=https://studio-test.ckvoranjewit.app
STUDIO_TEST_BASIC_AUTH_USER=tcv2
STUDIO_TEST_BASIC_AUTH_PASS=<vraag Railway service 2f40fe63 env-vars>
STUDIO_TEST_AGENT_SECRET=<vraag Railway service 2f40fe63 env-vars>
```

### Stap 2: Draaien

```bash
# Setup + remote tests
pnpm exec playwright test \
  --project=studio-test-auth-setup \
  --project=ti-studio-v2-remote \
  --headed \
  --workers=1
```

Vlag-toelichting:
- `--headed` — laat browser zien (optioneel, handig voor debugging)
- `--workers=1` — draai tests serieel (geen race conditions op cleanup)
- `--project=studio-test-auth-setup` — draait eerst (koppelt session)

### Stap 3: Verwachtingen

- **studio-test-auth-setup**: altijd groen (login)
- **ti-studio-v2-remote** drag-drop tests: skippen in headless (PDND-blokker — zie beneden)
- **ti-studio-v2-remote** andere tests: groen (auth, structuur, navigatie)
- **Cleanup afterAll**: rapporteert `N mutaties teruggedraaid` in console.log

---

## In GitHub Actions (CI)

Workflow: `.github/workflows/e2e-studio-test.yml`

### On-demand

```bash
gh workflow run "E2E tegen studio-test" --ref main
```

Of via GitHub UI: Actions → "E2E tegen studio-test" → "Run workflow"

### Nightly

Automatisch elke dag om 04:00 UTC.

### Secrets

Drie verplichte repository secrets:
- `STUDIO_TEST_BASIC_AUTH_USER` = `tcv2`
- `STUDIO_TEST_BASIC_AUTH_PASS` = (Railway secret)
- `STUDIO_TEST_AGENT_SECRET` = (Railway secret)

Playwright-rapport wordt geüpload als artifact (14 dagen bewaard).

---

## Nieuwe test schrijven voor studio-test

### 1. Bestandslocatie

```
e2e/ti-studio-v2/<feature>.spec.ts
```

### 2. Template

```typescript
import { test, expect } from "./fixtures/base";

// Optioneel: agentRunId voor afterAll cleanup
let capturedAgentRunId: string | null = null;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "./e2e/.auth/studio-test.json",
  });
  const cookies = await context.cookies();
  const agentCookie = cookies.find((c) => c.name === "__ow_agent_run_id");
  capturedAgentRunId = agentCookie?.value ?? null;
  await context.close();
});

test.afterAll(async ({ request }) => {
  if (!capturedAgentRunId) return;

  const baseURL = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
  const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";

  if (!secret) return;

  try {
    const response = await request.post(`${baseURL}/api/agent/cleanup`, {
      data: { secret, agentRunId: capturedAgentRunId },
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.STUDIO_TEST_BASIC_AUTH_USER ?? ""}:${process.env.STUDIO_TEST_BASIC_AUTH_PASS ?? ""}`
        ).toString("base64")}`,
      },
    });

    if (response.ok()) {
      const body = (await response.json()) as { ok: boolean; rolledBack: number };
      console.log(`[feature] Cleanup: ${body.rolledBack} mutaties teruggedraaid`);
    }
  } catch (error) {
    console.warn("[feature] Cleanup fout (genegeerd):", error);
  }
});

test.describe("Mijn feature", () => {
  test("doet iets", async ({ page }) => {
    await page.goto("/pad");
    // ... test logica
  });
});
```

### 3. Checklist bij elke nieuwe test

- [ ] `import` uit `./fixtures/base`
- [ ] `beforeAll` agentRunId van cookie lezen
- [ ] `afterAll` cleanup aanroepen (kopieer pattern boven)
- [ ] Selectors: `data-testid` preferred, fallback `getByRole`/`getByLabel`
- [ ] Skip mild: geen hard `expect(...).toBe(0)` op data-afhankelijkheden, gebruik `test.skip()` i.p.v. `throw`
- [ ] `await page.waitForTimeout(X)` na mutaties (wacht op revalidatePath)
- [ ] Geen hardcoded baseURL — gebruik `page.goto("/...")`, baseURL komt uit playwright config
- [ ] rel_code uit selector halen als string, niet als getal (kan met nul's)
- [ ] Taal: Nederlands in test-beschrijvingen

### 4. Mild vs. hard skippen

**Mild skippen** (data ontbreekt, test blijft nuttig):
```typescript
const spelers = await page.locator('[data-testid^="speler-card-"]').count();
if (spelers === 0) {
  test.skip(true, "Geen spelers in DB — test overgeslagen");
  return;
}
```

**Hard falen** (logica-bug, app moet werken):
```typescript
const error = await page.locator("[data-save-state=error]").count();
expect(error).toBe(0); // Dit MÁG falen
```

**Vuistregel**: Meer dan 50% skips per test-run? De test is waardeloos, verwijder hem.

---

## Mutaties en audit-trail

### AgentMutatie tabel

Alle testen noemen `rel_code` als sleutel (Sportlink relatienummer). Server-side:

```prisma
model AgentMutatie {
  id           String    @id @default(cuid())
  agentRunId   String    // UUID van deze testrun
  type         String    // "speler_verplaats", "team_aanmaken", etc.
  payload      Json      // origineel request
  inverse      Json      // hoe je het terug draait
  createdAt    DateTime  @default(now())
  rolledBackAt DateTime?

  @@index([agentRunId])
}
```

### Cleanup-logica

Na POST `/api/agent/cleanup` met `{ secret, agentRunId }`:

1. Query: `SELECT * FROM agent_mutaties WHERE agentRunId = ? AND rolledBackAt IS NULL ORDER BY createdAt DESC`
2. Per mutatie (reverse chronologisch):
   - Pas `inverse` JSON toe (roep `verplaatsSpelerInternal(inverse.rel_code, inverse.teamId)` aan)
   - Set `rolledBackAt = NOW()`
3. Return: `{ ok: true, rolledBack: <count> }`

**Idempotent**: tweede cleanup-call doet niets (alle rijen hebben `rolledBackAt`).

### Nieuwe mutatie-types toevoegen

Voorbeeld: "team aanmaken" testen.

1. Server action `createTeamAction` toevoegen → maakt team aan
2. Loggen in `createTeamAction`:
   ```typescript
   await db.agentMutatie.create({
     data: {
       agentRunId: getAgentRunId(), // uit cookie
       type: "team_aanmaken",
       payload: { name, owCode },
       inverse: { teamId }, // hoe je team verwijdert
     }
   });
   ```
3. Cleanup endpoint uitbreiden — switch-case:
   ```typescript
   case "team_aanmaken":
     await db.team.delete({ where: { id: mutatie.inverse.teamId } });
     break;
   ```
4. Test schrijven, cleanup testen

---

## PDND-Playwright blokker

### Het probleem

**Pragmatic Drag and Drop (PDND)** gebruikt native HTML5 drag-pipeline. Playwright's `dragTo()` werkt **wel** in lokale headed mode en **wel** in GitHub Actions Chromium runner, maar **niet** in headless MCP-browser.

**Waarom?** PDND wraps de browser's pointer-event pipeline. In MCP headless kan `dragTo()` synthetische drag-events niet triggeren die PDND accepteert. Atlassian's eigen testing-docs verwijzen naar Cypress en bundled helpers, niet naar Playwright headless.

### Huidige status

- **Spec**: `e2e/ti-studio-v2/werkbord-dragdrop.spec.ts`
- **Drag-drop tests**: skippen in CI (headless Chromium)
- **Andere tests** (navigatie, auth, structuur): draaien normaal
- **Handmatig valideren**: werk lokaal met `--headed` of via echte browser

### Workarounds (per use-case)

| Use-case | Optie | Status |
|---|---|---|
| Handmatige verificatie lokaal | `pnpm test:e2e:ti-studio-v2 --headed` | Werkt nu |
| CI-automatisering PDND | Switch naar `@dnd-kit/core` | Open decision (effort ~2 dagen) |
| Visual regression | Playwright Visual Comparisons | Open (geen budget nu) |
| Server-side logica | Server-action-level tests (geen UI) | Makkelijk, bewijst niet de wiring |

### Referentie-onderzoek

- Zie `docs/superpowers/specs/2026-05-13-drag-drop-library-research.md` voor full analyse
- Erratum 2026-05-15 in datzelfde doc: PDND headless claim is onjuist

---

## Test-DB sync

### Prisma migraties

Alle migraties staan in `packages/database/prisma/migrations/`. Bij `pnpm db:migrate` worden ze automatisch naar test-DB gesynchroniseerd (test-DB ligt op Railway, via Prisma client).

**MAAR**: een paar handgeschreven SQL-migraties zijn alleen via `pnpm db:push` toegepast op productie (niet via `migrate`). Deze moeten handmatig op test-DB worden gereproduceerd (Railway console):

```sql
-- Voorbeeld: AgentMutatie-tabel toevoegen
CREATE TABLE agent_mutaties (
  id TEXT PRIMARY KEY,
  agent_run_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  inverse JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  rolled_back_at TIMESTAMP,
  UNIQUE(id)
);
CREATE INDEX idx_agent_run_id ON agent_mutaties(agent_run_id);
```

**Open punt**: tot baseline gefixed is, sync migraties handmatig naar test-DB per release.

---

## Test-uitvoering best practices

### Timing

```typescript
// Na drag:
await spelerElem.dragTo(doelTeam);

// Wacht op server-side revalidatePath
await page.waitForTimeout(2000);

// Daarna assertions
const error = await page.locator("[data-save-state=error]").count();
expect(error).toBe(0);
```

**Regels**:
- Minimaal 500ms na drag (server action + revalidate)
- Minimaal 1500ms na `goto()` (page render)
- Maximaal 10s per drag (timeout)

### Selectors voor spelers & teams

```typescript
// Speler in spelerspool
[data-testid="speler-card-{rel_code}-spelerpool"]

// Speler op team
[data-testid="speler-card-{rel_code}-team-{teamId}"]

// Team-kaart (drop-target)
[data-testid="team-kaart-{teamId}-huidig"]

// Spelerspool drawer (drop-zone)
[data-testid="drop-zone-spelerpool"]
```

### Debugging tips

1. **Console logs**: test toont agentRunId + cleanup-status in console
2. **Screenshot bij faal**: Playwright slaat automatisch screenshot op in `test-results/`
3. **Headed mode**: `--headed` laat browser zien, je ziet timing/events live
4. **Manual check**: na failed test, check database via Railway console: `SELECT * FROM agent_mutaties WHERE rolled_back_at IS NULL;` (zou leeg moeten zijn na cleanup)

---

## Verwijzingen

- **Architectuur spec**: `docs/superpowers/specs/2026-05-15-e2e-tegen-studio-test.md` (diepte, onderbouwing, Git log)
- **PDND onderzoek + erratum**: `docs/superpowers/specs/2026-05-13-drag-drop-library-research.md` (library-keuze, headless-blokker)
- **Skill voor agents**: `.claude/skills/e2e-studio-test/SKILL.md` (automated template + hoe-te)
- **Workflow**: `.github/workflows/e2e-studio-test.yml` (CI config)
- **Spec-voorbeelden**: `e2e/ti-studio-v2/werkbord-dragdrop.spec.ts` (werkende referentie)

---

## Open punten

- [ ] **Test-DB schema-sync**: Handmatige sync per migratie tot baseline-automatisering
- [ ] **PDND CI-testbaarheid**: Decision nodig: @dnd-kit/core of visuele tests?
- [ ] **Andere v2-specs porten**: homepagina, smoke, memo, personen moeten naar studio-test-auth pattern (werk in voortgang)
- [ ] **Nightly rapport**: Slack notification bij gefaalde CI runs (open feature)
