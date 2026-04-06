# CI/CD Pipeline Analyse — Bottleneck Report

**Datum:** 2026-04-04  
**Analist:** DevOps Lead  
**Scope:** GitHub Actions CI, pre-commit hooks, Railway auto-deploy, E2E testing

---

## Samenvatting

De huidige pipeline loopt **sequentieel** (Quality → Build → E2E), met E2E als kritieke bottleneck. Een typische succesvolle push-naar-productie cyclus duurt **~8-10 minuten** (CI + Railway deploy + E2E) vanuit commit tot live.

**Kritieke bevinding:** Build en Quality runnen parallel (goed), maar E2E wacht op Build (sequentieel). E2E zelf is 6m45s — het langzaamste component van de hele pipeline.

---

## Gemeten Tijden (Recent CI Run #23979227975, 2026-04-04 12:49–12:56)

| Component | Duur | Parallel/Sequentieel | Status |
|---|---|---|---|
| **Quality job** | 1m37s | Parallel met Build | ✅ |
| **Build job** | 52s | Parallel met Quality | ✅ |
| **E2E job** | 6m45s | **Blokkert op Build** | ⚠️ BOTTLENECK |
| **Totaal CI runtime** | **~8m** | Quality + Build parallel, E2E waits | — |
| **pnpm install** (CI) | ~35-40s per job | 3x per pipeline | ⚠️ INEFFICIËNT |
| **Prisma db:generate** | ~3s per job | 3x per pipeline | ⚠️ Redundant |
| **Next.js Build** | ~45s | — | ✅ |
| **E2E setup** (DB seed) | ~30-45s | — | — |
| **E2E test execution** | ~5m30s | 288 passed, 64 skipped | ⚠️ LANG |

---

## Kritieke Pad: Push → Live

```
COMMIT + PUSH
    ↓
GitHub Actions trigger
    ├─── Quality job (1m37s) ──┐
    │   └─ pnpm install → typecheck → lint → format → tests      │
    │                                                  │
    └─── Build job (52s) ──────────────────┐          │
        └─ pnpm install → db:generate → next build    │
                                                       ↓
                                            E2E Job START (waits for build)
                                            (blokkert hier ~2-3s)
                                                       ↓
                                            pnpm install (3de keer!)
                                            db:generate (3de keer!)
                                                       ↓
                                            PostgreSQL service startup
                                                       ↓
                                            Playwright cache restore
                                            (HIT: ~2s, MISS: +30s)
                                                       ↓
                                            E2E tests (5m30s)
                                                       ↓
                                            CI SUCCESS
                                                       ↓
                                            Railway auto-deploy
                                            (~2-3m build + deploy)
                                                       ↓
                                            LIVE (TI, Monitor, Evaluatie)

Totaal kritieke pad: 1m37s (Quality) + 52s (Build) + wait(2s) + 6m45s (E2E) = ~9m14s
Plus Railway deployment: ~2-3m
TOTAAL PUSH → LIVE: ~11-12 minuten
```

---

## Bottleneck Analyse: Top 5

### 1. **E2E Test Execution (5m30s) — KRITIEKE BOTTLENECK**

**Probleem:**
- 288 tests uit 38 .spec.ts files lopen sequentieel in CI (`workers: 2`)
- Playwright setup + test execution = 6m45s totaal
- Dit is **80% van de gehele pipeline runtime**

**Oorzaak:**
- E2E tests zijn end-to-end (echte db, echte browser) — niet snel per se
- Slechts 2 workers in CI (zie `playwright.config.ts:8`)
- Geen intelligente test selectie: alles draait altijd

**Impact:**
- Elke push wacht 6m45s op E2E resultaat
- Snelle fix? Dan wacht je toch volledige E2E suite

**Verbetering potenzieel:**
- Verhoog workers naar 4-8 in CI → schatting -30% tot -50% (tot ~3m30s)
- Parallelliseer E2E tests per domein (teamindeling, monitor, evaluatie apart)
- Voeg smoke-test-only variant in (subset van tests, sneller feedback)

---

### 2. **Redundante pnpm install (3x per pipeline) — ~105-120s totaal verspild**

**Probleem:**
- Quality job: `pnpm install --frozen-lockfile` (~40s)
- Build job: `pnpm install --frozen-lockfile` (~40s)
- E2E job: `pnpm install --frozen-lockfile` (~40s)
- **Totaal: 3x dezelfde operatie met dezelfde `pnpm-lock.yaml`**

