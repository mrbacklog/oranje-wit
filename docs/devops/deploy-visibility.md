# Deploy Visibility — Post-Deploy Verificatie

## Achtergrond

**Incident 2026-03-31:** Code was gecommit naar `main` en merged, maar nooit gedeployd naar productie. Productie draaide een oude versie met kaputte teams-pagina. Dit duurde een dag voordat het werd ontdekt omdat er geen systeem was om deploy-invisibility op te merken.

Dit document beschrijft hoe het verificatiesysteem dit voorkomt.

## Systeem

### Componenten

1. **`/api/health` endpoint** — Exposeert:
   ```json
   {
     "status": "ok",
     "app": "oranje-wit",
     "version": "a80c3a3f7e...",
     "timestamp": "2026-04-03T14:30:00Z",
     "checks": { "database": { "status": "ok", "latencyMs": 23 } }
   }
   ```
   - `version` = `RAILWAY_GIT_COMMIT_SHA` (Git commit SHA die live draait)
   - HTTP 200 = gezond, HTTP 503 = database offline

2. **`/api/version` endpoint** — Lightweight variant:
   ```json
   {
     "version": "a80c3a3f7e",
     "build": "2026-04-03T14:30:00Z",
     "env": "production",
     "app": "oranje-wit",
     "timestamp": "2026-04-03T14:30:00Z"
   }
   ```

3. **`pnpm verify:deploy` script** — Post-deploy verification:
   ```bash
   pnpm verify:deploy
   ```
   - Checkt alle 3 apps: Team-Indeling, Monitor, Evaluatie
   - Verifieert SHA match (lokale commit vs productie version)
   - Verifieert response times < 3s
   - Rapporteert: GROEN / ORANJE / ROOD
   - Exit code: 0 = OK, 1 = problemen, 2 = script fout

4. **`.claude/skills/deploy-checklist`** — De complete flow

## Deploy flow met verificatie

### Scenario: Deploy Team-Indeling fix

```bash
# 1. DEVELOP lokaal
# ... maak wijzigingen ...

# 2. PRE-DEPLOY verificatie (schoon werking tree)
git status                    # moet schoon zijn
pnpm typecheck                # geen TS errors
pnpm test                     # tests groen
pnpm db:migrate:status        # geen pending migraties

# 3. COMMIT en PUSH naar main
git add apps/web/src/app...
git commit -m "fix(team-indeling): ..."
git push origin main          # TRIGGERT CI

# 4. WACHT op CI (GitHub Actions)
# (Duurt ~2-5 minuten)
gh run list --limit 1         # Status checken

# 5. RAILWAY auto-deploy
# (Duurt ~2-3 minuten na CI SUCCESS)

# 6. POST-DEPLOY VERIFICATIE ← THIS IS NEW
pnpm verify:deploy

# Expected output:
# ========================================
# POST-DEPLOY VERIFICATIE
# ========================================
#
# 📍 Lokale Git SHA: a80c3a3
# 📍 Lokale working tree: schoon
# 📍 CI status: success (run: 23939978871)
#
# Productie-endpoints:
#
# | App | Status | Details | Response | SHA |
# |---|---|---|---|---|
# | Team-Indeling | ✅ GROEN | HTTP 200, gezond (587ms) | 587ms | a80c3a3 |
# | Monitor | ✅ GROEN | HTTP 200, gezond (345ms) | 345ms | a80c3a3 |
# | Evaluatie | ✅ GROEN | HTTP 200, gezond (412ms) | 412ms | a80c3a3 |
#
# Totaal: 3/3 GROEN, 0 ORANJE, 0 ROOD
```

### Bij ROOD response:

```bash
# 1. ONMIDDELLIJK ALERT
# Deploy is NIET geslaagd

pnpm verify:deploy
# Output:
# | Team-Indeling | ❌ ROOD | Bereikbaarheid fout: timeout | — | — |

# 2. DIAGNOSE
# Check Railway logs
gh run list --limit 1         # CI status?
# [spawn /team-devops deployment agent voor Railway logs]

# 3. FIX EN RETRY
# Fix lokaal, commit, push → repeat
```

### Bij ORANJE response:

```bash
# App bereikbaar maar traag (> 3s)

# 1. MONITOREN
# Kan voorbijgaand zijn (load spike)

# 2. ESCALEREN als persistent
# [spawn /team-devops health-check voor diepere diagnose]
```

## Waarom dit belangrijk is

- **Visibility**: Geen invisibility meer — we WETEN direct dat deploy gelukt is
- **SHA matching**: We BEWIJZEN dat live versie = verwachte commit
- **Automation-ready**: Exit code 1 kan CI/CD pijplijn triggeren als nodig
- **Stakeholders**: Slack notification kan autogenereren uit script output

## Integratie

### Manual (tot nu toe)

```bash
git push main → [wacht CI] → pnpm verify:deploy
```

### Future: GitHub Actions post-deploy job

Kan toevoegen aan `.github/workflows/ci.yml`:

```yaml
- name: Post-Deploy Verification
  if: success()
  run: pnpm verify:deploy
```

Dan faalt CI GEHEEL als deploy verification ROOD is.

## Referenties

- `/api/health` — `apps/web/src/app/api/health/route.ts`
- `/api/version` — `apps/web/src/app/api/version/route.ts`
- Verify script — `scripts/verify-deploy.ts`
- Deploy checklist — `.claude/skills/deploy-checklist/SKILL.md`
