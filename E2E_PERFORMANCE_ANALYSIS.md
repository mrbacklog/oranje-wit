# E2E Test Suite — Performance Analyse

## 1. Test Omvang

**Totale aantallen:**
- 38 test bestanden
- 259 tests
- 5.316 lines of code

**Verdeling per domein:**

| Domein | Bestanden | Tests | Dominante bestanden |
|--------|-----------|-------|---------------------|
| **Scouting** | 9 | 141 | scouting-v3 (44 tests), scouting-verzoeken (46 tests) |
| **Evaluatie** | 5 | 34 | admin-rondes (8), navigatie (13) |
| **Monitor** | 10 | 33 | geen dominanten, verdeeld |
| **Team-Indeling** | 4 | 29 | scenario-wizard (10), werkbord (7) |
| **Beheer** | 5 | 28 | geen dominanten |
| **Cross-domain** | 1 | 13 | navigatie-cross-domain (13) |
| **Design-system** | 1 | 22 | design-system.spec.ts (22) |
| **TOTAAL** | **38** | **259** | --- |

---

## 2. Playwright Configuratie (Status Quo)

**Uit `playwright.config.ts`:**

| Parameter | Waarde | Beschrijving |
|-----------|--------|-------------|
| `fullyParallel` | true | Tests paralleliseren (goed) |
| `forbidOnly` | true (CI) | `.only` niet toegestaan in CI (goed) |
| `retries` | 2 (CI) | Bij flaky test: 3x uitvoeren (slow) |
| **`workers`** | **2 (CI)** | **KNELPUNT: veel te laag** |
| `reporter` | github (CI) | Resultaten in PR comment |
| `locale` | nl-NL | Correct |
| `baseURL` | localhost:3000 | Correct |
| `trace` | on-first-retry | Traces opslagen bij retry (storage overhead) |
| `webServer.command` | pnpm dev:web | Dev server auto-start |
| `webServer.reuseExistingServer` | false (CI) | Fresh start per run |

**Kernprobleem:** Met 2 workers en 259 tests = veel sequentiële overhead. Bij 4-6 workers zou parallel efficiency veel beter zijn.

---

## 3. CI Pipeline Timing

**Uit `.github/workflows/ci.yml`:**

```
Quality                    Build                E2E
├─ typecheck (1 min)       ├─ build (5-10 min)  ├─ db:push (2-3 min)
├─ lint (1 min)            └─ cache hit         ├─ seed (1-2 min)
├─ format (1 min)                               ├─ playwright-install (1-2 min, cached)
└─ unit tests (2-3 min)                         └─ 259 tests × 2 workers (15-25 min)
│ Totaal: ~5-10 min │                │ Totaal: ~5-10 min │  │ Totaal: 20-35 min │
```

**Kritische path:** E2E tests zijn dominant (65-70% van totale CI runtime).

**E2E bottlenecks:**

1. Database seed (TST-data) — sequentieel, ~1-2 min
2. Playwright install (eerste run) — onnodig bij cache hit
3. **2 workers** — veel sequentiële tests
4. Conditional test.skip() — overhead zonder tests uit te voeren

---

## 4. Test-inhoud: Kritisch vs. Uitgebreid

### Smoke Tests (Happy Path)

Per domein minimale navigatie/load test:

- **Monitor**: dashboard KPI load + navigatie naar spelers (2-3 tests)
- **Evaluatie**: navigatie naar rondes + pagina load (2-3 tests)
- **Scouting**: dashboard + zoeken speler (2-3 tests)
- **Team-Indeling**: werkbord load (1-2 tests)
- **Beheer**: intro pagina + systeem check (1-2 tests)
- **Cross-domain**: shell navigatie + bottom-nav (3-4 tests)

**Totaal smoke scope: ~20-30 tests, ~3-5 minuten**

### Regression Tests (Flows & Edge Cases)

- **Scouting dominatoren** (141 tests):
  - Rapport-wizard (individueel: 5-10 stappen per test)
  - Verzoeken (TC-flow, detail, scouting methods)
  - Team-scouting methode
  - Vergelijking methode
  - Veel tests wachten op wizard navigation