**Oorzaak:**
- Elke CI job is onafhankelijk (geen gedeelde cache)
- GitHub Actions caching via `actions/setup-node@v4` cache: pnpm werkt wel, maar...
- ...cache hitrate is niet altijd 100% (deps kunnen miss)

**Impact:**
- ~2m totale overhead per pipeline
- Dit kan naar ~30s (1 install + cache share)

**Verbetering potenzieel:**
- Gebruik één `pnpm install` als eerste stap in **alle** jobs (in parallel)
- Dependency matrix: als lock niet veranderd → cache hit 100%
- Schatting besparing: **~90-100s per pipeline**

---

### 3. **Redundante Prisma db:generate (3x per pipeline) — ~9s verspild**

**Probleem:**
- Quality job: `pnpm db:generate` (~3s)
- Build job: `pnpm db:generate` (~3s)
- E2E job: `pnpm db:generate` (~3s)
- **Totaal: 3x dezelfde codegeneratie**

**Oorzaak:**
- db:generate is deterministic (schema.prisma → genereerde client)
- Geen caching tussen jobs

**Impact:**
- ~9s verspild, relatief klein maar telt op

**Verbetering potenzieel:**
- Cache output van `packages/database/.prisma/generated/` per lock-hash
- Schatting besparing: **~6-8s per pipeline**

---

### 4. **E2E: Wachten op Build Job (2-3s blokkade)**

**Probleem:**
- E2E job heeft `needs: [build]` — wacht tot Build voltooid is
- Build is al gedaan (52s), maar E2E start pas daarna
- Waarom? Build artifact wordt niet gedeeld

**Oorzaak:**
- Build output (`.next/` folder) is lokaal in CI runner
- E2E job krijgt schone checkout, moet alles heropbouwen

**Impact:**
- ~2-3s wachttijd (in pipeline, niet echt blokkade)
- Echter: **E2E bouwt zelf opnieuw op** (zie Playwright webServer setup)

**Verbetering potenzieel:**
- Maak Next.js build cacheable tussen jobs (artifact uploaden?)
- Of: laat E2E parallel lopen met Build (niet blokkeren)
  - E2E doet zelf `pnpm dev:web` (playwright webServer)
  - Dus heeft build niet NODIG, kan parallel starten

---

### 5. **Playwright Browser Cache: Intermittent Miss (~30s toegevoegd)**

**Probleem:**
- Playwright browsers cached in `~/.cache/ms-playwright`
- Cache key: `playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}`
- **Cache MISS: install-deps Chromium = +30s**

**Current run status:**
- Cache HIT: "Install Playwright deps (cached)" ✅ → ~2s
- Geen "Install Playwright Chromium" (would indicate MISS)

**Oorzaak:**
- Lock-hash basis voor cache key is goed, maar...
- ...als lock verandert → nieuw runner kan browser opnieuw downloaden

**Impact:**
- ~30s penalty op ongunstige timing (new lock deps)
- Niet super kritiek, maar voelbaar

**Verbetering potenzieel:**
- Playwright browser installation in CI image voorbaked
- Of: gebruik GitHub's `ubuntu-latest` met Playwright pre-installed
- Schatting besparing: **~20-30s per lock-change-cycle**

---

## Andere Observaties

### Pre-commit Hook Snelheid
**Status:** Goed, niet de bottleneck

```
$ pnpm lint-staged
```

Lint-staged config (package.json:45-52):
- `*.{ts,tsx,mjs}`: ESLint --fix + Prettier
- `*.{json,css}`: Prettier

**Veel sneller dan CI** omdat:
- Draait alleen op staged files (developer level)
- Niet op hele codebase

**Geschatte duur:** ~5-10s (lokale machine, niet CI)

### Parallelisatie Status

✅ **Goed:**
- Quality en Build lopen parallel (beide starten tegelijk)

❌ **Slecht:**
- E2E blokkert op Build (wacht 52s extra)
- E2E zou parallel kunnen lopen (doet zelf dev server startup)

---

## Build Cache (Next.js): Gemiddelde Effectiviteit

Cache strategy (ci.yml:73-79):
```yaml
- uses: actions/cache@v4
  with:
    path: apps/web/.next/cache
    key: nextjs-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('apps/web/src/**', 'packages/*/src/**') }}
    restore-keys: |
      nextjs-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-
      nextjs-${{ runner.os }}-
```

