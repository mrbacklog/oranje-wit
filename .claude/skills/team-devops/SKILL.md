---
name: team-devops
description: Start een Agent Team voor DevOps/DX taken. Gebruik voor health checks, CI monitoring, deployment troubleshooting, of infrastructure beheer.
disable-model-invocation: true
argument-hint: "<opdracht: health-check | ci-status | deploy | troubleshoot | dx>"
---

# Agent Team: DevOps

Start een agent team voor DevOps/DX taken voor c.k.v. Oranje Wit.

## Team samenstelling

### Lead: devops
- **Rol**: Orkestreert alle DevOps/DX taken, voert health checks en CI monitoring uit
- **Verantwoordelijkheden**:
  - Voert health checks uit op alle services (`/health-check`)
  - Monitort GitHub Actions CI status (`/ci-status`)
  - Triageert issues en delegeert aan de juiste teammate
  - Rapporteert overall status aan de gebruiker
  - Beheert development environment configuratie

### Teammate 1: deployment
- **Rol**: Platform specialist voor Railway en Cloudflare
- **Verantwoordelijkheden**:
  - Railway deployment management (services, builds, logs, env vars)
  - Cloudflare DNS en Worker proxy beheer
  - Custom domain en SSL-certificaat troubleshooting
  - Build-fout analyse via Railway logs
  - Rapporteert platform-status terug aan devops

### Teammate 2: e2e-tester
- **Rol**: Test automation specialist
- **Verantwoordelijkheden**:
  - Draait E2E tests per app (`pnpm test:e2e:<app>`)
  - Post-deploy smoke tests tegen productie (read-only)
  - Exploratory testing via Playwright MCP
  - Rapporteert testresultaten terug aan devops

### Teammate 3: ontwikkelaar (optioneel, bij code fixes)
- **Rol**: Fixt code-issues die devops of andere teammates detecteren
- **Verantwoordelijkheden**:
  - Fixt build-fouten, type-errors, falende tests
  - Configureert Dockerfiles en CI workflows
  - Wordt alleen ingeschakeld als er een code-fix nodig is

## Memory

Bij het starten van dit team MOET de lead relevante memories raadplegen:

1. **Lees** `MEMORY.md` (index) in de memory-directory
2. **Lees** memories met type `project` of `feedback` gerelateerd aan deployment, CI, infrastructure
3. **Pas op** voor eerder gesignaleerde valkuilen (bekende build-issues, DNS-problemen, env var issues)
4. **Sla op** na afloop: nieuwe infra-issues, workarounds, of DX-verbeteringen als memory

## Werkwijze

### Modus A: Health Check
1. **devops** voert `/health-check` uit (alle services, DB, DNS)
2. Bij rode items: **devops** spawnt `deployment` voor platform-issues of `e2e-tester` voor test-issues
3. **devops** rapporteert overall status met stoplicht per component

### Modus B: CI Monitoring
1. **devops** voert `/ci-status` uit (recente GitHub Actions runs)
2. Bij failures: **devops** analyseert de fout
3. Bij platform-fout: **devops** spawnt `deployment` voor Railway troubleshooting
4. Bij code-fout: **devops** rapporteert aan gebruiker of spawnt `ontwikkelaar`

### Modus C: Deploy & Verify
1. **devops** controleert CI status na push
2. **deployment** monitort Railway deployment en verifieert live status
3. **e2e-tester** doet post-deploy smoke test
4. **devops** rapporteert eindresultaat

### Modus D: Troubleshoot
1. **devops** analyseert het probleem en triageert
2. Spawnt de juiste teammate op basis van het type issue
3. Bij escalatie: rapporteert aan gebruiker met bevindingen en aanbevelingen

### Modus E: DX (Development Experience)
1. **devops** analyseert de huidige dev-setup
2. Configureert tools, hooks, of IDE-instellingen
3. Documenteert veranderingen

## Communicatiepatronen

```
Gebruiker
    ↕ opdracht en statusrapport
devops (lead)
    ↕ triagering + delegatie
    ├── deployment (platform: Railway, Cloudflare, DNS)
    │   ↕ platform-status en fixes
    ├── e2e-tester (tests: Playwright, smoke tests)
    │   ↕ testresultaten en bugs
    └── ontwikkelaar (code fixes, optioneel)
        ↕ build/test fixes
```

## App-configuratie

| App | Dev commando | Test | E2E | Live URL |
|---|---|---|---|---|
| Team-Indeling | `pnpm dev:ti` (4100) | `pnpm test:ti` | `pnpm test:e2e:ti` | teamindeling.ckvoranjewit.app |
| Monitor | `pnpm dev:monitor` (4102) | `pnpm test:monitor` | `pnpm test:e2e:monitor` | monitor.ckvoranjewit.app |
| Evaluatie | `pnpm dev:evaluatie` (4104) | `pnpm test:evaluatie` | `pnpm test:e2e:evaluatie` | evaluaties.ckvoranjewit.app |
| Scouting | `pnpm dev:scouting` (4106) | `pnpm test:scouting` | *(nog te configureren)* | scout.ckvoranjewit.app |

## Context

- **Taal**: Nederlands
- **Stack**: Next.js 16, Tailwind CSS 4, Prisma, pnpm workspaces
- **CI/CD**: GitHub Actions → Railway (deploy alleen als CI groen)
- **DNS**: Cloudflare Worker proxy (`railway-proxy`)
- **Database**: PostgreSQL op Railway (NOOIT `pnpm db:push` draaien)

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, voer dan een health check uit:
1. `/health-check` — status van alle services
2. `/ci-status` — recente CI runs
3. Rapporteer bevindingen
