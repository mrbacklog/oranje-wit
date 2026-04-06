# Patch/Release Deployment Strategie — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Invoeren van twee deployment-modes (Patch / Release) met bijbehorende CI-pipelines, smoke tests en agent-governance zodat Antjan kan zeggen "deploy naar productie" en de PO + team-release de rest regelt.

**Architecture:** Patch = commit met `fix:`/`patch:` prefix → Railway auto-deployt + CI valideert zonder E2E (~5 min). Release = `release/**` branch → volledige CI-pipeline (fast-gate → build → smoke-E2E → full-E2E → squash-merge naar main → Railway deployt). Alle agents behalve deployment zijn verboden te deployen; de Product Owner is de enige orchestrator op verzoek van Antjan.

**Tech Stack:** GitHub Actions, Playwright, pnpm, Railway (auto-deploy op main), Next.js 16, bash/git

---

## Twee streams (onafhankelijk uitvoerbaar)

- **Stream A** (Tasks 1–9): CI/CD pipeline wijzigingen — workflows, configs, smoke tests
- **Stream B** (Tasks 10–14): Agent governance — skill- en agent-bestanden, CLAUDE.md

Stream B heeft geen afhankelijkheden op Stream A.

---

## File Map

| Bestand | Actie | Verantwoordelijkheid |
|---|---|---|
| `package.json` | Modify | lint-staged: alleen Prettier |
| `.husky/pre-commit` | Modify | Prettier only, geen ESLint |
| `apps/web/package.json` | Modify | Turbopack dev server |
| `playwright.config.ts` | Modify | workers: 2 → 4, smoke project toevoegen |
| `.github/workflows/ci.yml` | Modify | concurrency, timeouts, E2E skip bij patch prefix |
| `.github/workflows/patch.yml` | Create | fast-gate workflow voor patch commits |
| `.github/workflows/release.yml` | Create | volledige gates + squash-merge voor release branches |
| `e2e/smoke/smoke.spec.ts` | Create | 8 smoke tests (één happy-path per domein) |
| `e2e/fixtures/seed.ts` | Modify | teardown garantie toevoegen |
| `.claude/agents/product-owner.md` | Modify | Deploy-trigger sectie |
| `.claude/skills/team-release/SKILL.md` | Modify | Patch/Release flows + post-deploy acties |
| `.claude/skills/patch/SKILL.md` | Create | /patch skill definitie |
| `.claude/skills/release/SKILL.md` | Modify | Volwaardige Release skill (was alias) |
| `.claude/agents/deployment.md` | Modify | Uitvoerder-rol verduidelijken |
| `.claude/agents/devops.md` | Modify | Deploy-verbod + beslisboom |
| `.claude/agents/*.md` (alle andere) | Modify | Deploy-verbod sectie |
| `CLAUDE.md` | Modify | Deploy-modes sectie + CI badge |

---

## Task 1: Pre-commit hook vereenvoudigen + Turbopack

**Files:**
- Modify: `package.json`
- Modify: `.husky/pre-commit`
- Modify: `apps/web/package.json`

- [ ] **Stap 1: lint-staged aanpassen — ESLint verwijderen**

Open `package.json`. Vervang de `lint-staged` sectie:

```json
"lint-staged": {
  "*.{ts,tsx,mjs,json,css}": [
    "prettier --write"
  ]
},
```

- [ ] **Stap 2: pre-commit hook vereenvoudigen**

Open `.husky/pre-commit`. De huidige inhoud is:
```sh
#!/bin/sh
pnpm lint-staged
```

Dit blijft hetzelfde — lint-staged voert nu alleen Prettier uit. Geen verdere wijziging nodig.

- [ ] **Stap 3: Turbopack inschakelen voor dev server**

Open `apps/web/package.json`. Vervang het `dev` script:

```json
"dev": "next dev --turbopack --port 3000",
```

- [ ] **Stap 4: Verifieer lokaal**

```bash
cd c:/Users/Antjan/oranje-wit
echo "test" > /tmp/testfile.ts && git add /tmp/testfile.ts
# Maak een test commit (niet pushen) om te zien dat lint-staged alleen Prettier draait
git stash
```

Verwacht: geen ESLint output, alleen Prettier.

- [ ] **Stap 5: Commit**

```bash
git add package.json apps/web/package.json
git commit -m "chore(dx): lint-staged naar Prettier only, Turbopack voor dev"
```