**Effectiviteit:**
- Key includes lock + all source hashes (very specific)
- Cache hit op unchanged source = 100%
- Restore key fallbacks help
- Impact op build duur: ~-10% tot -15% (45s → ~38-40s)

**Potentieel:**
- Huidige cache is goed
- Minimale verbetering meer

---

## Railway Auto-Deploy Status

Configuratie (`apps/web/railway.json`):
```json
{
  "build": { "builder": "DOCKERFILE" },
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 10
  }
}
```

**Proces:**
1. GitHub Actions CI succeeds → push naar main
2. Railway webhook triggered (automatic)
3. Railway builds Dockerfile (~2-3m)
4. Railway deploys to 3 services (TI, Monitor, Evaluatie)
5. Health check via `/api/health` (10s timeout)

**Status:** Automation werkt, maar geen CI→Railway gating. Improvement: zie "Railway Deployment Gating" hieronder.

---

## Concrete Verbeteringsplan

### Prioriteit 1: E2E Worker Parallelisatie (HIGH IMPACT, LOW COMPLEXITY)

**Wat:** Verhoog Playwright workers van 2 naar 6-8 in CI

```diff
# playwright.config.ts
- workers: process.env.CI ? 2 : undefined,
+ workers: process.env.CI ? 6 : undefined,
```

**Geschat voordeel:**
- E2E duur: 6m45s → ~4m30s (33% sneller)
- **Pipeline duur: 8m → 6m30s** (absolute besparing: ~1m30s)

**Risico:** 
- Meer resource contention op CI runner
- Eventueel meer flakiness in tests
- Test: met 4 workers, dan 6 → kijken naar stabiliteit

**Implementatie kosten:** ~5 minuten

---

### Prioriteit 2: Shared pnpm install (MEDIUM IMPACT, MEDIUM COMPLEXITY)

**Wat:** Dedupliceer `pnpm install` in alle CI jobs

**Opties:**

**Optie A: Matrix job (Clean)**
```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache.outputs.cache-primary-key }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

  quality:
    needs: install
    steps:
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ needs.install.outputs.cache-key }}
      # ... rest of job
```

**Optie B: Reuse container image (Simpler)**
- Dockerfile → build a "deps" image in CI
- Use as base for all job steps
- Might be overkill for this project

**Geschat voordeel:** -90-100s per pipeline

**Implementatie kosten:** ~30-45 minuten (testing nodig)

---

### Prioriteit 3: E2E Parallelisatie per Domein (MEDIUM-HIGH IMPACT, MEDIUM COMPLEXITY)

**Wat:** Split E2E tests by domain (teamindeling, monitor, evaluatie, etc.) en draai in parallel jobs

```yaml
jobs:
  e2e-teamindeling:
    needs: build
    steps:
      - run: pnpm test:e2e -- --grep "teamindeling"
  
  e2e-monitor:
    needs: build
    steps:
      - run: pnpm test:e2e -- --grep "monitor"
  
  e2e-evaluatie:
    needs: build
    steps:
      - run: pnpm test:e2e -- --grep "evaluatie"
```

**Prerequisite:**
- Tests moeten tagged zijn per domein (of path-based grep work)
- Database isolation per test domain (current seed.ts)

**Geschat voordeel:**
- 288 tests in 3 parallel jobs = ~4m per job → ~1m40s totaal (75% reduction!)
- **Pipeline duur: 8m → 4m30s**

**Risico:**
- Complex setup: 3x database spinup, 3x browser launch
- CI resource overhead higher
- Test interdependencies if any

**Implementatie kosten:** ~60-90 minuten

---

### Prioritiet 4: E2E "Smoke Test" Channel (MEDIUM IMPACT, LOW COMPLEXITY)

**Wat:** Voeg snelle smoke-test variant toe voor pre-merge CI

```bash
# playwright.config.ts
projects: [
  {
    name: "smoke",
    testMatch: /.*\.smoke\.ts/,  # Only smoke tests
    // ... rest
  },
  {
    name: "web",
    testIgnore: ["**/tests/**"],
    // ... full tests
  }
]
```

**Flow:**
- Pre-merge CI: run smoke tests (~30s)
- Post-merge CI: run full E2E suite

