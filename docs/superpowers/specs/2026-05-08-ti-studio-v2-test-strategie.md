# TI Studio v2 — Test Strategie

**Datum**: 2026-05-08 (bijgewerkt: 2026-05-13)  
**Status**: Goedgekeurd  
**Auteur**: E2E Tester  
**Gerelateerd**: `2026-05-08-ti-studio-v2-realisatie-plan.md` (scope), `2026-04-14-agent-visueel-backdoor-design.md` (agent auth)

---

## 1. Test-fundament: Playwright bevestigd

**Keuze**: Playwright (niet Cypress).

**Waarom**: 
- v1 tests draaien al onder Playwright (`e2e/ti-studio/*.spec.ts`) — 5 bestanden, 8 groen + 3 skip per april 2026
- Configuratie in `playwright.config.ts` is volwassen: parallelle workers (4 in CI), browserstack-ready, auth-setup geautomatiseerd via `e2e/auth.setup.ts`
- dnd-kit drag-drop is notoir lastig in beide frameworks; Playwright heeft hier geen slechter track record dan Cypress

**v2 config**: Hergebruik huidige config. Voeg nieuw project toe:
```typescript
{
  name: "ti-studio-v2",
  testDir: "./e2e/ti-studio-v2",
  use: {
    ...devices["Desktop Chrome"],
    storageState: "./e2e/.auth/user.json",
    baseURL: "http://localhost:3002",  // v2 dev server
  },
  dependencies: ["setup"],
}
```

Plus nieuw webServer:
```typescript
{
  command: "pnpm dev:ti-studio-v2",  // noch af te stemmen
  port: 3002,
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
  env: { E2E_TEST: "true" },
}
```

**Decision voor Antjan**: Config kan nu al ingesteld? Of later bij eerste v2 dev build?

---

## 2. Auth-bypass: Bestaande `dev-login` hergebruiken

**Setup**: 
- v1 tests gebruiken `e2e/auth.setup.ts` die `/api/auth/callback/dev-login` aanroept (CSRF + email POST).
- Deze provider is actief als `E2E_TEST=true` (gezet in `playwright.config.ts` webServer env).

**v2 strategie**: 
1. **Dev/local**: Dezelfde `dev-login` provider, zelfde `e2e/auth.setup.ts` flow — geen wijzigingen nodig.
2. **Production verifies** (optioneel): Gebruik `agent-login` provider (zie `2026-04-14-agent-visueel-backdoor-design.md`). E2E tests kunnen dan ook optioneel via agent-secret inloggen: `/api/auth/callback/agent-login` met `{ csrfToken, secret: AGENT_SECRET }`.

**Current flow**:
```
Setup test runs → GET /api/auth/csrf (krijgt CSRF token)
             → POST /api/auth/callback/dev-login (email: antjanlaban@gmail.com)
             → Session stored in e2e/.auth/user.json
All other tests → Laad storageState uit user.json
```

**Implementatie**: Geen wijzigingen. Tests in `e2e/ti-studio-v2/*.spec.ts` gebruiken standaard fixture:
```typescript
import { test, expect } from "../fixtures/base";

test("werkbord laadt", async ({ page }) => {
  await page.goto("/indeling");
  // ...
});
```

**Decision voor Antjan**: 
- Agent-login ook voor v2 E2E testen? (Alleen als intentie is dat agents zelf tests kunnen draaiën op productie.)

---

## 3. Test-data-strategie: Snapshot-restore per CI-run

**Definitieve keuze (2026-05-13)**: **Snapshot-restore** — aparte test-database `oranjewit-test` met PostgreSQL snapshots per CI-run.

**Werkwijze**:
- **Lokaal (development)**: `--update-snapshots` flag of per-test cleanup (option 3 uit onderzoek)
- **CI**: Vóór E2E-run:
  ```bash
  SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts
  ```
  Dit herstelt `oranjewit-test` naar bekende baseline van vorige stable release.

**Voordelen**:
- ✅ Volledig deterministisch — snapshot is immutable baseline
- ✅ Geen data-vervuiling tussen runs
- ✅ Lokaal flexibel (per-test cleanup of snapshot)
- ✅ Production-like: echte app-data, niet synthetisch gegenereerd
- ✅ Makkelijk audit: `git log snapshot-commits` toont wat baseline was