---

## Task 2: CI workflow — concurrency, timeouts en fast-gate

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Stap 1: Concurrency block toevoegen**

Open `.github/workflows/ci.yml`. Voeg na de `on:` sectie toe (voor `jobs:`):

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

- [ ] **Stap 2: quality job hernoemen naar fast-gate en timeout toevoegen**

Vervang de `quality:` job header:

```yaml
  fast-gate:
    runs-on: ubuntu-latest
    timeout-minutes: 8
```

- [ ] **Stap 3: build job timeout toevoegen**

Voeg toe aan de `build:` job (na `runs-on: ubuntu-latest`):

```yaml
    timeout-minutes: 15
```

- [ ] **Stap 4: e2e job aanpassen — timeout + skip bij patch prefix + afhankelijkheid van fast-gate**

Vervang het begin van de `e2e:` job:

```yaml
  e2e:
    needs: [build, fast-gate]
    timeout-minutes: 30
    if: |
      (github.event_name != 'workflow_dispatch' || inputs.skip_e2e != true) &&
      !startsWith(github.event.head_commit.message, 'patch:') &&
      !startsWith(github.event.head_commit.message, 'fix:')
```

- [ ] **Stap 5: Verifieer YAML syntax**

```bash
cd c:/Users/Antjan/oranje-wit
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML OK"
```

Verwacht: `YAML OK`

- [ ] **Stap 6: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: fast-gate, concurrency cancel, timeouts, E2E skip bij patch prefix"
```

---

## Task 3: Playwright workers verhogen + smoke project configureren

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Stap 1: Workers verhogen naar 4**

Open `playwright.config.ts`. Vervang:
```ts
  workers: process.env.CI ? 2 : undefined,
```
Met:
```ts
  workers: process.env.CI ? 4 : undefined,