**Geschat voordeel:**
- PRs feedback in ~3-4m (smoke only)
- Full E2E per merge (maintains quality)

**Implementatie kosten:** ~45 minuten

---

### Prioriteit 5: Post-Deploy E2E in CI (LOW IMPACT, MEDIUM COMPLEXITY)

**Wat:** Automatiseer `pnpm verify:deploy` in CI after Railway succeeds

**Huidige state:**
- CI passes
- Railway deploys (manual verification)
- `pnpm verify:deploy` moet manually draaid

**Verbetering:**
- Add job: "Deploy Verification" (after e2e success)
- Checks `/api/health` on 3 live services
- Fails CI if deployment unhealthy

**Geschat voordeel:**
- No invisibility incidents
- Automated post-deploy check

**Implementatie kosten:** ~20-30 minuten

---

### Prioriteit 6: Prisma db:generate Caching (LOW IMPACT, LOW COMPLEXITY)

**Wat:** Cache `packages/database/.prisma/client` output

```yaml
- uses: actions/cache@v4
  with:
    path: packages/database/.prisma/client
    key: prisma-${{ hashFiles('packages/database/schema.prisma') }}
```

**Geschat voordeel:** -6-8s per pipeline

**Implementatie kosten:** ~10 minuten

---

## Samenvatting Optimalisaties

| Prioriteit | Verbetering | Duur Nu | Duur Later | Besparing | Opzet | Risico | Kosten |
|---|---|---|---|---|---|---|---|
| **1** | E2E: 2→6 workers | 6m45s | ~4m30s | 2m15s | Trivial | Flakiness | 5min |
| **2** | Shared pnpm install | 3m40s total | ~2m | 1m40s | Matrix job | Complex setup | 40min |
| **3** | E2E domain parallel | 6m45s | ~1m50s | 4m55s | 3 jobs | DB/browser isolation | 90min |
| **4** | Smoke test channel | Full suite | 30s pre-merge | 6m (pre) | New .smoke.ts tests | New test variant | 45min |
| **5** | Post-deploy verify | Manual | Automatic | 0 (automation) | CI job | None | 25min |
| **6** | Prisma cache | 9s total | ~2s | 7s | Simple cache rule | None | 10min |

---

## Kritieke Waarschuwingen

1. **Don't over-optimize without bottleneck proof**
   - E2E is de echte bottleneck (80% van runtime)
   - Quality + Build zijn al parallel (goed)
   - Focus op #1, #3, #4

2. **Flakiness risk**
   - E2E tests zijn kritiek voor kwaliteit
   - Meer parallelisatie → meer flakiness potentieel
   - Maak incrementeel: 2 → 4 workers eerst, monitor

3. **Test hermiticity**
   - Huidige seed.ts werkt, maar test isolation op 6 parallel workers?
   - Database cleanup moet per test/spec garantie zijn
   - Controleer voor commit

4. **Railway deployment blocking**
   - Huidige: CI gaat groen → Railway deployt async
   - Geen garantie deploy geslaagd
   - Implement post-deploy verification (Priority #5)

---

## Aanbevolen Implementatievolgorde

1. **Week 1:** Priority #1 (E2E workers) + #6 (Prisma cache) — quick wins
2. **Week 2:** Priority #5 (Post-deploy verify) — visibility
3. **Week 3:** Priority #2 (Shared install) — medium effort
4. **Week 4:** Priority #3 (E2E domain parallel) — high effort
5. **Week 5:** Priority #4 (Smoke tests) — optional, nice-to-have

---

## Appendix: Lokale Pre-Commit Snelheid

De pre-commit hook (`pnpm lint-staged`) draait **veel sneller** lokaal omdat:

1. Filtert op staged files (niet hele project)
2. ESLint --fix + Prettier
3. Lokale Node.js (geen CI overhead)

**Geschatte duur:** 5-10s (developer machine)  
**Impact:** Niet de bottleneck — pas in CI

Conclusion: Don't optimize pre-commit, optimize CI.

---

## Vervolg

1. Kies Priority #1 (#workers verhoging)
2. Implement incrementeel
3. Monitor flakiness rate
4. Repeat voor Priority #2-3

Verwachting na alle optimalisaties:
- Huidige: Push → Live = 11-12m
- Target: Push → Live = 5-6m (~50% reduction)

Daarmee is feedback loop sneller en development cycle beter.