- **Evaluatie** (34 tests):
  - Admin-rondes flow
  - Trainer evaluatie
  - Zelfevaluatie
  - Coordinator checks

- **Monitor** (33 tests):
  - Signalering detail
  - Retentie berekening
  - Projections
  - Teams samenstelling

- **Design-system** (22 tests):
  - Visual snapshot regression
  - Component rendering per sectie

---

## 5. Problematische Patterns Gevonden

### A. Dubbele Tests (30-40% Overlap)

**scouting-v3.spec.ts vs scouting-verzoeken.spec.ts:**

Beide bevatten:
- Individueel rapport wizard
- Team-scouting methode
- Vergelijking methode
- Navigatie checks

**Impact:** ~20-25 duplicaatTests, onnodig gebruik van workers & runtime

### B. Conditional test.skip() (94 instances)

Veel tests skipped op basis van TC-rol:

```ts
test.beforeEach(async ({ page }) => {
  if (!heeftTCRol) test.skip();
});
```

**Impact:** Setup overhead (TC-check via API) zonder test uit te voeren

### C. Hard-coded Timeouts (10-20 sec)

```ts
await expect(page.getByRole("heading")).toBeVisible({ timeout: 20000 });
```

Cumulatief: 259 × gemiddeld 10 sec wachten = significant time loss

### D. Wizard Flow Tests (50-100 sec per test)

Scouting rapport-wizard: 5-10 stappen per test, veel wachten op page updates

---

## 6. Design-System (Special Case)

**Visual Regression Tests (22 tests):**

- Draait in aparte `design-system` project
- Eerste run: genereert 18 baseline screenshots
- Nadien: vergelijkt snapshots (sneller)
- Flag: `--update-snapshots` na design wijzigingen

**Timing:** 2-3 min per run (veel I/O for snapshot comparisons)

---

## 7. Tiering Strategy

### TIER 1: Fast Smoke (5-8 min in parallel, ~30 tests)

**Doel:** Quick feedback in PR checks

```
Monitor/dashboard → load + KPI visible
Evaluatie/nav → rondes page loads
Scouting/dashboard → zoeken werkt
TI/werkbord → loads
Beheer/systeem → intro OK
Cross-domain/shell → nav OK
```

**CI placement:** Run ALWAYS (parallel met quality/build jobs)

### TIER 2: Regression (20-25 min, ~150 tests)

**Doel:** Full coverage voor merges naar main

- Full scouting flows (rapport, verzoeken, team-scouting)
- Evaluatie admin flows
- Monitor signalering/retentie/projections
- Team-indeling scenario-wizard
- Design-system snapshots

**CI placement:** Run on main, optional on PR

### TIER 3: Post-Deploy (5 min, ~40 tests)

**Doel:** Smoke tests tegen live app

- Read-only navigatie
- Health endpoints
- Critical pages load

**CI placement:** After Railway deploy succeeds

---

## 8. Root Cause Analysis: Waarom Slow?

| Oorzaak | % Impact | Bewijs |
|---------|----------|--------|
| **2 workers** | 30-35% | 259 tests, max 2 parallel ≠ 6-8 possible |
| **Hard timeouts** | 10-15% | 20 sec per expectation, often unnecessary |
| **Dubbele tests** | 10-12% | 20-25 tests in scope |
| **Conditional skip()** | 5-8% | 94 instances, API overhead |
| **Wizard flows** | 8-10% | Multi-step tests, long interactions |
| **Database seed** | 5-7% | Sequentieel, ~1-2 min |
| **Overhead (auth, startup)** | 5-8% | Per test-session |

---

## 9. Concrete Aanbevelingen

### Quick Wins (Week 1) — Immediate Impact

#### 1. **Workers verhogen van 2 → 4-6**

```diff
  export default defineConfig({
-   workers: process.env.CI ? 2 : undefined,
+   workers: process.env.CI ? 4 : undefined,
  });
```

**Impact:** -30% test runtime (259 tests parallel meer efficient)  
**Risk:** Low (fullyParallel=true is safe)