```

- [ ] **Stap 2: Smoke project toevoegen**

Voeg toe aan de `projects` array (na het `design-system` project):

```ts
    {
      name: "smoke",
      testDir: "./e2e/smoke",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
```

- [ ] **Stap 3: Verifieer TypeScript**

```bash
cd c:/Users/Antjan/oranje-wit
npx tsc --noEmit --skipLibCheck playwright.config.ts 2>&1 | head -20
```

Verwacht: geen output (geen fouten).

- [ ] **Stap 4: Commit**

```bash
git add playwright.config.ts
git commit -m "test(e2e): workers 2→4, smoke project configureren"
```

---

## Task 4: Smoke test suite aanmaken

**Files:**
- Create: `e2e/smoke/smoke.spec.ts`

- [ ] **Stap 1: Smoke test bestand aanmaken**

Maak `e2e/smoke/smoke.spec.ts` aan:

```ts
import { test, expect } from "../fixtures/base";

/**
 * Smoke tests — één happy-path per domein.
 * Doel: verifieer dat de app niet kapot is na een Release.
 * Bewust kort: geen edge cases, geen uitgebreide flows.
 */

test.describe("Smoke — app laadt", () => {
  test("monitor: overzicht laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Monitor|Overzicht/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("teamindeling: blauwdruk pagina laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/teamindeling", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Blauwdruk/ })).toBeVisible({ timeout: 15000 });
  });

  test("ti-studio: indeling laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/ti-studio/indeling", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("evaluatie: overzicht laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/evaluatie", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Evaluatie|Overzicht/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("scouting: overzicht laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/scouting", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("beheer: jaarplanning laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/beheer", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("cross-domain: AppSwitcher opent", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await nav.getByText("Apps", { exact: true }).click();
    const switcher = page.getByRole("dialog", { name: "App switcher" });
    await expect(switcher).toBeVisible({ timeout: 10000 });
  });

  test("api health: antwoordt HTTP 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status");
  });
});
```

- [ ] **Stap 2: Verifieer dat de smoke tests lokaal draaien (dev server moet al lopen)**

```bash
cd c:/Users/Antjan/oranje-wit
npx playwright test --project=smoke --reporter=list 2>&1 | tail -20
```

Verwacht: alle 8 tests PASSED (of SKIPPED als dev server niet draait — dat is OK in deze stap).

- [ ] **Stap 3: Commit**

```bash
git add e2e/smoke/smoke.spec.ts
git commit -m "test(e2e): smoke suite — 8 happy-path tests één per domein"
```

---

## Task 5: patch.yml workflow aanmaken

**Files:**
- Create: `.github/workflows/patch.yml`

- [ ] **Stap 1: patch.yml aanmaken**

Maak `.github/workflows/patch.yml` aan:

```yaml
name: Patch

on:
  push:
    branches: [main]

concurrency:
  group: patch-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Patch workflow draait alleen als commit begint met patch: of fix:
  # Volledige ci.yml draait parallel (maar slaat E2E over bij patch prefix)
  fast-gate:
    if: |
      startsWith(github.event.head_commit.message, 'patch:') ||
      startsWith(github.event.head_commit.message, 'fix:')
    runs-on: ubuntu-latest
    timeout-minutes: 8
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

      - name: Generate Prisma client
        run: pnpm db:generate

      - name: Typecheck
        run: pnpm --filter @oranje-wit/web exec tsc --noEmit

      - name: Lint
        run: pnpm --filter @oranje-wit/web lint

      - name: Format check
        run: pnpm format:check

      - name: Unit tests
        run: pnpm test

  verify:
    needs: [fast-gate]
    runs-on: ubuntu-latest
    timeout-minutes: 5
    environment: production-patch
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
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

      - name: Wacht op Railway deployment (30s)
        run: sleep 30

      - name: Post-deploy verificatie
        run: pnpm verify:deploy
```

- [ ] **Stap 2: Verifieer YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/patch.yml'))" && echo "YAML OK"
```

Verwacht: `YAML OK`

- [ ] **Stap 3: Commit**

```bash
git add .github/workflows/patch.yml
git commit -m "ci: patch.yml workflow — fast-gate + post-deploy verify"
```

---

## Task 6: release.yml workflow aanmaken

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Stap 1: release.yml aanmaken**

Maak `.github/workflows/release.yml` aan:

```yaml
name: Release

on:
  push:
    branches:
      - "release/**"

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── Stap 1: Fast gate (typecheck + lint + unit tests) ──────────
  fast-gate:
    runs-on: ubuntu-latest
    timeout-minutes: 8
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

      - name: Generate Prisma client
        run: pnpm db:generate

      - name: Typecheck
        run: pnpm --filter @oranje-wit/web exec tsc --noEmit

      - name: Lint
        run: pnpm --filter @oranje-wit/web lint

      - name: Format check
        run: pnpm format:check

      - name: Unit tests
        run: pnpm test

  # ── Stap 2: Build ──────────────────────────────────────────────
  build:
    needs: [fast-gate]
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
      NEXTAUTH_SECRET: ci-build-secret
      NEXTAUTH_URL: http://localhost:3000
      ANTHROPIC_API_KEY: sk-dummy-key
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

      - name: Generate Prisma client
        run: pnpm db:generate

      - uses: actions/cache@v4
        with:
          path: apps/web/.next/cache
          key: nextjs-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('apps/web/src/**', 'packages/*/src/**') }}
          restore-keys: |
            nextjs-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-
            nextjs-${{ runner.os }}-

      - name: Build
        run: pnpm build

  # ── Stap 3: Smoke E2E (alleen kritieke happy paths) ────────────
  smoke-e2e:
    needs: [build]
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/oranjewit_test
      NEXTAUTH_SECRET: e2e-test-secret
      NEXTAUTH_URL: http://localhost:3000
      E2E_TEST: "true"
      AUTH_GOOGLE_ID: dummy
      AUTH_GOOGLE_SECRET: dummy
      ANTHROPIC_API_KEY: sk-dummy-key
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: oranjewit_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
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

      - name: Generate Prisma client
        run: pnpm db:generate

      - name: Push schema naar test database
        run: npx prisma db push
        working-directory: packages/database

      - name: Seed test database
        run: pnpm dlx tsx e2e/fixtures/seed.ts

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

      - name: Install Playwright Chromium
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium

      - name: Install Playwright deps (cached)
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps chromium

      - name: Smoke E2E tests
        run: npx playwright test --project=smoke

      - name: Teardown test database
        if: always()
        run: pnpm dlx tsx e2e/fixtures/cleanup.ts

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-playwright-report
          path: playwright-report/
          retention-days: 7

  # ── Stap 4: Full E2E (alleen als smoke groen is) ───────────────
  full-e2e:
    needs: [smoke-e2e]
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/oranjewit_test
      NEXTAUTH_SECRET: e2e-test-secret
      NEXTAUTH_URL: http://localhost:3000
      E2E_TEST: "true"
      AUTH_GOOGLE_ID: dummy
      AUTH_GOOGLE_SECRET: dummy
      ANTHROPIC_API_KEY: sk-dummy-key
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: oranjewit_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
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

      - name: Generate Prisma client
        run: pnpm db:generate

      - name: Push schema naar test database
        run: npx prisma db push
        working-directory: packages/database

      - name: Seed test database
        run: pnpm dlx tsx e2e/fixtures/seed.ts

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

      - name: Install Playwright Chromium
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium

      - name: Install Playwright deps (cached)
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps chromium

      - name: Full E2E tests
        run: npx playwright test --project=web

      - name: Teardown test database
        if: always()
        run: pnpm dlx tsx e2e/fixtures/cleanup.ts

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: full-playwright-report
          path: playwright-report/
          retention-days: 7

  # ── Stap 5: Deploy — squash-merge naar main ────────────────────
  # Vereist handmatige goedkeuring via GitHub Environment 'production-release'
  deploy:
    needs: [full-e2e]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    environment: production-release
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configureer git
        run: |
          git config user.email "ci@ckvoranjewit.app"
          git config user.name "Release Bot"

      - name: Squash-merge release branch naar main
        run: |
          BRANCH="${{ github.ref_name }}"
          git fetch origin main
          git checkout main
          git merge --squash "origin/${BRANCH}"
          git commit -m "release: ${BRANCH} [skip ci]"
          git push origin main

  # ── Stap 6: Post-deploy verificatie ───────────────────────────
  verify:
    needs: [deploy]
    runs-on: ubuntu-latest
    timeout-minutes: 5
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

      - name: Wacht op Railway deployment (60s)
        run: sleep 60

      - name: Post-deploy verificatie
        run: pnpm verify:deploy

      - name: Genereer automatische release notes
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: "release-${{ github.run_number }}"
          release_name: "Release ${{ github.ref_name }}"
          generate_release_notes: true
          draft: false
          prerelease: false
```

- [ ] **Stap 2: Verifieer YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))" && echo "YAML OK"
```

Verwacht: `YAML OK`

- [ ] **Stap 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: release.yml — smoke→full-E2E→env-approval→squash-merge→verify"
```