**Mitigaties**:
- Snapshot moet ~1 week oud zijn (stabiel, geen lopende changes)
- Als app-data mutaties tussen runs, re-snapshot na beheer-actions

**Implementatie**:

### 3.1 Snapshot-restore script
Bestaand bestand: `scripts/snapshot-prod-to-dev.ts` — voert restore uit:

```bash
# CI vóór E2E-run
SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts

# Lokaal (handmatig als gewenst)
SNAPSHOT_TARGET=local pnpm tsx scripts/snapshot-prod-to-dev.ts
```

Script herstelt `oranjewit-test` naar laatste stabiele snapshot commit.

### 3.2 Playwright config
In `playwright.config.ts`, webServer env voor test-DB:

```typescript
{
  webServer: {
    command: "pnpm dev:ti-studio-v2",
    port: 3002,
    env: {
      E2E_TEST: "true",
      DATABASE_URL: "postgresql://...", // oranjewit-test
    },
  },
}
```

### 3.3 Per-test cleanup (lokaal optioneel)
Voor lokale dev: per-test cleanup via `afterEach()` in fixtures, OF snapshot-restore.

```typescript
// Alternatief voor snapshot-restore (lokaal sneller)
afterEach(async ({ context }) => {
  // Verwijder test-artifacts uit session
  await context.clearCookies();
});
```

---

## 4. Drag-drop library: Pragmatic Drag and Drop

**Definitieve keuze (2026-05-13)**: **Pragmatic Drag and Drop** (`@atlaskit/pragmatic-drag-and-drop`) — NIET dnd-kit.

**Waarom**:
- ✅ Native HTML5 drag-drop API (geen custom Pointer synthesis)
- ✅ `page.dragTo()` werkt out-of-the-box in Playwright
- ✅ Atlassian maintained, goed gedocumenteerd
- ✅ v2 Werkbord heeft nog gé𝐞𝐧 drag-drop code — we beginnen vanaf nul

**Implementatie**:
- Afhankelijkheid: `pnpm add @atlaskit/pragmatic-drag-and-drop`
- Components: `<div draggable="true">` + PDND drop-zone handlers
- Tests: Standaard Playwright `page.dragTo()` (geen custom helpers nodig)

**Voorbeeld test**:
```typescript
test("werkbord: speler verplaatsen naar team", async ({ page }) => {
  await page.goto("/indeling");
  
  const spelerCard = page.locator("[data-testid='speler-card-rel0001-werkbord']");
  const dropZone = page.locator("[data-testid='drop-zone-team-A1']");
  
  await spelerCard.dragTo(dropZone);
  
  // Verificatie
  await expect(page.locator("[data-testid='drop-zone-team-A1'] [data-testid='speler-card-rel0001-werkbord']"))
    .toBeVisible();
});
```

**Onderzoeksdocument**: `docs/superpowers/specs/2026-05-13-drag-drop-library-research.md` (aparte doc)

---

## 5. Data-testid conventie

**Definitieve keuze (2026-05-13)**:

```
speler-card-{rel_code}-{context}
team-kaart-{owCode}-{versie}
drop-zone-{type}-{target}
memo-rij-{uuid}-{context}
```

**Omschrijving**:

| Element | Format | Voorbeeld |
|---------|--------|-----------|
| **Speler-kaart** | `speler-card-{rel_code}-{context}` | `speler-card-LS00123-werkbord`, `speler-card-LS00456-team-A1` |
| **Team-kaart** | `team-kaart-{owCode}-{versie}` | `team-kaart-A1-huidig`, `team-kaart-B2-whatif` |
| **Drop-zone** | `drop-zone-{type}-{target}` | `drop-zone-team-A1`, `drop-zone-bench` |
| **Memo-rij** | `memo-rij-{uuid}-{context}` | `memo-rij-abc123-gesprekken` |
| **Andere** | `{component}-{action}` | `toolbar-toggle-pool`, `btn-save-versie` |

**Contexten**:
- Spelers: `werkbord` | `spelerpool` | `team-{owCode}` | `whatif-canvas`
- Teams: `huidig` (live indeling) | `whatif` (what-if versie)

**Identifiers**:
- `rel_code`: Globaal uniek (Sportlink Lid ID)
- `owCode`: Uniek per seizoen (OW Team ID, bv. "A1", "B2")

