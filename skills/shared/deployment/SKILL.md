---
name: deployment
description: Deployen naar productie, deployment status controleren, logs bekijken. Geldt voor alle apps (monitor, team-indeling, evaluatie).
user-invocable: true
allowed-tools: Read, Bash, Glob
argument-hint: "[actie: push, status, logs, rollback] [app: monitor, team-indeling, evaluatie, alle]"
---

# Deployment — Productie-releases voor alle apps

Deze skill beschrijft hoe code naar productie gaat en hoe je deployments beheert. Geldt voor **alle** apps in de monorepo.

## Gouden regels

1. **Alleen `main` branch** — er is geen `master`, geen staging, geen develop
2. **Push ≠ deploy** — deploy gaat via GitHub Actions CI: quality + build + E2E moeten ALLE slagen
3. **Typecheck + tests vóór push** — altijd lokaal verifiëren
4. **Eén commit per feature** — geen WIP-commits naar `main`
5. **Controleer CI + deployment na push** — check EERST GitHub Actions, DAN Railway

## Deployment-flow

```
Lokaal ontwikkelen
    ↓
Typecheck: pnpm --filter <app> exec tsc --noEmit
Tests:     pnpm test:<app-afkorting>
E2E:       pnpm test:e2e:<app-afkorting>
Lint:      pre-commit hook (automatisch)
    ↓
git add <bestanden>
git commit -m "type(scope): beschrijving"
git push origin main
    ↓
GitHub Actions CI (.github/workflows/ci.yml):
  Job 0: changes    — detecteert welke apps gewijzigd zijn (dorny/paths-filter)
  Job 1: quality    — typecheck, lint, format, unit tests
  Job 2: build      — Next.js build per gewijzigde app
  Job 3: e2e        — Playwright E2E tests per gewijzigde app (met PostgreSQL)
  Job 4: deploy     — Railway GraphQL API (alleen als jobs 1-3 ALLE slagen)
    ↓
Controleer:
  1. gh run list --limit 3       → CI status (success/failure)
  2. railway_services             → nieuwe deployment zichtbaar?
  3. railway_deployment_status    → SUCCESS?
```

### Selectieve deploy (werkt correct)

Niet elke push deployt alle apps. De `changes` job detecteert welke paden gewijzigd zijn:

| Trigger | Deployt |
|---|---|
| `apps/team-indeling/**` gewijzigd | Alleen team-indeling |
| `apps/monitor/**` gewijzigd | Alleen monitor |
| `apps/evaluatie/**` gewijzigd | Alleen evaluatie |
| `packages/**` gewijzigd | Alle apps (gedeelde dependency) |
| Alleen CI/docs/scripts gewijzigd | Niets (geen app-wijziging) |

### ⚠ KRITIEK: Falende tests blokkeren ALLE deploys

Als de E2E tests falen — ook door een ongerelateerde test — worden ALLE deploys geblokkeerd. Dit is stilzwijgend: er is geen notificatie. **Controleer altijd CI status na push!**

Bij een geblokkeerde deploy:
1. `gh run list --limit 3` → check of CI faalt
2. `gh run view <run-id> --log-failed` → bekijk de fout
3. Fix de test of code, push opnieuw
4. Of: trigger handmatig via `railway_deploy` (omzeilt CI, alleen als noodzakelijk)

## Apps en hun commando's

| App | Filter | Test | E2E | Service ID |
|---|---|---|---|---|
| team-indeling | `@oranje-wit/team-indeling` | `pnpm test:ti` | `pnpm test:e2e:ti` | `49ed7b30-a243-4f30-87fa-ae56935fbbbc` |
| monitor | `@oranje-wit/monitor` | `pnpm test:monitor` | `pnpm test:e2e:monitor` | `a7efb126-8ad1-460d-b787-2d03207c3f3c` |
| evaluatie | `@oranje-wit/evaluatie` | `pnpm test:evaluatie` | `pnpm test:e2e:evaluatie` | `c7a578c6-559e-4d11-8bc5-b6265dc7ada7` |

## Stap-voor-stap: deployen

### 1. Verifieer lokaal

```bash
# Voor team-indeling (voorbeeld):
pnpm --filter team-indeling exec tsc --noEmit
pnpm test:ti
pnpm test:e2e:ti    # ← VERPLICHT: dit is wat CI ook draait

# Voor alle apps tegelijk:
pnpm test
pnpm test:e2e
```

Als typecheck, tests, of E2E falen: **NIET pushen**. Fix eerst.

### 2. Commit en push

