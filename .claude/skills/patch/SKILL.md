---
name: patch
description: Dringende bugfix of kleine config-wijziging snel live zetten. Fast-gate only, geen E2E. Alleen voor team-release.
user-invocable: true
disable-model-invocation: true
argument-hint: "[patch-scope: wat moet live? commit range of beschrijving]"
---

# Patch — Dringende fix snel live

Gebruik deze skill voor **urgente bugfixes, typo's of kleine config-wijzigingen** die direct live moeten zonder E2E-vertraging.

## Wanneer Patch (niet Release)

| Patch ✅ | Release ❌ |
|---|---|
| Typo in UI-tekst | Nieuwe feature |
| CSS/styling fix | Schema-wijziging |
| Config-update | Meerdere features gebundeld |
| Bugfix (1-3 regels) | Auth of kritieke logica gewijzigd |
| Copy-aanpassing | Iets wat E2E-verificatie vereist |

Bij twijfel → **Release**, niet Patch.

## ⛔ Autorisatie

**Alleen `team-release` mag deze skill uitvoeren.**  
Andere agents mogen NOOIT rechtstreeks deployen — escaleer altijd naar `product-owner`.

## Commit-bericht vereiste

Het commit-bericht MOET beginnen met `patch:` of `fix:`:

```
patch: herstel mobiele weergave in monitor/overzicht
fix: typefout in evaluatie formulier label
```

CI triggert automatisch de patch-workflow (fast-gate only, geen E2E) bij dit prefix.

## Patch-flow

```
1. fast-gate (~2 min): typecheck + lint + unit tests
2. Railway auto-deploy (na push naar main)
3. verify-deploy: pnpm verify:deploy — bevestigt dat productie live is
```

**Totale doorlooptijd: ~3-5 minuten.**

## Stappen

### 1. Verifieer scope

- Is dit echt een Patch? Zie bovenstaande tabel.
- `git log origin/main..HEAD --oneline` — welke commits gaan mee?
- `git diff origin/main..HEAD` — zijn er schema-wijzigingen, migraties, of grote features? Zo ja → **Release**

### 2. Fast-gate lokaal

```bash
pnpm exec tsc --noEmit        # typecheck
pnpm lint                      # ESLint
pnpm format:check              # Prettier
pnpm test                      # unit tests
```

Als een van deze faalt: fix eerst, dan pas verder.

### 3. Commit en push

- Commit-bericht begint met `patch:` of `fix:`
- Push naar `main`
- CI start automatisch de patch-workflow

### 4. Verificeer CI

```bash
gh run list --limit 3           # patch-workflow status
gh run view <id> --log-failed   # bij failure
```

Wacht tot `fast-gate` job groen is (~2 min).

### 5. Post-deploy verificatie (verplicht)

```bash
pnpm verify:deploy
```

Verwacht output: `✅ Productie is live` met correcte SHA.

Als verify faalt: analyseer oorzaak, rapporteer aan `product-owner`.

## Rapportage aan Product Owner

Na afronding rapporteer aan PO:

- Commit SHA + samenvatting van de patch
- fast-gate status (groen/rood)
- verify-deploy uitslag
- Eventuele acties die nog nodig zijn

## Context

- CI-workflow: `.github/workflows/patch.yml`
- GitHub Environment: `production-patch` (auto-deploy, geen handmatige goedkeuring)
- Budget: ~5 min per Patch-run (GitHub Actions Pro)
