---
name: deployment
description: Deployen naar productie, deployment status controleren, logs bekijken. Geldt voor alle apps (web, ti-studio).
context: fork
user-invocable: true
allowed-tools: Read, Bash, Glob
argument-hint: "[actie: push, status, logs, rollback] [app: web, ti-studio]"
---

# Deployment — Productie-releases

Deze skill beschrijft hoe code naar productie gaat en hoe je deployments beheert.

## Gouden regels

1. **Alleen `main` branch** — geen staging, geen develop
2. **Push ≠ deploy** — deploy gaat via GitHub Actions CI
3. **Typecheck + tests vóór push** — altijd lokaal verifiëren
4. **Eén commit per feature** — geen WIP-commits naar `main`
5. **Controleer CI + deployment na push**

## Apps

| App | URL | Service alias | Dockerfile |
|---|---|---|---|
| **Web** (Monitor, Evaluatie, Scouting, Beheer, Beleid) | `www.ckvoranjewit.app` | `web` | `apps/web/Dockerfile` |
| **TI-Studio** (Team-Indeling) | `teamindeling.ckvoranjewit.app` | `ti-studio` | `apps/ti-studio/Dockerfile` |

## Deployment-flow

```
Lokaal ontwikkelen
    ↓
Typecheck: pnpm --filter <app> exec tsc --noEmit
Tests:     pnpm test
Lint:      pre-commit hook (automatisch)
    ↓
git add <bestanden>
git commit -m "type(scope): beschrijving"
git push origin main
    ↓
GitHub Actions CI (.github/workflows/ci.yml):
  Job 1: fast-gate  — typecheck, lint, format, unit tests (web + ti-studio)
  Job 2: build      — Next.js build (web + ti-studio)
  Job 3: e2e        — Playwright E2E tests (overgeslagen bij patch:/fix:)
  Job 4: deploy     — Railway deploy + health check
    ↓
Controleer:
  1. gh run list --limit 3       → CI status
  2. railway_status              → services en deployments
```

## Verifiëren na deploy

```
→ railway_status
→ railway_logs service:"web"
→ railway_logs service:"ti-studio"
```

Of via CLI:
```bash
pnpm verify:deploy
```

## Bij problemen

**CI faalt:**
```bash
gh run list --limit 3
gh run view <run-id> --log-failed
```

**Build faalt op Railway:**
```
→ railway_logs service:"web" type:"build"
```

**Service start niet:**
```
→ railway_logs service:"web" type:"runtime"
→ railway_variables service:"web"
```

**Debugging:**
```
→ railway_ask question:"waarom faalt de laatste deploy van web?"
```

**Rollback nodig:**
1. `git revert <commit>` → push naar `main`
2. Of via Railway dashboard: klik "Rollback" op vorige deployment

## MCP Tools (Smart Gateway v2)

| Tool | Wanneer |
|---|---|
| `railway_status` | Overzicht services en deployments |
| `railway_deploy` | Deploy triggeren (met polling) |
| `railway_logs` | Build of runtime logs |
| `railway_variables` | Env vars ophalen/instellen |
| `railway_domains` | Custom domain beheer |
| `railway_ask` | Debugging, metrics, complexe vragen |

Alle tools gebruiken service-aliassen (`"web"`, `"ti-studio"`) — geen UUIDs nodig.

## Verboden acties

- **NOOIT** `git push --force` naar `main`
- **NOOIT** custom domains verwijderen op Railway (Let's Encrypt rate limits)
- **NOOIT** deployen zonder typecheck + tests
- **NOOIT** aannemen dat push = deploy — altijd CI status checken

## Gerelateerde bestanden

| Bron | Pad |
|---|---|
| CI workflow | `.github/workflows/ci.yml` |
| Patch verify | `.github/workflows/patch.yml` |
| Release flow | `.github/workflows/release.yml` |
| Railway MCP | `apps/mcp/railway/server.js` |
| Railway config | `apps/mcp/railway/config.js` |
| Railway skill | `.claude/skills/railway/SKILL.md` |
| Deploy verify | `scripts/verify-deploy.ts` |