#### 2. **Conditionele skip() optimaliseren**

Huidge:
```ts
test.beforeEach(async ({ page }) => {
  const heeftTC = await isTC(page);
  if (!heeftTC) test.skip();
});
```

Beter (skip whole describe-block):
```ts
test.describe("TC-only flows", () => {
  // Skip hele blok als rol ontbreekt
  test.skip(!userHasTC);
  
  test("verzoek aanmaken", async ({ page }) => { ... });
});
```

**Impact:** -10% setup overhead  
**Risk:** Low

#### 3. **Timeouts reduceren (context-aware)**

```diff
- await expect(...).toBeVisible({ timeout: 20000 });
+ // Navigation/load: 10 sec
+ // Component render: 5 sec
+ // User interaction response: 3-5 sec
+ await expect(...).toBeVisible({ timeout: 10000 });
```

**Impact:** -10% waiting time  
**Risk:** Requires profiling; use `--reporter=list` to see actual times

### Short-Term (1-2 weeks) — Structural Improvements

#### 4. **Smoke Test Suite scheiden**

**Creëer `e2e/smoke/` directory:**

```
e2e/smoke/
├─ monitor.spec.ts       (3 tests)
├─ evaluatie.spec.ts     (2 tests)
├─ scouting.spec.ts      (2 tests)
├─ teamindeling.spec.ts  (2 tests)
├─ shell.spec.ts         (4 tests)
└─ setup.ts              (auth)
```

**Voeg test-script toe in package.json:**

```json
{
  "test:e2e:smoke": "playwright test e2e/smoke --project=web"
}
```

**Update CI voor PR checks:**

```yaml
e2e-smoke:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    # ... setup ...
    - run: pnpm test:e2e:smoke
```

**Impact:** PR feedback in 5-8 min vs. 20-35 min  
**Risk:** Low (smoke tests are read-only)

#### 5. **Dubbele Scouting Tests Consolideren**

**scouting-v3.spec.ts vs scouting-verzoeken.spec.ts overlap:**

Merge naar single `e2e/scouting/flows.spec.ts`:

```ts
// Verwijder dubbele "Individueel rapport" describe-blocks
// Verwijder dubbele "Team-scouting" describe-blocks
// Keep beide "Verzoeken" flow (unique)
```

**Impact:** -20-25 tests, -15% scouting runtime  
**Risk:** Medium (requires careful audit of semantic differences)

#### 6. **Profile-caching in Fixtures**

**Maak `e2e/fixtures/cache.ts`:**

```ts
let cachedProfile: ScoutProfile | null = null;

export async function getScoutProfile(page: Page) {
  if (!cachedProfile) {
    const res = await page.request.get("/api/scouting/scout/profiel");
    cachedProfile = await res.json();
  }
  return cachedProfile;
}
```

**Usage in tests:**

```ts
test.beforeEach(async ({ page }) => {
  const profile = await getScoutProfile(page);
  if (profile.rol !== "TC") test.skip();
});
```

**Impact:** -40 API calls, -2-3 min database load  
**Risk:** Low (caching scoped per test-session)

### Medium-Term (2-3 weeks) — Structural Optimization

#### 7. **Database Seeding Paralleliseren**

Huidge: Loop-based inserts (slow)

```ts
// SLECHT
for (const team of teams) {
  await prisma.team.create({ data: team });
}
```

Beter: Bulk insert + nested creates

```ts
// BETER
await prisma.team.createMany({
  data: teams,
  skipDuplicates: true,
});
```

**Impact:** -1-2 min seed time  
**Risk:** Low

#### 8. **Design-System Snapshots Cachen**

Huidge: Every CI run generates baselines

```yaml
# CI: eerste run genereert baseline, nadien diffs
- name: Design-system tests
  run: pnpm test:e2e:design-system
```

Beter: Baselines cachen als artefact

```yaml
- name: Cache design-system baselines
  uses: actions/cache@v4
  with:
    path: e2e/tests/__snapshots__
    key: design-system-${{ runner.os }}-${{ hashFiles('packages/ui/**') }}

- name: Design-system tests
  run: pnpm test:e2e:design-system
```

