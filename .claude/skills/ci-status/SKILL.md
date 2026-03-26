---
name: ci-status
description: Toont de status van GitHub Actions CI runs, falende jobs, en open PRs. Geeft een overzicht van de CI/CD pipeline.
user-invocable: true
allowed-tools: Read, Bash, Glob
argument-hint: "[detail: overzicht | failures | prs | deploy-history]"
---

# CI Status — GitHub Actions pipeline overzicht

Toont de huidige status van de CI/CD pipeline voor c.k.v. Oranje Wit.

## Stappen

### 1. Recente workflow runs

```bash
gh run list --limit 5
```

Toon per run:
- Run ID, status (success/failure/in_progress), branch, commit message
- Duur en tijdstip

### 2. Bij failures: details ophalen

Voor elke gefaalde run:

```bash
gh run view <run-id> --log-failed
```

Analyseer:
- Welke job faalde (quality / build / e2e / deploy)
- Welke app was betrokken
- Wat was de foutmelding

### 3. Open pull requests

```bash
gh pr list --state open
```

Per PR:
- Titel, auteur, branch
- CI status (checks passing/failing)

### 4. Deploy history

Combineer CI deploy-status met Railway:

```bash
gh run list --limit 10 --workflow ci.yml
```

Filter op runs die de deploy-job bereikten.

## Output formaat

```
## CI Status — [datum + tijd]

### Recente runs
| # | Status | Branch | Commit | Duur | Wanneer |
|---|---|---|---|---|---|
| 142 | SUCCESS | main | feat(ti): zoom controls | 4m12s | 2 uur geleden |
| 141 | SUCCESS | main | fix(ti): witte achtergrond | 3m45s | 5 uur geleden |
| 140 | FAILED  | main | feat(ti): compact toggle | 5m02s | 1 dag geleden |

### Failures (indien aanwezig)
Run #140: E2E job faalde
- Fout: `team-indeling/navigatie.spec.ts` — timeout op pagina laden
- Oorzaak: dev server startte niet op binnen timeout
- Impact: ALLE deploys geblokkeerd tot fix

### Open PRs
Geen open PRs.

### Deploy status
- Laatste succesvolle deploy: run #142 (team-indeling)
- Apps gedeployd: team-indeling
- Apps overgeslagen: monitor, evaluatie (geen wijzigingen)
```

## CI workflow structuur

De CI pipeline (`.github/workflows/ci.yml`) heeft 5 jobs:

| Job | Doel | Blokkeert |
|---|---|---|
| changes | Detecteert welke apps gewijzigd zijn | — |
| quality | Typecheck, lint, format, unit tests | deploy |
| build | Next.js build per app | deploy |
| e2e | Playwright E2E tests | deploy |
| deploy | Railway GraphQL deploy | — |

**Selectieve deploy**: alleen gewijzigde apps worden gedeployd.
**Blokkering**: als quality, build, OF e2e faalt, wordt GEEN enkele app gedeployd.

## Bij problemen

### CI faalt
1. Bekijk de gefaalde job en foutmelding
2. Rapporteer aan de gebruiker met context
3. Suggereer een fix (als duidelijk)

### Deploy geblokkeerd
1. Identificeer de blokkerende job
2. Check of het een ongerelateerde test-failure is
3. Opties: fix de test, of handmatig deployen via `railway_deploy` (alleen bij urgentie)

### Handmatig triggeren
```bash
gh workflow run ci.yml --field deploy_monitor=true --field deploy_ti=true
```

## Gerelateerde skills

- `/health-check` — service gezondheid
- `shared/deployment` — deployment procedures
