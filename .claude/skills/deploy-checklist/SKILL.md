---
name: deploy-checklist
description: Pre/post-deploy checklist — zorgt ervoor dat deploys voorkomen dat productie out-of-sync raakt met code
user-invocable: true
allowed-tools: Bash, Read, Glob
argument-hint: "[fase: pre | post | full] [app: alle | team-indeling | monitor | evaluatie]"
---

# Deploy Checklist — Voorkomen dat productie out-of-sync raakt

Dit is de enige manier waarop code naar productie mag gaan. Volg deze checklist altijd, anders wordt productie invisible en raken TC en dev uit sync.

**Kritiek:** Dit project is al eenmaal de lucht in gegaan omdat code gecomimt was, maar nooit gedeployd. Deploy is NIET push — deploy is: **push → CI groen → Railway SUCCESS → post-deploy verify**.

## Gouden regels

1. **Pre-deploy:** Verifieer lokaal + CI groen
2. **Push:** Alleen naar `main`, één commit per feature
3. **CI wacht:** ~2-5 minuten, controleer altijd status
4. **Post-deploy:** Voer verify-deploy uit, zorg dat SHA's matchen

## Phase: PRE-DEPLOY

Voer uit VOORDAT je `git push` doet:

### ✅ Stap 1: Git status

```bash
git status
```

Moet schoon zijn, geen uncommitted changes. Als er wel changes zijn:

```bash
# Kijk wat gewijzigd is:
git diff

# Of: stage en commit:
git add <bestanden>
git commit -m "type(scope): beschrijving"
```

### ✅ Stap 2: Typecheck

```bash
# Voor specifieke app (voorbeeld: team-indeling):
pnpm --filter @oranje-wit/web exec tsc --noEmit

# Of alle:
pnpm typecheck
```

Als typecheck faalt: **NIET pushen**. Fix eerst.

### ✅ Stap 3: Unit tests

```bash
pnpm test
```

Als tests falen: **NIET pushen**. Fix eerst. Pre-commit hook zal ook ESLint + Prettier checken.

### ✅ Stap 4: Database migraties checken

```bash
pnpm db:migrate:status
```

Output:

```
Status: Database is up to date
```

Als er pending migraties zijn ("Database has 1 pending migration"):

```bash
# Local development:
pnpm db:migrate

# Productie (Railway) doet dit automatisch via deployment hook
```

**BELANGRIJK:** Nooit `pnpm db:push` gebruiken — dat dropt `speler_seizoenen` VIEW!

### ✅ Stap 5: GitHub push-poging (dry run)

```bash
# Kijk welke commits je gaat pushen:
git log --oneline -3

# Controleer dat ze naar main gaan:
git branch -vv
```

Zorg dat je op `main` bent:

```bash
git checkout main
```

---

## Phase: PUSH → CI → RAILWAY

### ✅ Stap 6: Push naar main

```bash
git push origin main
```

**Dit triggert GitHub Actions CI.**

### ✅ Stap 7: Wacht op CI (VERPLICHT)

Wacht **minimaal 2-5 minuten**. Check dan:

```bash
gh run list --limit 1
```

Expected output:

```
STATUS  TITLE                WORKFLOW  BRANCH  EVENT  AGE
success feat(team-indeling)  CI        main    push   1m
```

**Bij failure:**

```bash
gh run view <run-id> --log-failed
```

Fix de fout, push opnieuw. **NIET**: negeer falende tests.

### ✅ Stap 8: Railway deployment controleren

Pas nadat CI SUCCESS is, check Railway:

```bash
# Kijk services en nieuwe deployment:
# [Bij deze stap: spawn /team-devops deployment agent]
```

Expected: Laatste deployment is SUCCESS.

---

## Phase: POST-DEPLOY

### ✅ Stap 9: Voer verify-deploy uit

```bash
pnpm tsx scripts/verify-deploy.ts
```

Dit checkt:

- [ ] Alle endpoints bereikbaar (HTTP 200)
- [ ] Response times < 3s
- [ ] Git SHA in `/api/health` matcht deploy
- [ ] Verwachte inhoud aanwezig

Output voorbeeld:

```
========================================
POST-DEPLOY VERIFICATIE
========================================

📍 Lokale Git SHA: a1b2c3d
📍 Lokale working tree: schoon
📍 CI status: success (run: xyz)

Productie-endpoints:

| App | Status | Details | Response | SHA |
|---|---|---|---|---|
| Team-Indeling | ✅ GROEN | HTTP 200, gezond (832ms) | 832ms | a1b2c3d |
| Monitor | ✅ GROEN | HTTP 200, gezond (1203ms) | 1203ms | a1b2c3d |
| Evaluatie | ✅ GROEN | HTTP 200, gezond (756ms) | 756ms | a1b2c3d |

Totaal: 3/3 GROEN, 0 ORANJE, 0 ROOD
```

**Bij ROOD of ORANJE:** Zet meteen op alert (spawn deployment agent):

```
/team-devops [deployment probleem beschrijving]
```

### ✅ Stap 10: Rapporteer aan stakeholders

Via Slack (als nodig):

```
Deploy voltooid:
- Commit: a1b2c3d
- Apps: Team-Indeling, Monitor, Evaluatie
- Status: GROEN ✅
```

---

## FULL-DEPLOY (alle stappen)

Voer uit als je volledige deploy-cycle wilt uitvoeren. Dit is wat je doet als je code hebt klaargemaakt:

```bash
# PRE
git status
pnpm typecheck
pnpm test
pnpm db:migrate:status

# PUSH
git push origin main

# CI wacht (handmatig)
gh run list --limit 1

# POST
pnpm tsx scripts/verify-deploy.ts
```

---

## Troubleshooting

### CI faalt, E2E test is ongerelateerd aan mijn wijziging

**FOUT ANTWOORD:** Negeer de test en push toch.

**GOED ANTWOORD:**
1. Fix de test EN je code
2. Push opnieuw
3. CI moet GROEN zijn

Falende tests blokkeren ALLE deploys — dat is gewenst.

### Deploy verschijnt niet in Railway

1. Check CI status: `gh run list --limit 1`
2. Als CI SUCCESS: check Railway deployment
3. Als Railway FAILED: `railway_logs` (deployment agent)

### Productie-SHA matcht niet met lokale SHA

Dit betekent dat de live versie NIET je code draait.

1. Check: `curl https://teamindeling.ckvoranjewit.app/api/health`
2. Compare `version` veld met `git rev-parse HEAD`
3. Als SHA oud is: check Railroad logs, is de build stuck?
4. Trigger handmatig: spawn deployment agent

### Database migratie failed op productie

Railway voert migraties uit via `pnpm db:migrate:deploy` in de deployment hook.

1. Controleer: `railway_logs` (deployment agent)
2. Fix schema/migratie lokaal
3. Push opnieuw
4. CI → Railway → check migratie succesvol

---

## Gerelateerde

| Skill | Doel |
|---|---|
| `/ci-status` | Gedetailleerde CI troubleshooting |
| `/team-devops deployment` | Deployment-issues, Railway logs, rollback |
| `/health-check` | Volledige productie-healthcheck (omvat meer dan post-deploy) |
