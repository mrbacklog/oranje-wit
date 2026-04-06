# E2E Test Performance — Quick Wins Checklist

## TIER 1: Immediate Actions (Can do today, -30% runtime)

### 1.1 Verhoog Workers (5 min implementation, -30% impact)

**File:** `playwright.config.ts` line 8

```diff
  workers: process.env.CI ? 2 : undefined,
+ workers: process.env.CI ? 4 : undefined,
```

**Why:** With 259 tests and 2 workers, most are queued. 4-6 workers use available CI resources.

**Risk:** None (fullyParallel=true is designed for this)

**Test before commit:**
```bash
pnpm test:e2e --workers=4 2>&1 | grep -i "passed\|failed"
```

---

### 1.2 Reduce Hard-Coded Timeouts (10 min audit, -10% impact)

**Audit current timeouts:**

```bash
grep -r "timeout.*[0-9][0-9]000" e2e --include="*.spec.ts" | wc -l
```

**Expected:** ~80-100 hard-coded timeouts

**Recommended values by context:**

- **Page navigation:** 10 sec (was 20)
- **Component render:** 5 sec (was 10-20)
- **User interaction:** 3-5 sec (was 5-10)
- **Data load:** 10 sec (was 20)

**Sample fix:**

```diff
- await expect(page.getByRole("heading")).toBeVisible({ timeout: 20000 });
+ await expect(page.getByRole("heading")).toBeVisible({ timeout: 10000 });
```

**How to find & fix systematically:**

```bash
# Find all 20000+ timeouts
grep -r "timeout.*2[0-9]000" e2e --include="*.spec.ts" -l

# Recommend each one be 10000 unless justified (navigation)
```

**Risk:** Low (test with actual times first; some tests may need 10-20s)

---

### 1.3 Profile-Caching in Fixtures (15 min implementation, -2-3 min impact)

**File:** Create `e2e/fixtures/scout-profile.ts`

```ts
// e2e/fixtures/scout-profile.ts
import type { Page } from "@playwright/test";

export interface ScoutProfile {
  scout: {
    rol: "TC" | "SCOUT" | "VIEWER" | null;
    naam?: string;
  };
}

let cachedProfile: ScoutProfile | null = null;

/**
 * Get scout profile from API, cached per test-session.
 * Prevents repeated API calls for role checks.
 */
export async function getScoutProfile(page: Page): Promise<ScoutProfile> {
  if (!cachedProfile) {
    try {
      const res = await page.request.get("/api/scouting/scout/profiel");
      if (!res.ok()) return { scout: { rol: null } };
      cachedProfile = await res.json();
    } catch {
      return { scout: { rol: null } };
    }
  }
  return cachedProfile;
}

export function resetScoutProfileCache() {
  cachedProfile = null;
}
```

**Usage in tests:**

```diff
- async function isTC(page: Page): Promise<boolean> {
-   const res = await page.request.get("/api/scouting/scout/profiel");
-   const data = await res.json();
-   return data.data?.scout?.rol === "TC";
- }

+ import { getScoutProfile } from "../fixtures/scout-profile";
+
+ async function isTC(page: Page): Promise<boolean> {
+   const profile = await getScoutProfile(page);
+   return profile.scout?.rol === "TC";
+ }
```

**Example from scouting-verzoeken.spec.ts (line 37-45):**

Replace the `isTC()` helper with caching version.

**Impact:** 94 instances of `isTC()` calls → 1 API call instead of many

**Risk:** Low (cache is scoped to page-session)

---

### 1.4 Optimize Conditional Skip (10 min implementation, -5-10% impact)

**Current pattern (94 instances):**

```ts
test.beforeEach(async ({ page }) => {
  if (!await isTC(page)) test.skip();
});
```

**Problem:** Overhead even when test skips

**Better pattern:**

```ts
// Test TC-rol once before the describe-block
let userHasTC = false;
test.beforeAll(async ({ page }) => {
  const profile = await getScoutProfile(page);
  userHasTC = profile.scout?.rol === "TC";
});

test.describe("TC-only flows", () => {
  test.skip(!userHasTC);

  test("verzoek aanmaken", async ({ page }) => {
    // Tests skip if TC-rol missing
  });
});
```

**Files to update:**

- `e2e/scouting/scouting-verzoeken.spec.ts` (lines 89-98)
- `e2e/scouting/scouting-v3.spec.ts` (similar pattern)
- `e2e/scouting/rapport.spec.ts`
- `e2e/scouting/team-scouting.spec.ts`
- `e2e/scouting/spelerprofiel.spec.ts`
- `e2e/evaluatie/admin-rondes.spec.ts`

**Impact:** Moves role check from per-test to per-describe, -5-10% setup overhead

**Risk:** Low (same logic, different structure)

---