**Implementatie checklist**:
- [ ] SpelerKaart: `data-testid="speler-card-${rel_code}-${context}"`
- [ ] TeamKaart: `data-testid="team-kaart-${owCode}-${versie}"`
- [ ] DropZone: `data-testid="drop-zone-team-${owCode}"` of `drop-zone-bench`
- [ ] Memo-rij: `data-testid="memo-rij-${uuid}-${context}"`
- [ ] Andere controls: `data-testid="${component}-${action}"`

**Fallback selectors** (in volgorde):
1. `getByTestId()` — preferred
2. `getByRole()` — a, button, link
3. `getByLabel()` — form inputs
4. `getByText()` — statische tekst (voorzichtig)

---

## 6. Visual regression: Selectief, per statische layout

**Definitieve keuze (2026-05-13)**: **Selectief** — alleen statische layouts, NIET werkbord met drag-drop.

**Scope (3 screenshots per pagina)**:

| Pagina | Default | Focus-state | Lege-state |
|--------|---------|-------------|-----------|
| **Homepage** | Ring + tiles | Tile focus | Geen seizoen |
| **Kader** | Tabel + rollen | Rol-select focus | Geen kaders |
| **Memo** | Kanban kolommen | Column focus | Geen items |

**NIET in snapshots** (too dynamic):
- ❌ Werkbord (drag-state, overlay)
- ❌ Personen (filter, pagination)
- ❌ What-if canvas

**Configuratie**:
```typescript
test("homepage: visual — default state", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage-default.png");
});

test("homepage: visual — focus state", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page).toHaveScreenshot("homepage-focus.png");
});
```

**Baseline management**:
- Gegenereerd: `pnpm test:e2e:ti-studio-v2 -- --update-snapshots`
- CI: Vergelijkt tegen baseline. Fails op pixel-verschil (threshold: 1%).
- Update: Handmatig na design-wijzigingen, reviewed in PR

**Opslag**: `e2e/ti-studio-v2/__screenshots__/`

---

## 7. Test-coverage-matrix: 5 scenario's per pagina

Minimaal-set voor v2 MVP (geen exhaustieve test-suite):

### 7.1 Werkbord (`/indeling`)
```
1. ✅ Canvas laadt met teams zichtbaar
2. ✅ SpelersPool drawer opent/sluit
3. 🔄 Speler verplaatsen tussen teams (drag-drop helper)
4. 🔄 What-if versie aanmaken
5. ✅ Toolbar versie-badge updatet
```

### 7.2 Personen — Spelers (`/personen/spelers`)
```
1. ✅ Tabel laadt met zoeken
2. ✅ Status filter werkt (bijv. "Ingedeeld")
3. 🔄 Inline edit: status wijzigen
4. ✅ Speler-dialog opent en toont profiel
5. ✅ Leeftijdscel toont juiste kleur (age category)
```

### 7.3 Personen — Staf (`/personen/staf`)
```
1. ✅ Staf-tabel laadt
2. ✅ Nieuwe staf-dialog opent
3. 🔄 Staf toevoegen persisteert
4. ✅ Staf-profiel-dialog toont details
5. ✅ Zoeken in staf-tabel werkt
```

### 7.4 Personen — Reserveringen (`/personen/reserveringen`)
```
1. ✅ Reserveringen-tabel laadt
2. ✅ Nieuwe reservering dialog opent
3. 🔄 Reservering aanmaken werkt
4. ✅ Reservering verwijderen
5. ✅ Filter op status/team
```

### 7.5 Memo (`/indeling/memo`)
```
1. ✅ Memo Kanban laadt (kolommen zichtbaar)
2. ✅ Memo-kaart opent dialoog
3. 🔄 Memo naar andere kolom verplaatsen
4. ✅ Zoeken in memo's werkt
5. ✅ Memo-badge tel (open/bespreking) klopt
```

### 7.6 Kader (`/indeling/kader`)
```
1. ✅ Kader-pagina laadt per team
2. ✅ Team-selector werkt
3. 🔄 Kader-rij toevoegen/verwijderen
4. ✅ Validatie: geen dubbele rollen per speler
5. ✅ Kader persisteert na reload
```