---

## Task 7: GitHub Environments instellen (handmatige stap)

**Files:** GitHub repo Settings (geen code)

- [ ] **Stap 1: Ga naar GitHub repo → Settings → Environments**

URL: `https://github.com/antjanlaban/oranje-wit/settings/environments`

- [ ] **Stap 2: Maak `production-patch` environment aan**

- Name: `production-patch`
- Required reviewers: geen (auto-approve)
- Deployment branches: alleen `main`

- [ ] **Stap 3: Maak `production-release` environment aan**

- Name: `production-release`
- Required reviewers: **antjanlaban** (jij zelf)
- Deployment branches: alleen `release/**`
- Wait timer: 0 minuten

- [ ] **Stap 4: Branch protection op `main` instellen**

Ga naar Settings → Branches → Add rule voor `main`:
- Require status checks: `fast-gate` (uit `ci.yml`)
- Allow force pushes: uit
- Allow deletions: uit

---

## Task 8: /patch skill aanmaken

**Files:**
- Create: `.claude/skills/patch/SKILL.md`

- [ ] **Stap 1: Patch skill aanmaken**

Maak `.claude/skills/patch/SKILL.md` aan:

```markdown
---
name: patch
description: Urgente bugfix of kleine wijziging snel naar productie. Geen E2E, alleen fast-gate. Alleen aanroepen vanuit team-release op verzoek van Product Owner.
user-invocable: true
allowed-tools: Bash, Read, Glob
argument-hint: "[beschrijving van de fix]"
---

# Patch — Snelle fix naar productie

Een Patch is voor **urgente, kleine wijzigingen** die snel live moeten: typo's, bugfixes, config-aanpassingen. Geen nieuwe functionaliteit.

## Wanneer Patch, wanneer Release?

| Patch ✅ | Release ❌ |
|---|---|
| Bugfix in bestaande code | Nieuwe feature |
| Tekst/typo aanpassing | Meerdere samenhangende commits |
| Config wijziging | Schema/database wijziging |
| Één commit | Uitgebreide UX-wijziging |

## Patch flow

```
fix: of patch: commit → push naar main
    ↓