## TIER 2: Quick Structural Changes (Week 1-2, -40-50% total)

### 2.1 Create Smoke Test Suite (2 hours implementation, -50% PR time)

**Goal:** Fast feedback in PR checks (5-8 min vs 20-35 min)

**Structure:**

```
e2e/smoke/
├─ monitor.spec.ts       # 3-4 critical tests
├─ evaluatie.spec.ts     # 2-3 critical tests
├─ scouting.spec.ts      # 2-3 critical tests
├─ teamindeling.spec.ts  # 2 critical tests
├─ beheer.spec.ts        # 1-2 critical tests
├─ shell.spec.ts         # 3-4 critical tests (cross-domain)
└─ fixtures.ts           # share test setup
```

**Smoke tests = happy-path read-only navigation, ~25-30 total tests**

**Example: `e2e/smoke/monitor.spec.ts`**

```ts
import { test, expect } from "../fixtures/base";

test.describe("Monitor Smoke", () => {
  test("dashboard loads with KPI cards", async ({ page }) => {
    await page.goto("/monitor");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 10000,
    });
    // Minimal: hero metric + 3 KPI cards visible
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /spelende leden/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /Teams \d+/ })).toBeVisible();
  });

  test("can navigate to spelers", async ({ page }) => {
    await page.goto("/monitor");
    const main = page.getByRole("main");
    const heroLink = main.getByRole("link", { name: /spelende leden/i });
    await expect(heroLink).toBeVisible({ timeout: 10000 });
    await heroLink.click();
    await expect(page).toHaveURL("/monitor/spelers");
  });

  test("bottom nav smoke", async ({ page }) => {
    await page.goto("/monitor");
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav.getByText("Overzicht")).toBeVisible();
    await expect(nav.getByText("Teams")).toBeVisible();
  });
});
```

**Add to `package.json`:**

```json
{
  "test:e2e:smoke": "playwright test e2e/smoke --project=web"
}
```

**Update CI `.github/workflows/ci.yml`:**

Add parallel job for PR checks:

```yaml
e2e-smoke:
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 9.15.0
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm db:generate
    # ... db setup (see full CI) ...
    - run: pnpm test:e2e:smoke

e2e-full:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  # ... full 259 tests ...
```

**Impact:**
- PR checks: 5-8 min (smoke) vs 20-35 min (full)
- Main merge: still get full coverage

---

### 2.2 Consolidate Duplicate Scouting Tests (3-4 hours, -15-20% scouting time)

**Root cause:** `scouting-v3.spec.ts` (44 tests) and `scouting-verzoeken.spec.ts` (46 tests) overlap ~30-40%

**Overlap audit:**

```
DUPLICATE DESCRIBE-BLOCKS:

scouting-v3.spec.ts:
  ✓ Individueel rapport (INDIVIDUEEL methode) — 10 tests
  ✓ Team-scouting (TEAM methode) — 6 tests
  ✓ Vergelijking (VERGELIJKING methode) — 8 tests
  ✓ Scouting navigatie — 3 tests

scouting-verzoeken.spec.ts:
  ✓ Individueel rapport (volledige flow) — 9 tests  [DUPLICATE OF ABOVE]
  ✓ Team-scouting (TEAM methode) — 7 tests          [DUPLICATE OF ABOVE]
  ✓ Vergelijking (VERGELIJKING methode) — 6 tests   [DUPLICATE OF ABOVE]
  ✓ Scouting: navigatie vanuit verzoeken — 2 tests  [DUPLICATE OF ABOVE]

UNIQUE TO scouting-verzoeken:
  ✓ Verzoeken-pagina (3 tests)
  ✓ Verzoeken aanmaken TC-flow (13 tests)  ← KEEP THIS
  ✓ Verzoek detail pagina (2 tests)
  ✓ Verzoeken API (endpoint-level) (1 test)

UNIQUE TO scouting-v3:
  ✓ Spelerskaart weergave (8 tests)
  ✓ Admin raamwerk (6 tests)
  ✓ Pijlerevolutie (3 tests)
  ✓ USS v2 berekening (2 tests)
```

**Strategy:**

1. **Keep scouting-verzoeken.spec.ts** — TC-flow is unique
2. **Prune scouting-v3.spec.ts** — remove duplicate wizard/navigation tests
3. **Final state:**
   - scouting-verzoeken.spec.ts: 46 tests (TC workflows + API)
   - scouting-v3.spec.ts: 20-25 tests (admin/USS/pijlers only)
   - Total: ~70 instead of 90 (overlap gone)

**Implementation:**