### 7.7 Homepage (`/`)
```
1. ✅ Homepage laadt met volledigheidring
2. ✅ Tiles zichtbaar (Werkbord, Personen, Memo, Kader)
3. ✅ Seizoen-badge + live puls-dot zichtbaar
4. ✅ Stats tellen correct (ingedeeld/totaal)
5. ✅ Click Werkbord navigeert naar /indeling
```

**Implementatie**: Elk scenario → 1 `test()` met duidelijke naam (Nederlands). Gegroepeerd per `test.describe()` per pagina.

**Legend**:
- ✅ = Selector-based, onafhankelijk van drag-drop
- 🔄 = Vereist server action of drag-drop (fallback naar `.skip()` als onbetrouwbaar)

**Decision voor Antjan**: 
- 5 scenario's per pagina voldoende? (Kunnen later uitbreiden.)
- Skip-rate acceptabel voor drag-drop testen?

---

## 8. CI-workflow: Aparte `.github/workflows/ci-v2.yml`

**Definitieve keuze (2026-05-13)**: Aparte workflow `ci-v2.yml` met path-filter.

**Trigger**:
- Path-filter: `apps/ti-studio-v2/**` en `e2e/ti-studio-v2/**`
- Push naar `main` of branches
- Geen deploy (v2 draait lokaal op poort 3002)

**Jobs**:
1. **fast-gate**: typecheck, lint, format, unit tests
2. **e2e-v2**: `pnpm test:e2e:ti-studio-v2` (4 workers, CI=true)
3. **snapshots** (optional): Upload baseline diffs