patch.yml: fast-gate (~2 min)
    ↓
Railway: auto-deploy (parallel)
    ↓
patch.yml verify: pnpm verify:deploy
    ↓
Rapporteer aan Product Owner
```

## Uitvoeren

### 1. Verifieer dat het een Patch is

- Is het één commit? ✅
- Is het een bugfix/typo/config? ✅
- Is typecheck lokaal groen? ✅

```bash
pnpm --filter @oranje-wit/web exec tsc --noEmit
pnpm test
```

### 2. Commit met verplicht prefix

Het commit-bericht **MOET** beginnen met `fix:` of `patch:`:

```bash
git add <bestanden>
git commit -m "fix(scope): beschrijving van de fix"
# of
git commit -m "patch(scope): beschrijving"
git push origin main
```

### 3. Controleer CI

```bash
gh run list --limit 2
```

Verwacht: `patch.yml` en `CI` draaien parallel. `patch.yml` slaagt in ~2-3 min.

### 4. Rapporteer aan Product Owner

Geef terug:
- Commit SHA
- Beschrijving van de fix
- patch.yml status (groen/rood)
- verify-deploy uitslag

## ⛔ Authorisatie

**Alleen `deployment` agent aangestuurd door `team-release` mag dit uitvoeren.**

Andere agents: roep NOOIT direct patch aan. Escaleer naar de gebruiker.

## Verwacht tijdpad

- Commit → live: ~3-5 minuten (Railway auto-deploys parallel aan fast-gate)
- fast-gate feedback: ~2 minuten
- Totale CI-kosten: ~5 minuten

$ARGUMENTS
```

- [ ] **Stap 2: Commit**

```bash
git add .claude/skills/patch/SKILL.md
git commit -m "feat(agents): /patch skill — urgente fix flow"
```

---

## Task 9: /release skill uitbreiden

**Files:**
- Modify: `.claude/skills/release/SKILL.md`

- [ ] **Stap 1: Release skill herschrijven**

Vervang de volledige inhoud van `.claude/skills/release/SKILL.md`:

```markdown
---
name: release
description: Gebundelde features en wijzigingen naar productie via volledige CI-pipeline. Smoke + full E2E + handmatige goedkeuring Antjan. Alleen aanroepen vanuit team-release op verzoek van Product Owner.
user-invocable: true
disable-model-invocation: true
argument-hint: "[release naam, bijv: v1.2-teamindeling-filters]"
---

# Release — Volledige uitrol naar productie

Een Release is voor **geplande uitrol van features, meerdere commits of grotere wijzigingen**. De volledige CI-pipeline inclusief E2E tests draait vóór productie.

## Wanneer Release, wanneer Patch?

| Release ✅ | Patch ❌ |
|---|---|
| Nieuwe functionaliteit | Bugfix |
| Meerdere commits bundelen | Één kleine fix |
| Schema/database wijziging | Typo |
| Uitgebreide UX-wijziging | Config aanpassing |

## Release flow

```
release/naam branch aanmaken
    ↓
push naar release/naam
    ↓
release.yml: fast-gate (~2 min)
    → build (~5 min)
    → smoke-E2E (~5-8 min)  ← stopt hier als kapot
    → full-E2E (~12-15 min)
    → GitHub Environment goedkeuring Antjan ✅
    → squash-merge naar main [skip ci]
    → Railway auto-deploy
    → verify: pnpm verify:deploy
    ↓