**Impact:** -2-3 min snapshot generation  
**Risk:** Low

#### 9. **Branch-aware Playwright Config**

Huidge: Same config voor PR + main

```ts
// Beter
workers: process.env.CI ? (process.env.GITHUB_BASE_REF ? 4 : 6) : undefined,
retries: process.env.CI ? (process.env.GITHUB_BASE_REF ? 0 : 2) : 0,
```

**Policy:**
- **PR checks:** 4 workers, 0 retries → fast feedback (5-10 min)
- **Main merge:** 6 workers, 2 retries → stable build (12-18 min)

**Impact:** -20-30% PR check time  
**Risk:** Low (retries disabled for fast PR feedback)

### Long-Term (Post-Release) — Live Verification

#### 10. **Post-Deploy E2E Verification**

**Creëer `e2e/live/` directory met production smoke tests:**

```ts
// e2e/live/production.spec.ts
const LIVE_URL = process.env.LIVE_URL || "https://monitor.ckvoranjewit.app";

test("production /monitor loads", async ({ page }) => {
  await page.goto(LIVE_URL);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
```

**CI trigger via Railway webhook:**

```yaml
live-smoke:
  if: github.event_name == 'workflow_dispatch' && inputs.environment == 'production'
  runs-on: ubuntu-latest
  env:
    LIVE_URL: https://monitor.ckvoranjewit.app
  steps:
    - run: pnpm test:e2e:live
```

**Impact:** Confidence check na deploy, geen dev-server overhead  
**Risk:** Low (read-only tests)

---

## 10. Implementatie Roadmap

### Week 1 (Immediate — Target: -30% E2E time)

- [ ] Workers: 2 → 4
- [ ] Optimize timeouts (audit actual times first)
- [ ] Fix conditional skip() patterns
- [ ] Profile-caching in fixtures

**Expected gain: 15-20 min → 10-14 min E2E**

### Week 2-3 (Short-term — Target: -40-50%)

- [ ] Create e2e/smoke/ suite
- [ ] Consolidate scouting dubbele tests
- [ ] Parallelize database seed
- [ ] Setup PR workflow: run smoke only

**Expected gain: 10-14 min → 6-8 min E2E (PR), full suite on main**

### Week 4+ (Long-term)

- [ ] Cache design-system snapshots
- [ ] Branch-aware config (workers/retries)
- [ ] Post-deploy smoke tests
- [ ] Monitor CI times weekly

**Expected total gain: 20-35 min → 8-15 min total CI runtime**

---

## 11. Metrics to Track

**Add to CI reporting:**

```yaml
- name: Report E2E duration
  run: |
    echo "E2E runtime:" >> $GITHUB_STEP_SUMMARY
    grep "passed\|failed" playwright-report/index.html >> $GITHUB_STEP_SUMMARY
```

**Monthly cadence:**
- Average E2E time per branch (PR vs main)
- Test flakiness rate (% of retries triggered)
- Worker utilization (parallel efficiency)

---

## 12. Risks & Mitigations

| Risk | Mitigate |
|------|----------|
| Flaky tests from high workers | Use `test.describe.serial()` for state-sharing tests |
| Lower timeouts miss real issues | Profile with `--reporter=list` first; use per-test-type timeouts |
| Removing tests loses coverage | Audit overlap first; document semantic differences |
| Smoke suite incomplete | Version smoke tests along with main regression suite |
| Post-deploy tests fail silently | Add Slack notification on failure |

---

## 13. Summary

**Huidge stand:** 259 tests, 5.3K LOC, E2E dominant (20-35 min), 2 workers, dubbele tests, hard timeouts

**Quick wins (week 1):** +4 workers, timeout tuning, profile caching → **-30% E2E time**

**Structural (week 2-3):** Smoke suite, consolidate dubbele tests, parallelize seed → **-40-50% total time**

**Long-term:** Post-deploy verification, branch-aware config → **sustainable fast shipping**

**Bottom line:** Ship 40-50% faster without quality loss, by removing parallelization bottlenecks and test duplication.