**Workflow template**:
```yaml
name: CI — TI Studio v2

on:
  push:
    branches: [main]
    paths:
      - "apps/ti-studio-v2/**"
      - "e2e/ti-studio-v2/**"
      - "packages/**"  # shared deps

jobs:
  fast-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm fast-gate

  e2e-v2:
    needs: fast-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts
      - run: pnpm test:e2e:ti-studio-v2
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

**Post-cutover** (fase 4):
- Rename `ci.yml` → `ci-v1-legacy.yml`
- Rename `ci-v2.yml` → `ci.yml`
- Remove v1 path-filter (ci.yml draait voor alle pushes)

---

## 9. Performance-budget: <10 min totaal

**Huidige v1 baselines** (per april 2026):
- 288 tests, ~8 min totaal CI (6m45s E2E)
- 2 workers (bottleneck)

**v2 doel**: 
- ~70-80 tests (MVP scope)
- <3 min totaal E2E
- 4 workers parallelle

**Mitigaties**:
1. **Minimize flake**: Geen retry-heavy tests. Keep selectors stable.
2. **Seed-centralisatie**: Eenmaal seeden (via `setup` fixture), niet per test.
3. **Disable snapshots in CI** tot v2 stabiel (snapshots slow down by ~20%).
4. **No unnecessary waits**: `waitFor()` only met timeout guards; prefer `waitForSelector()`.
5. **Database isolation**: Test-data cleanup na suite (batch via `.afterAll()`).

**Monitor**: CI logs `test-results.xml` en duration per test. Flag tests >10s.

**Decision voor Antjan**: 
- Budget van <10 min OK? (Strenger dan v1 ~8 min)
- Snapshot-disable tot stable OK?

---

## 10. Implementatie-roadmap

### Fase 0 (Pre-build): Foundation
- [ ] `playwright.config.ts` uitbreiden met `ti-studio-v2` project + webServer
- [ ] `e2e/fixtures/seed-ti-studio-v2.ts` schrijven
- [ ] `e2e/ti-studio-v2.setup.ts` aanmaken (seed runner)
- [ ] `e2e/helpers/dnd-kit.ts` implementeren
- [ ] `data-testid` conventie doc schrijven + checklist
- [ ] `.github/workflows/ci-v2.yml` template aanmaken (manual dispatch)

**Owner**: E2E tester  
**Timeline**: 3 days (parallel met v2 prototype build)

### Fase 1 (Wave 1): Werkbord + Personen
- [ ] `e2e/ti-studio-v2/werkbord.spec.ts` — 5 scenario's
- [ ] `e2e/ti-studio-v2/personen.spec.ts` — 15 scenario's (spelers + staf + reserveringen)
- [ ] Drag-drop helpers tested + documented
- [ ] CI-v2 workflow groen

**Owner**: E2E tester  
**Timeline**: 5 days (start na Werkbord v2 component build)

### Fase 2 (Wave 2): Memo + Kader + Homepage
- [ ] `e2e/ti-studio-v2/memo.spec.ts` — 5 scenario's
- [ ] `e2e/ti-studio-v2/kader.spec.ts` — 5 scenario's
- [ ] `e2e/ti-studio-v2/homepage.spec.ts` — 5 scenario's
- [ ] Snapshots baseline (optional, afhankelijk van design-freeze)

**Owner**: E2E tester  
**Timeline**: 3 days (start na Memo/Kader component build)

### Fase 3 (Cutover): v1 → v2 migratie
- [ ] v1 tests archiveren (move `e2e/ti-studio/*` → `e2e/ti-studio-legacy/`)
- [ ] Merge ci-v2.yml → ci.yml (replace test command)
- [ ] Database cutover (v2 versies/werkindeling live)
- [ ] Smoke test (5 min E2E op productie)

**Owner**: Product owner (via release agent)  
**Timeline**: 1 day (geplande cutover moment)

---

## Definitieve keuzes 2026-05-13

| # | Beslissing | Goedgekeurd | Implementatie |
|---|-----------|-----------|---------------|
| **1** | **Test-data cleanup** | ✅ Snapshot-restore per CI-run | `SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts` vóór E2E |
| **2** | **Drag-drop library** | ✅ Pragmatic Drag and Drop | NIET dnd-kit; native HTML5 + `page.dragTo()` |
| **3** | **data-testid conventie** | ✅ `{component}-{id}-{context}` | Tabel in sectie 5 |
| **4** | **CI-workflow** | ✅ Aparte `ci-v2.yml` met path-filter | Tot cutover, dan rename naar `ci.yml` |
| **5** | **Visual regression** | ✅ Selectief (homepage, kader, memo) | NIET werkbord; 3 baselines per pagina |

---

## Bijlagen

### A. Commando's

```bash
# Lokaal
pnpm test:e2e:ti-studio-v2           # Draai alle v2 tests
pnpm test:e2e:ti-studio-v2 -- -g "werkbord"  # Alleen werkbord tests
pnpm test:e2e:ti-studio-v2 -- --update-snapshots  # Update baselines

# CI (snapshot-restore)
SNAPSHOT_TARGET=railway-test pnpm tsx scripts/snapshot-prod-to-dev.ts
pnpm test:e2e:ti-studio-v2           # Via ci-v2.yml
```

### B. File structure (updated)

```
e2e/
├── fixtures/
│   ├── base.ts                      (bestaand)
│   └── cleanup.ts                   (bestaand)
├── ti-studio/                       (v1, bestaand)
├── ti-studio-v2/                    (NIEUW)
│   ├── werkbord.spec.ts
│   ├── personen.spec.ts
│   ├── memo.spec.ts
│   ├── kader.spec.ts
│   ├── homepage.spec.ts
│   └── __screenshots__/             (baseline snapshots — 3 per pagina)
└── auth.setup.ts                    (bestaand)

.github/workflows/
├── ci.yml                           (bestaand, v1)
└── ci-v2.yml                        (NIEUW tot cutover, path-filter)

scripts/
└── snapshot-prod-to-dev.ts          (bestaand, TEST-DB snapshot-restore)
```

### C. Aftastbaarheid

Alle tests gebruiken:
- Logging via `page.on("console", ...)` voor debugging
- Trace-mode op retry: `trace: "on-first-retry"`
- HTML-report lokaal: `pnpm test:e2e:ti-studio-v2 && open playwright-report/index.html`

---

---

## Fase 0 — Implementatie roadmap (update 2026-05-13)

### Taken
- [ ] `playwright.config.ts` uitbreiden met `ti-studio-v2` project + webServer env (→ `oranjewit-test` DB)
- [ ] `@atlaskit/pragmatic-drag-and-drop` dependency in `apps/ti-studio-v2` toevoegen
- [ ] `data-testid` checklist (sectie 5) naar v2 component-build guidelines
- [ ] `.github/workflows/ci-v2.yml` template aanmaken (path-filter, snapshot-restore step, 4 workers)
- [ ] `docs/superpowers/specs/2026-05-13-fase-0-richtlijnen.md` communiceren

**Owner**: E2E tester  
**Timeline**: 2 days (parallel met v2 app-build)