Rapporteer aan Product Owner
```

## Uitvoeren

### 1. Release branch aanmaken

```bash
RELEASE_NAAM="v1.2-beschrijving"  # bijv: v1.2-teamindeling-filters
git checkout -b "release/${RELEASE_NAAM}"
git push origin "release/${RELEASE_NAAM}"
```

### 2. Wacht op CI pipeline

```bash
gh run list --limit 3
gh run watch  # volg de voortgang live
```

Pipeline verloopt sequentieel. Als smoke-E2E faalt: stop, fix, push opnieuw.

### 3. Goedkeuring Antjan (automatisch gevraagd)

GitHub stuurt een notificatie voor goedkeuring van `production-release` environment.
Antjan keurt goed via GitHub UI → deploy-job start, squash-merge naar main.

### 4. Post-deploy verificatie

De `verify` job in release.yml draait automatisch:
- `pnpm verify:deploy` → alle endpoints groen?
- SHA-check: productie-SHA = release commit?
- GitHub Release wordt automatisch aangemaakt met changenotes

### 5. Rapporteer aan Product Owner

Geef terug:
- Release naam + commit SHA
- Welke apps zijn gedeployd
- verify-deploy uitslag (GROEN/ROOD)
- Link naar GitHub Release
- Eventuele acties: DB-migraties gelukt? Cache?

## ⛔ Authorisatie

**Alleen `deployment` agent aangestuurd door `team-release` mag dit uitvoeren.**

Andere agents: roep NOOIT direct release aan. Escaleer naar de gebruiker.

## Team samenstelling

Gebruik het `team-release` team:
- **Lead**: ontwikkelaar — code klaarmaken, release branch aanmaken
- **Teammate 1**: e2e-tester — smoke E2E go/no-go bewaken
- **Teammate 2**: deployment — CI monitoren, Railway build bewaken, verify uitvoeren

## Verwacht tijdpad

- Fast-gate: ~2 min
- Build: ~5 min
- Smoke-E2E: ~5-8 min
- Full-E2E: ~12-15 min
- Deploy + verify: ~3-5 min
- **Totaal: ~25-35 min**
- **CI-kosten: ~35 min per volledige release**

$ARGUMENTS
```

- [ ] **Stap 2: Commit**

```bash
git add .claude/skills/release/SKILL.md
git commit -m "feat(agents): /release skill — volledige release pipeline"
```

---

## Task 10: product-owner.md — deploy-trigger sectie

**Files:**
- Modify: `.claude/agents/product-owner.md`

- [ ] **Stap 1: Deploy-trigger sectie toevoegen**

Voeg toe aan `.claude/agents/product-owner.md`, vóór de `## Beslisboom` sectie:

```markdown
## Deploy op verzoek van Antjan

Als Antjan vraagt om te deployen (in welke formulering dan ook — "zet het live", "deploy", "naar productie"):

### Stap 1: Inventariseer

```bash
git log origin/main..HEAD --oneline
git status
```

Welke commits staan klaar? Zijn er uncommitted wijzigingen?

### Stap 2: Analyseer en kies mode

| Situatie | Mode |
|---|---|
| 1 commit, bugfix/typo/config | **Patch** |
| Meerdere commits, features, schema | **Release** |
| Mix van bugfixes en features | **Release** (veiliger) |

### Stap 3: Bundel slim

Meerdere kleine fixes kunnen als één Release gaan. Vraag jezelf: is het beter om alles te bundelen of apart te doen?

### Stap 4: Spawn team-release

**Voor Patch:**
```
Spawn team-release: "Patch — [beschrijving]. Commit: [sha]. Voer /patch uit."
```

**Voor Release:**
```
Spawn team-release: "Release — [beschrijving]. Commits: [sha-range]. Voer /release uit met naam [release-naam]."
```

### Stap 5: Wacht op team-release rapportage

### Stap 6: Rapporteer terug aan Antjan

Geef altijd terug:
- **Wat**: welke commits zijn gedeployd (SHA + samenvatting)
- **Welke apps**: welke domeinen zijn geraakt
- **Status**: verify-deploy uitslag (GROEN / ROOD)
- **Acties**: zijn er vervolgacties nodig? (bijv. DB-migratie controleren, cache leegmaken, gebruikers informeren)
- **Link**: GitHub Actions run + eventuele GitHub Release

### Autorisatie

Jij (PO) bent de **enige** die team-release mag aanroepen voor een deploy.
Alle andere agents mogen NOOIT deployen — ze escaleren altijd naar jou.
```

- [ ] **Stap 2: Commit**

```bash
git add .claude/agents/product-owner.md
git commit -m "feat(agents): product-owner deploy-trigger — PO orchestreert Patch/Release"
```

---

## Task 11: team-release skill uitbreiden met Patch/Release flows

**Files:**
- Modify: `.claude/skills/team-release/SKILL.md`

- [ ] **Stap 1: Werkwijze updaten voor Patch en Release**

Vervang de `## Werkwijze` sectie in `.claude/skills/team-release/SKILL.md` met:

```markdown
## Werkwijze

### Ontvangst van PO-opdracht

team-release ontvangt een opdracht van de Product Owner met:
- **Mode**: Patch of Release
- **Scope**: welke commits / welke branch
- **Beschrijving**: wat er gedeployd wordt

### Patch-flow

1. **ontwikkelaar**: verifieer typecheck + unit tests lokaal
2. **ontwikkelaar**: commit met `fix:` of `patch:` prefix, push naar `main`
3. **deployment**: monitor `patch.yml` CI run (`gh run list --limit 2`)
4. **deployment**: wacht op Railway auto-deploy + patch.yml verify
5. **deployment**: rapporteer SHA, status en verify-uitslag terug

**Totaal: ~5 min**

### Release-flow

1. **ontwikkelaar**: maak `release/<naam>` branch aan, push
2. **deployment**: monitor `release.yml` CI pipeline (`gh run watch`)
3. **e2e-tester**: bewaakt smoke-E2E go/no-go — bij falen: rapporteer naar ontwikkelaar
4. **ontwikkelaar**: fixt falende tests, push opnieuw naar release branch
5. **deployment**: meldt als alle gates groen zijn → Antjan keurt goed via GitHub
6. **deployment**: wacht op squash-merge + Railway deploy
7. **deployment**: verifieert post-deploy: `pnpm verify:deploy`
8. **deployment**: rapporteer SHA, GitHub Release link, verify-uitslag terug

**Totaal: ~25-35 min**

### Post-deploy verplichte acties (beide modes)

Na elke deploy, ongeacht mode:
- [ ] `pnpm verify:deploy` uitvoeren (of bevestigen dat workflow dit deed)
- [ ] SHA-check: curl productie-URL `/api/health` en vergelijk `version` met `git rev-parse HEAD`
- [ ] Rapporteer volledig terug aan Product Owner

### Fase 1: Development (alleen voor Release)
```

- [ ] **Stap 2: Quality gates updaten**

Vervang de `## Quality gates` sectie:

```markdown
## Quality gates

### Patch (verplicht vóór push naar main)
1. `pnpm --filter @oranje-wit/web exec tsc --noEmit` — geen type-fouten
2. `pnpm test` — alle unit tests groen

### Release (verplicht vóór release branch push)
1. `pnpm --filter @oranje-wit/web exec tsc --noEmit` — geen type-fouten
2. `pnpm test` — alle unit tests groen
3. `pnpm format:check` — formatting correct
4. Code review: zijn de commits logisch gegroepeerd?
```

- [ ] **Stap 3: Commit**

```bash
git add .claude/skills/team-release/SKILL.md
git commit -m "feat(agents): team-release Patch/Release flows + post-deploy acties"
```

---

## Task 12: Deploy-verbod in alle agent-bestanden

**Files:**
- Modify: `.claude/agents/deployment.md`
- Modify: `.claude/agents/devops.md`
- Modify: alle andere `.claude/agents/*.md`

- [ ] **Stap 1: deployment.md — uitvoerder-rol verduidelijken**

Voeg toe aan `.claude/agents/deployment.md`, vóór de `## Domein` sectie:

```markdown
## Rol: Uitvoerder, niet beslisser

Jij **deployt** — jij **beslist niet** wanneer er gedeployd wordt.

- Ontvang deployment-opdracht van `team-release` (aangestuurd door Product Owner)
- Voer uit: Railway deploy monitoren, build logs bekijken, healthcheck uitvoeren
- Rapporteer resultaat terug aan `team-release`
- **NOOIT** zelf besluiten om te deployen zonder opdracht van `team-release`

Antjan vraagt aan PO → PO spawnt team-release → team-release geeft jou de opdracht.
```

- [ ] **Stap 2: devops.md — deploy-verbod + beslisboom uitbreiden**

Voeg toe aan `.claude/agents/devops.md`, vóór de `## Domein` sectie:

```markdown
## ⛔ Deploy-verbod

Jij mag NOOIT rechtstreeks deployen naar productie.
Als iets live moet: escaleer naar de gebruiker of spawn `product-owner`.
De PO bepaalt wat en wanneer deployt.
```

Voeg toe aan het einde van de `## Beslisboom` sectie:

```markdown
8. **Patch gevraagd (van team-release)** → laad `/patch` skill, fast-gate, wacht op Railway, verify
9. **Release gevraagd (van team-release)** → laad `/release` skill, orchestreer full pipeline
```

- [ ] **Stap 3: Deploy-verbod toevoegen aan alle andere agents**

De volgende agents krijgen elk dezelfde sectie toegevoegd vóór `## Opstarten` (of bovenaan de beschrijving):