```bash
# Backup before editing
cp e2e/scouting/scouting-v3.spec.ts e2e/scouting/scouting-v3.spec.ts.backup

# Remove from scouting-v3:
#   - Individueel rapport (INDIVIDUEEL methode) describe-block [~10 tests]
#   - Team-scouting (TEAM methode) describe-block [~6 tests]
#   - Vergelijking (VERGELIJKING methode) describe-block [~8 tests]
#   - Scouting navigatie describe-block [~3 tests]
```

**Keep in scouting-v3:**
- Admin raamwerk
- Pijlerevolutie
- USS v2 berekening
- Spelerskaart weergave (card-tab only)

**Impact:** -20-25 tests, -15% scouting runtime

**Risk:** Medium — requires code review to ensure no unintended test loss

---

### 2.3 Parallelize Database Seeding (1 hour implementation, -1-2 min impact)

**File:** `e2e/fixtures/seed.ts`

**Current:** Loop-based, sequential inserts

```ts
// CURRENT (slow)
for (const team of teams) {
  await prisma.team.create({ data: team });
}
```

**Optimized:** Bulk operations

```ts
// BETTER: Parallel batch creates
const teamIds = await Promise.all(
  teams.map((team) =>
    prisma.team.create({ data: team }).then((t) => t.id)
  )
);

// Or use raw SQL for even faster bulk insert
await prisma.$executeRaw`
  INSERT INTO team (naam, seizoen_id, created_at)
  VALUES ${teams.map((t) => `('${t.naam}', ${t.seizoen_id}, NOW())`).join(",")}
  ON CONFLICT DO NOTHING
`;
```

**Check seed performance:**

```bash
time pnpm dlx tsx e2e/fixtures/seed.ts
```

Expected: 1-2 min → target 30-60 sec

**Risk:** Low (seed is idempotent with TST-prefix)

---

## TIER 3: Long-Term Structural (Week 4+)

### 3.1 Branch-Aware Playwright Config

**File:** `playwright.config.ts`

```ts
const isPullRequest = !!process.env.GITHUB_BASE_REF;

export default defineConfig({
  workers: process.env.CI
    ? isPullRequest
      ? 4  // PR: fast feedback
      : 6  // main: parallel efficiency
    : undefined,
  retries: process.env.CI
    ? isPullRequest
      ? 0  // PR: fast feedback, fail fast
      : 2  // main: stable, retries allowed
    : 0,
  // ... rest
});
```

**Impact:** -20-30% PR time, stable main builds

---

### 3.2 Cache Design-System Baselines

**File:** `.github/workflows/ci.yml`

```yaml
- name: Cache design-system baselines
  uses: actions/cache@v4
  with:
    path: e2e/tests/__snapshots__
    key: design-system-${{ runner.os }}-${{ hashFiles('packages/ui/**') }}
    restore-keys: |
      design-system-${{ runner.os }}-
```

**Impact:** -2-3 min snapshot generation on cache hit

---

## Validation Checklist

Before committing changes:

- [ ] Run `pnpm test:e2e` locally and record time
- [ ] Run `pnpm test:e2e:smoke` (new suite) and record time
- [ ] Verify no new test failures
- [ ] Check `playwright-report/index.html` for flaky tests
- [ ] Verify PR automation works correctly
- [ ] Monitor first 3-5 CI runs for stability

---

## Expected Results (Timeline)

| Phase | When | Changes | E2E Runtime | Effort |
|-------|------|---------|-------------|--------|
| **Tier 1** | Week 1 | Workers +timeout+caching | ~15 min | 1 day |
| **Tier 2** | Week 1-2 | Smoke suite + dubbele tests | ~8-10 min (PR) / ~15 min (main) | 3-5 days |
| **Tier 3** | Week 3-4 | Branch config + caching | ~7-8 min (PR) / ~12-14 min (main) | 2-3 days |
| **Total** | Week 1-4 | All above | **-50% from baseline** | **1 week effort** |

---

## PR/Commit Checklist

When implementing these changes:

```bash
# 1. Create feature branch
git checkout -b feat/e2e-performance

# 2. Implement one recommendation at a time
# 3. Test locally: pnpm test:e2e (or test:e2e:smoke)
# 4. Commit per recommendation

git add playwright.config.ts
git commit -m "perf(e2e): increase workers from 2 to 4"

git add e2e/fixtures/scout-profile.ts
git commit -m "perf(e2e): cache scout profile to reduce API calls"

# 5. Create PR with timing comparison
# Include before/after times in PR description
```

---

## Monitoring

After implementing, track these metrics weekly:

```bash
# Extract times from CI logs
gh run list --branch main --limit 5 --json duration

# Check flakiness rate
grep -r "retry" playwright-report/index.html | wc -l

# Test count
for f in e2e/**/*.spec.ts; do echo "$f: $(grep "test(" "$f" | wc -l)"; done | sort -t: -k2 -rn
```

Add to `CLAUDE.md` or docs: "E2E tests should run in <10 min for PR, <20 min for main"
