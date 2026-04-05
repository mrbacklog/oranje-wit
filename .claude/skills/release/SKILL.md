---
name: release
description: Gebundelde features of wijzigingen deployen via de volledige Release-pipeline (smoke E2E + full E2E + handmatige goedkeuring). Alleen voor team-release.
user-invocable: true
disable-model-invocation: true
argument-hint: "[release-scope: welke features/commits, welke apps]"
---

# Release — Volledige Release-pipeline

Gebruik deze skill voor **gebundelde features, meerdere wijzigingen, schema-veranderingen of alles wat E2E-verificatie vereist** voordat het live gaat.

## Wanneer Release (niet Patch)

| Release ✅ | Patch ❌ |
|---|---|
| Nieuwe feature | Typo-fix |
| Schema-wijziging / migratie | CSS-tweak |
| Meerdere commits bundelen | Config-update |
| Auth of kritieke logica | Bugfix (1-3 regels) |
| Alles dat E2E-verificatie vereist | Copy-aanpassing |

Bij twijfel → **Release**, niet Patch.

## ⛔ Autorisatie

**Alleen `team-release` mag deze skill uitvoeren.**  
Andere agents mogen NOOIT rechtstreeks deployen — escaleer altijd naar `product-owner`.

## Release-flow

```
release/** branch → fast-gate (~2 min)
                  → build (~5 min)
                  → smoke-e2e (~5-8 min)  ← als dit faalt: STOP, geen verdere verspilling
                  → full-e2e (~12-15 min)
                  → deploy (handmatige goedkeuring Antjan in GitHub)
                  → verify-deploy
```

**Totale doorlooptijd: ~25-35 min (worst case), ~10 min bij vroeg falen smoke.**

## Stappen

### 1. Verifieer scope

- `git log origin/main..HEAD --oneline` — welke commits zijn er?
- `git diff origin/main..HEAD --stat` — welke apps zijn geraakt?
- Zijn er migraties? `ls packages/database/prisma/migrations/` — check nieuwe entries

### 2. Maak release branch aan

```bash
git checkout -b release/v<datum>-<omschrijving>
# bijv: release/v2026-04-05-monitor-updates
git push origin release/v<datum>-<omschrijving>
```

CI triggert automatisch de release-workflow op `release/**` branches.

### 3. Volg de release-pipeline

```bash
gh run list --limit 5               # pipeline status
gh run view <id>                    # gedetailleerde job-status
gh run view <id> --log-failed       # bij failure
```

**Als smoke-e2e faalt:** fix het probleem, push opnieuw naar dezelfde release branch. Geen full-E2E verspilling.

### 4. Handmatige goedkeuring (Antjan)

Na full-E2E groen wacht de pipeline op handmatige goedkeuring in GitHub:

- Ga naar GitHub Actions → wachtende deployment naar `production-release`
- Keur goed → deploy start

**Als Antjan niet bereikbaar is:** wacht, deploy NOOIT zonder goedkeuring.

### 5. Squash-merge naar main

Na succesvolle deploy doet de release-workflow automatisch een squash-merge naar main met `[skip ci]` in het commit-bericht (om dubbele CI te voorkomen).

### 6. Post-deploy verificatie (verplicht)

```bash
pnpm verify:deploy
```

Verwacht output: `✅ Productie is live` met correcte SHA.

Als verify faalt: analyseer oorzaak, rapporteer aan `product-owner`. **Nooit stille failure.**

## Rapportage aan Product Owner

Na afronding rapporteer aan PO:

- Release branch naam + commit-range (SHAs)
- Samenvatting van wat er gedeployd is (per app)
- smoke-e2e + full-e2e status (groen/rood, hoeveel tests)
- Deploy SHA op productie
- verify-deploy uitslag
- GitHub Release notes URL (automatisch aangemaakt)
- Eventuele acties die nog nodig zijn (DB-migraties controleren, cache leegmaken)

## Bij mislukte smoke E2E

1. Bekijk failure: `gh run view <id> --log-failed`
2. Bepaal oorzaak: flaky test of echte regressie?
3. Flaky test → re-run: `gh run rerun <id> --failed`
4. Echte regressie → fix op de release branch, push opnieuw
5. **Nooit full-E2E draaien als smoke faalt**

## Context

- CI-workflow: `.github/workflows/release.yml`
- GitHub Environment: `production-release` (handmatige goedkeuring Antjan vereist)
- Budget: ~35 min per volledige Release-run (GitHub Actions Pro)
- Smoke suite: `e2e/smoke/smoke.spec.ts` (8 kritieke happy-path tests)
