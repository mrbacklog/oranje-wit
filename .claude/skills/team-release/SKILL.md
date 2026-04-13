---
name: team-release
description: Start het release-team om Patch of Release naar productie te brengen. Alleen te starten door product-owner of Antjan.
disable-model-invocation: true
argument-hint: "<mode: patch|release> <scope: wat gaat live>"
---

# Agent Team: Release

Start dit team om wijzigingen naar productie te brengen. Ontvangt opdracht van `product-owner` met expliciete mode en scope.

## ⛔ Autorisatie

**Alleen `product-owner` of Antjan mag dit team starten.**  
Andere agents mogen NOOIT dit team of de deploy-skills aanroepen.

## Twee modes

| Mode | Wanneer | CI-tijd | E2E |
|---|---|---|---|
| **Patch** | Urgente bugfix, typo, kleine config | ~3-5 min | ❌ geen |
| **Release** | Features, bundel, schema-wijziging | ~25-35 min | ✅ smoke + full |

Bij ontvangst van opdracht: **bevestig de mode** vóór je verder gaat.

## Team samenstelling

### Lead: ontwikkelaar
- Bepaalt mode (Patch/Release) op basis van diff-analyse
- Voert fast-gate lokaal uit
- Maakt commit met correct prefix (`patch:`/`fix:` voor Patch)
- Bij Release: maakt release branch + push
- Rapporteert terug aan PO na afronding

### Teammate 1: e2e-tester
- **Patch**: geen actie vereist
- **Release**: bewaakt smoke-e2e + full-e2e pipeline
- Analyseert falende tests, geeft go/no-go voor full-E2E
- Post-deploy: optionele smoke check tegen productie

### Teammate 2: deployment
- Monitort GitHub Actions CI status
- Bewaakt Railway build + health check
- Verifieert custom domain bereikbaarheid
- Rapporteert deployment-status terug aan ontwikkelaar

## Opdracht ontvangen van PO

De PO geeft mee:
- **Mode**: `patch` of `release`
- **Scope**: welke commits / welke apps / beschrijving
- **Commit range** (optioneel): bijv. `abc123..HEAD`

Als mode onduidelijk is: analyseer `git diff origin/main..HEAD --stat` en beslis op basis van de mode-tabel.

## Werkwijze Patch

1. **ontwikkelaar** laadt `/patch` skill en volgt de stappen exact
2. Fast-gate lokaal → commit (`patch:`/`fix:` prefix) → push naar main
3. **deployment** monitort CI patch-workflow + Railway deploy
4. `pnpm verify:deploy` → bevestig productie live
5. Rapporteer aan PO: SHA, fast-gate status, verify-uitslag

## Werkwijze Release

1. **ontwikkelaar** laadt `/release` skill en volgt de stappen exact
2. Release branch aanmaken → push → CI release-workflow start
3. **e2e-tester** bewaakt smoke-e2e — bij failure: fix + re-push (geen full-E2E verspilling)
4. Na smoke groen: full-E2E start (~12-15 min)
5. Na full-E2E groen: pipeline wacht op handmatige goedkeuring Antjan
6. **deployment** monitort deploy-job + health check + custom domain
7. `pnpm verify:deploy` → bevestig productie live
8. **deployment** draait `/benchmark save` → vervolgens `/canary` → rapporteert resultaat aan `ontwikkelaar`
9. **ontwikkelaar** verwerkt het canary-resultaat in de eindrapportage aan PO
10. Rapporteer aan PO: release branch, SHAs, test-status, verify-uitslag, canary-resultaat, GitHub Release URL

## Post-deploy verplichte acties (beide modes)

- [ ] `pnpm verify:deploy` uitvoeren
- [ ] SHA-check: productie-SHA = lokale HEAD?
- [ ] Controleer of Railway build groen is in de CI-logs
- [ ] Patch: `/benchmark save` (baseline opslaan, geen canary)
- [ ] Release: `/benchmark save` → `/canary` → canary-resultaat in rapportage PO
- [ ] Rapporteer statusoverzicht terug aan PO

## Communicatiepatronen

```
product-owner (opdracht + mode)
    ↓
ontwikkelaar (lead)
    ├── e2e-tester (smoke/full E2E bewaking — alleen bij Release)
    └── deployment (CI + Railway + verify)
    ↓
product-owner (rapportage)
    ↓
Antjan (eindstatus)
```

## Memory

Bij het starten MOET de lead relevante memories raadplegen:
- Bekende deploy-issues of workarounds
- Deploy-valkuilen per app (env vars, Railway quirks)
- Feedback op eerdere releases

## Context

- **Patch CI**: `.github/workflows/patch.yml` — environment `production-patch` (auto)
- **Release CI**: `.github/workflows/release.yml` — environment `production-release` (handmatige goedkeuring)
- **Smoke suite**: `e2e/smoke/smoke.spec.ts`
- **Verify**: `pnpm verify:deploy`
- **Database**: NOOIT `pnpm db:push` draaien
- **Taal**: Nederlands

## Opdracht

$ARGUMENTS