```bash
git add <specifieke bestanden>
git commit -m "feat(team-indeling): beschrijving van de wijziging"
git push origin main
```

**Regels:**
- Gebruik conventionele commit-berichten: `feat`, `fix`, `refactor`, `docs`, `chore`
- Scope = app-naam of `shared` voor gedeelde packages
- Stage specifieke bestanden, **niet** `git add .` of `git add -A`
- Push alleen naar `main` — geen andere branches naar remote

### 3. Controleer CI status (VERPLICHT na push)

```bash
# Wacht ~2-5 minuten, check dan:
gh run list --limit 3

# Bij failure:
gh run view <run-id> --log-failed
```

**Dit is de stap die voorkomt dat je naar een oude versie zit te kijken.** Als CI faalt, wordt er NIET gedeployd — ook niet voor andere apps.

### 4. Controleer Railway deployment

Pas na groen CI:

```
# Stap 1: Bekijk services en laatste deployment
→ railway_services
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"

# Stap 2: Check of deployment SUCCESS is
→ railway_deployment_status
    deploymentId: "<id uit stap 1>"

# Stap 3: Bij FAILED — bekijk build logs
→ railway_logs
    deploymentId: "<id>"
    type: "build"
```

### 5. Bij problemen

**CI faalt (tests/E2E):**
1. `gh run view <id> --log-failed` — bekijk de fout
2. Fix lokaal, push opnieuw
3. Als het een ongerelateerde E2E-fout is en je MOET nu deployen:
   - Fix de test EN deploy handmatig: `railway_deploy`
   - **Nooit** een falende test negeren — altijd ook de test fixen

**Build faalt op Railway:**
1. Bekijk logs: `railway_logs` met `type: "build"`
2. Fix lokaal, commit, push opnieuw

**Service start niet:**
1. Bekijk runtime logs: `railway_logs` met `type: "deploy"`
2. Check environment variables: `railway_variables_get`

**Rollback nodig:**
1. Check `canRollback` in `railway_deployment_status`
2. Railway dashboard: klik "Rollback" op de vorige succesvolle deployment
3. Of: `git revert <commit>` → push naar `main`

## Railway project

| Component | ID |
|---|---|
| Project | `aa87602d-316d-4d3e-8860-f75d352fae27` |
| Environment (production) | `1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1` |

### Publieke URL's

| App | Custom domein | Railway URL |
|---|---|---|
| team-indeling | https://teamindeling.ckvoranjewit.app | team-indeling-production.up.railway.app |
| monitor | https://monitor.ckvoranjewit.app | monitor-production-b2b1.up.railway.app |
| evaluatie | https://evaluaties.ckvoranjewit.app | evaluatie-production.up.railway.app |

Custom domeinen draaien via **Cloudflare Worker** `railway-proxy` (niet via Railway custom domains).

### Build-configuratie

Alle apps gebruiken **Dockerfiles** (niet Nixpacks):
- `apps/team-indeling/Dockerfile`
- `apps/monitor/Dockerfile`
- `apps/evaluatie/Dockerfile`

Basis: Node 22-slim, pnpm workspace, Prisma generate.

## Handmatig deploy triggeren

Gebruik alleen bij urgente hotfixes wanneer CI geblokkeerd is door een ongerelateerde fout:

```
→ railway_deploy
    environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
    serviceId: "<service ID>"
```

Of met wachten op resultaat:

```
→ railway_deploy_pipeline
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
    environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
    serviceId: "<service ID>"
```

## Verboden acties

- **NOOIT** `git push --force` naar `main`
- **NOOIT** custom domains verwijderen op Railway (Let's Encrypt rate limits)
- **NOOIT** deployen zonder typecheck + tests
- **NOOIT** direct op `main` committen zonder verificatie
- **NOOIT** `master` branch gebruiken — die bestaat niet meer
- **NOOIT** aannemen dat push = deploy — altijd CI status checken

## Gerelateerde skills en bestanden

| Bron | Pad | Inhoud |
|---|---|---|
| CI workflow | `.github/workflows/ci.yml` | GitHub Actions: quality, build, E2E, deploy |
| Railway MCP tools | `skills/monitor/railway/SKILL.md` | Alle 14 MCP tools, custom domains, DNS, SSL troubleshooting |
| Railway MCP server | `apps/mcp/railway/server.js` | Server implementatie |
| Deployment agent | `agents/deployment.md` | Agent voor complexe deployment-issues |
| Cloudflare credentials | `memory/cloudflare.md` | Worker + API tokens |
| MCP config | `.mcp.json` | Railway token (gitignored) |