Agents: `adviseur.md`, `data-analist.md`, `jeugd-architect.md`, `korfbal.md`, `mentaal-coach.md`, `ontwikkelaar.md`, `regel-checker.md`, `speler-scout.md`, `sportwetenschap.md`, `team-planner.md`, `team-selector.md`, `ux-designer.md`, `frontend.md`, `e2e-tester.md`, `documentalist.md`, `communicatie.md`

Voeg toe aan elk bestand, vóór de eerste `##` sectie:

```markdown
## ⛔ Deploy-verbod

Jij mag NOOIT rechtstreeks deployen naar productie.
Wil je dat iets live gaat? Escaleer naar de gebruiker.
De Product Owner bepaalt wat en wanneer deployt — nooit jij.
```

- [ ] **Stap 4: Commit**

```bash
git add .claude/agents/
git commit -m "feat(agents): deploy-verbod alle agents, PO is enige deploy-orchestrator"
```

---

## Task 13: CLAUDE.md — deploy-modes sectie + CI badge

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Stap 1: CI badge toevoegen bovenaan CLAUDE.md**

Voeg toe onder de eerste `# c.k.v. Oranje Wit — Monorepo` heading:

```markdown
![CI](https://github.com/antjanlaban/oranje-wit/actions/workflows/ci.yml/badge.svg) ![Patch](https://github.com/antjanlaban/oranje-wit/actions/workflows/patch.yml/badge.svg)
```

- [ ] **Stap 2: Deploy-modes sectie toevoegen**

Voeg toe aan CLAUDE.md, in de `## Commando's` sectie (na de bestaande tabel):

```markdown
## Deploy-modes

| Mode | Wanneer | Hoe starten | CI-tijd | E2E |
|---|---|---|---|---|
| **Patch** | Bugfix, typo, config | `fix:` of `patch:` prefix in commit | ~5 min | ❌ |
| **Release** | Features, gebundeld | `release/<naam>` branch aanmaken | ~35 min | ✅ smoke + full |

**Flow:**
```
Antjan: "deploy naar productie"
    ↓
Product Owner: analyseert git log, kiest Patch of Release
    ↓
Product Owner: spawnt team-release met mode + scope
    ↓
team-release: voert Patch of Release flow uit
    ↓
deployment agent: monitort CI, Railway, verify
    ↓
Product Owner: rapporteert terug aan Antjan
```

**Authorisatie:** Enkel de `deployment` agent (aangestuurd door `team-release`, aangestuurd door PO) mag deployen. Alle andere agents: **VERBODEN**.
```

- [ ] **Stap 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: deploy-modes sectie + CI badges in CLAUDE.md"
```

---

## Verificatie (end-to-end)

- [ ] **V1: Pre-commit duurt < 3 seconden**

Maak een kleine wijziging, doe `git add`, en voer `pnpm lint-staged` uit. Verwacht: alleen Prettier output, klaar in < 3s.

- [ ] **V2: Patch flow werkt**

```bash
git commit -m "fix(test): verificatie patch flow [skip ci]"
git push origin main
gh run list --limit 3
```

Verwacht: `patch.yml` workflow verschijnt en slaagt in ~2-3 min. `CI` workflow slaat E2E over.

- [ ] **V3: Smoke tests draaien**

```bash
npx playwright test --project=smoke --reporter=list
```

Verwacht: alle 8 smoke tests PASSED.

- [ ] **V4: release.yml YAML is geldig**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))" && echo "OK"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/patch.yml'))" && echo "OK"
```

Verwacht: beide `OK`.

- [ ] **V5: Agent governance — deploy-verbod aanwezig**

```bash
grep -l "Deploy-verbod" .claude/agents/*.md | wc -l
```

Verwacht: alle agents behalve `deployment.md` hebben het verbod.

---

## Opmerkingen voor uitvoering

- **Stream A en B zijn onafhankelijk** — kunnen parallel uitgewerkt worden door verschillende agents
- **Task 7 (GitHub Settings)** is een handmatige stap buiten git — doe dit na Task 6 (release.yml)
- **Railway auto-deploy** blijft ingeschakeld op `main` — patch.yml en release.yml vertrouwen hierop
- **`[skip ci]` suffix** in squash-merge commit van release.yml voorkomt dubbele CI run op main
- **Playwright workers 4**: monitor na eerste paar CI runs op flakyness; verhoog naar 6 als stabiel
