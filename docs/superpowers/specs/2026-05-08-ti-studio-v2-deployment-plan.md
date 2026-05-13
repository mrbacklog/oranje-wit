# TI Studio v2 Deployment Plan — Verfijnd 2026-05-13

**Datum**: 2026-05-08, bijgewerkt 2026-05-13  
**Status**: Verfijning voltooid — Railway test-DB voorbereiding  
**Doel**: Voorbereiding v2-realisatie met parallel build + test + smooth cutover naar productie

---

## Architectuur Samenvatting (2026-05-13)

| Fase | Domein | Railway-service | Database | Doel |
|---|---|---|---|---|
| **0-2: Bouw + E2E** | `studio-test.ckvoranjewit.app` | `studio-test` (Next.js v2) | **NIEUW: PostgreSQL `oranjewit-test`** (maandelijks refresh via snapshot) | Veilig bouwen + testen |
| **3: Parallel-test** | `studio-next.ckvoranjewit.app` | `studio-next` (zelfde codebase, andere service) | Productie-DB `oranjewit` (gedeeld met v1) | TC-test naast v1 |
| **4: Cutover** | `teamindeling.ckvoranjewit.app` (DNS-swap) + `teamindeling-oud.ckvoranjewit.app` (v1 fallback) | studio-next service | Productie-DB | Live |

**Kritieke keuzes:**
- **Twee aparte Railway-services**: `studio-test` blijft als sandbox bestaan ná promotie naar `studio-next`
- **Test-DB opzet**: PostgreSQL `oranjewit-test` op Railway, gevoed via `snapshot-prod-to-dev.ts` met SNAPSHOT_TARGET env-var
- **Sportlink in fase 0-2**: UIT (test-DB, geen Sportlink-koppeling). In fase 3+: AAN (beide actief met DB advisory lock + cron-offset)

---

## 1. Railway Service Configuratie (herzien)

### Services per fase

#### Fase 0-2: Bouw + E2E Testing

**Service: `studio-test`**

| Parameter | Waarde |
|---|---|
| **Service naam** | `studio-test` |
| **Root directory** | `apps/ti-studio-v2` |
| **Build command** | `pnpm --filter @oranje-wit/ti-studio-v2 build` |
| **Start command** | `node apps/ti-studio-v2/.next/standalone/apps/ti-studio-v2/start.sh` |
| **Dockerfile** | `apps/ti-studio-v2/Dockerfile` |
| **Domein** | `studio-test.ckvoranjewit.app` |
| **Database URL** | `RAILWAY_DATABASE_URL` → PostgreSQL `oranjewit-test` (aparte instance) |
| **NEXTAUTH_SECRET** | Railway env var (identiek v1) |
| **NEXTAUTH_URL** | `https://studio-test.ckvoranjewit.app` |
| **SPORTLINK_ENABLED** | `false` (test-DB, geen Sportlink sync) |
| **NODE_ENV** | `production` |
| **PORT** | `3000` |

**PostgreSQL test-instance: `oranjewit-test`**
- Nieuwe PostgreSQL service op Railway (zelfde project als productie)
- Initiale snapshot: volledige produksie-DB (alle 61 modellen) via `snapshot-prod-to-dev.ts --target=railway-test`
- Refresh-schema: maandelijks (bijv. eerste van de maand, via CI-taak)
- Bereikt via: `$TEST_DATABASE_URL` env-var

#### Fase 3: Parallel-testing met TC

**Service: `studio-next`**

| Parameter | Waarde |
|---|---|
| **Service naam** | `studio-next` |
| **Root directory** | `apps/ti-studio-v2` (zelfde codebase als `studio-test`) |
| **Build command** | `pnpm --filter @oranje-wit/ti-studio-v2 build` |
| **Domein** | `studio-next.ckvoranjewit.app` |
| **Database URL** | `RAILWAY_DATABASE_URL` → PostgreSQL `oranjewit` (productie) |
| **NEXTAUTH_URL** | `https://studio-next.ckvoranjewit.app` |
| **SPORTLINK_ENABLED** | `false` (nog niet live) |

#### Fase 4: Cutover (DNS-swap)

**Service: `studio-next` wordt primair**

| Parameter | Waarde |
|---|---|
| **Domein primair** | `teamindeling.ckvoranjewit.app` (DNS-swap naar `studio-next`) |
| **Database URL** | `RAILWAY_DATABASE_URL` → PostgreSQL `oranjewit` (productie) |
| **NEXTAUTH_URL** | `https://teamindeling.ckvoranjewit.app` |
| **SPORTLINK_ENABLED** | `true` (v2 actief, v1 uitzetten) |

**Service: v1 fallback**

| Parameter | Waarde |
|---|---|
| **Service naam** | `ti-studio` (v1, ongewijzigd) |
| **Domein** | `teamindeling-oud.ckvoranjewit.app` (DNS-redirect naar v1) |
| **Database URL** | `RAILWAY_DATABASE_URL` → PostgreSQL `oranjewit` (productie) |
| **SPORTLINK_ENABLED** | `false` (v2 is primair) |

---

## 2. Domein-strategie (herzien)

### Bouw- en Testfase (Fase 0-2)

**Test domein v2**:  
`studio-test.ckvoranjewit.app`

- v2 service draait op dit domein gedurende development + QA
- SSL-certificaat via Let's Encrypt (Cloudflare beheerd)
- Custom domain via Railway GraphQL, DNS CNAME via Cloudflare

```
studio-test.ckvoranjewit.app  CNAME  studio-test-production.up.railway.app
```

### Parallel-testing (Fase 3)

**Test domein v2 voor TC**:  
`studio-next.ckvoranjewit.app`

- Aparte Railway service `studio-next` draaien (codebase is zelfde, maar service != service)
- Beide services (`studio-test` en `studio-next`) kunnen langdurig co-existeren
- v1 productie blijft op `teamindeling.ckvoranjewit.app`

```
studio-test.ckvoranjewit.app  CNAME  studio-test-production.up.railway.app
studio-next.ckvoranjewit.app  CNAME  studio-next-production.up.railway.app
teamindeling.ckvoranjewit.app CNAME  ti-studio-production.up.railway.app (v1)
```

### Cutover (Fase 4)

**Stap 1: v2 wordt primair** (dag X, bijv. 2026-06-15)

```
teamindeling.ckvoranjewit.app CNAME  studio-next-production.up.railway.app
```

**Stap 2: v1 valt terug naar legacy-domein**

```
teamindeling-oud.ckvoranjewit.app CNAME  ti-studio-production.up.railway.app
studio-test.ckvoranjewit.app       CNAME  studio-test-production.up.railway.app  (blijft bestaan als sandbox)
```

**Stap 3: Optionele v1 shutdown** (na 2-4 weken stabiliteit)

- v1 service kan off gezet worden
- Legacy-domein kan naar error-page gaan

### SSL-Certificaten

Per Railway custom domain:
- `studio-test.ckvoranjewit.app`: Let's Encrypt cert (automatisch)
- `studio-next.ckvoranjewit.app`: Let's Encrypt cert (automatisch)
- `teamindeling.ckvoranjewit.app`: Let's Encrypt cert (na cutover)
- `teamindeling-oud.ckvoranjewit.app`: Let's Encrypt cert (na cutover)

**Rate limit**: Max 5 certs per domein per week — geen probleem met staggered procedure.

---

## 3. Auth-Cookie-Strategie

### Doel
Alle v2 versies (`studio-test` en `studio-next`) en v1 gebruiken dezelfde session-cookie.
User logt in op v1 → session werkt op beide v2-versies zonder opnieuw inloggen.

### Implementatie

**NextAuth versie**: Alle apps gebruiken `next-auth@5.0.0-beta.28`

**NEXTAUTH_SECRET**: Identiek voor v1, studio-test en studio-next
```env
NEXTAUTH_SECRET=<dezelfde random string voor alle>
```

**Cookie domain**: `.ckvoranjewit.app` (basisdomain)

**Werking**:
1. Browser logt in op `teamindeling.ckvoranjewit.app` (v1)
2. NextAuth set cookie met domain `.ckvoranjewit.app`
3. Browser visit `studio-test.ckvoranjewit.app` of `studio-next.ckvoranjewit.app` (v2)
4. Cookie wordt meegestuurd (same basisdomain)
5. v2 decodeert session met dezelfde NEXTAUTH_SECRET
6. ✅ Session geldig in beide v2-versies zonder opnieuw inloggen

**NEXTAUTH_URL per fase**: Beide apps hebben eigen callback-URL
```
v1:          NEXTAUTH_URL=https://teamindeling.ckvoranjewit.app
v2-test:     NEXTAUTH_URL=https://studio-test.ckvoranjewit.app (fase 0-2)
v2-next:     NEXTAUTH_URL=https://studio-next.ckvoranjewit.app (fase 3)
v2-next end: NEXTAUTH_URL=https://teamindeling.ckvoranjewit.app (fase 4+)
```

---

## 4. Test-Database Opzet (Nieuw)

### PostgreSQL `oranjewit-test` aanmaken

**Stap 1: Railway Dashboard**
1. Ga naar project "oranje-wit-db"
2. Klik "+ New"
3. Selecteer "PostgreSQL"
4. Naam: `oranjewit-test`
5. Standaard instellingen (hetzelfde als productie-instance)

**Stap 2: Schema-deploy**
```bash
# Railway test-DB URL ophalen via Dashboard
export TEST_DATABASE_URL="postgresql://user:pass@host:port/oranjewit_test"

# Schema deployen (alle 61 modellen)
pnpm db:migrate:deploy --database-url="$TEST_DATABASE_URL"

# VIEW speler_seizoenen herstellen
pnpm db:ensure-views --database-url="$TEST_DATABASE_URL"
```

**Stap 3: Initiële snapshot**
```bash
# Maandelijks: productie → test (VOLLEDIGE kopiering)
PROD_DATABASE_URL="$RAILWAY_DATABASE_URL" \
TEST_DATABASE_URL="postgresql://..." \
npx tsx scripts/snapshot-prod-to-dev.ts --target=railway-test
```

**Stap 4: Railway `studio-test` service env-var**
```
DATABASE_URL = [TEST_DATABASE_URL van stap 2]
```

### Snapshot-script update (zie deel 3 hieronder)

`snapshot-prod-to-dev.ts` krijgt env-var `SNAPSHOT_TARGET`:
- `docker-dev` (default): naar `localhost:5434/oranjewit_dev`
- `railway-test`: naar `TEST_DATABASE_URL` (Railway `oranjewit-test`)

---

## 5. CI/CD-Impact

### Huidige State (ci.yml)

```yaml
fast-gate:
  - typecheck (@oranje-wit/web, @oranje-wit/ti-studio)
  - lint (@oranje-wit/web, @oranje-wit/ti-studio)
  - format check
  - unit tests (alles)

build:
  - pnpm build (web)
  - pnpm --filter @oranje-wit/ti-studio build (v1)

e2e:
  - Playwright tests

deploy:
  - Railway deploy web
  - Railway deploy ti-studio (v1)
```

### Wijzigingen voor v2

#### Option A: Parallel builds (aanbevolen)

```yaml
fast-gate:
  + typecheck @oranje-wit/ti-studio-v2
  + lint @oranje-wit/ti-studio-v2

build:
  + pnpm --filter @oranje-wit/ti-studio-v2 build

e2e:
  (geen wijzigingen — v2 wordt pas na merge getested)

deploy:
  + Trigger v2 deploy ALLEEN als v2-code gewijzigd is
  + Alternatie: altijd beide deployen (eenvoudiger, langzamer)
```

**Implementatie** (git-diff trigger):
```bash
if git diff HEAD~1 --name-only | grep -q '^apps/ti-studio-v2/'; then
  echo "v2 wijzigingen gedetecteerd — deploy triggeren"
  deploy_with_retry "$RAILWAY_SERVICE_STUDIO_TEST" "studio-test"
fi
```

#### GitHub Secrets toevoegen

```
RAILWAY_SERVICE_STUDIO_TEST = <service ID van Railway studio-test>
RAILWAY_SERVICE_STUDIO_NEXT = <service ID van Railway studio-next> (fase 3+)
```

---

## 6. Cutover-Procedure (herzien)

### Timeline

| Dag | Activiteit | Owner | Downtime |
|-----|-----------|-------|----------|
| X | Finale v2 QA op `studio-next.ckvoranjewit.app` | Antjan | ❌ Geen |
| X+1 | DNS cut: `teamindeling.ckvoranjewit.app` → studio-next service | DevOps | ⚠️ 1-3 min |
| X+1 | Verifieer v2 live | Release team | ❌ Geen |
| X+1 | v1 service gaat naar `teamindeling-oud.ckvoranjewit.app` | DevOps | ❌ Geen |
| X+1 | `studio-test` blijft als sandbox | DevOps | ❌ Geen |
| X+2 | Monitoring v2 productie (24u) | DevOps | ❌ Geen |
| X+7 | Besluit: v1 afzetten of behouden als fallback | Product Owner | ❌ Geen |

### Stappen (Antjan en DevOps)

#### Stap 1: Prep (dag X, 14:00 UTC)

```bash
# DevOps: Alle services live
railway_status
# ✅ studio-test (env: oranjewit-test)
# ✅ studio-next (env: oranjewit prod)
# ✅ ti-studio (v1)

# Antjan: Final test op studio-next.ckvoranjewit.app
# Scenario's: Login, team-indeling, what-if, export, scenario-opslag
# ✅ = Go
```

#### Stap 2: DNS-Cut (dag X+1, 15:00 UTC)

```bash
# DevOps: Update Cloudflare DNS
# VOOR:
#   teamindeling.ckvoranjewit.app CNAME ti-studio-production.up.railway.app
#
# NA:
#   teamindeling.ckvoranjewit.app CNAME studio-next-production.up.railway.app

# Via Cloudflare API
curl -X PUT https://api.cloudflare.com/client/v4/zones/<zone>/dns_records/<record_id> \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -d '{"name":"teamindeling.ckvoranjewit.app","content":"studio-next-production.up.railway.app"}'

# Wait 5 min voor DNS propagatie
sleep 300

# Check DNS
nslookup teamindeling.ckvoranjewit.app
# Expected: studio-next IP

# Check app live
curl -s -o /dev/null -w "%{http_code}" https://teamindeling.ckvoranjewit.app/api/health
# Expected: 200
```

#### Stap 3: Verifieer v2 (dag X+1, 15:15 UTC)

```bash
# Release team: Health check
for url in "https://teamindeling.ckvoranjewit.app/api/health" \
           "https://studio-next.ckvoranjewit.app/api/health" \
           "https://studio-test.ckvoranjewit.app/api/health"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    echo "✅ $url OK"
  else
    echo "❌ $url FAILED ($status)"
  fi
done

# Antjan: Smoke test in browser
# - Login met Google
# - Open een project
# - Edit team, save
# - Check API calls in DevTools (all 200/201)
```

#### Stap 4: v1 → Legacy (dag X+1, 15:30 UTC)

```bash
# DevOps: Create custom domain voor v1 (fallback)
railway_custom_domain_create \
  domain: "teamindeling-oud.ckvoranjewit.app" \
  service: "ti-studio"

# Cloudflare DNS
# teamindeling-oud.ckvoranjewit.app CNAME ti-studio-production.up.railway.app

# v2 is nu primair, v1 is fallback, studio-test is sandbox
```

#### Stap 5: Rollback-Plan (als nodig, dag X+1 17:00 UTC)

```bash
# Als v2 crashes:
# 1. Revert DNS cut:
curl -X PUT https://api.cloudflare.com/client/v4/zones/<zone>/dns_records/<record_id> \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -d '{"name":"teamindeling.ckvoranjewit.app","content":"ti-studio-production.up.railway.app"}'

# 2. DNS propagatie: ~2 min
# 3. Antjan testet v1 (oud) → moet werken
# 4. Diagnose v2 issue → fix in code → redeploy

# Expected downtime: 5-10 min
```

---

## 7. Risico's

### Kritiek (voorafgaand akkoord van Antjan nodig)

#### 1. **Dubbele server actions tegen dezelfde database (Fase 3+)**

**Situatie**: studio-next en v1 draaien tegelijk op productie-DB.

**Risico**: Twee app-instances kunnen tegelijk writes doen → race conditions.

**Mitigatie**:
1. **Fase 0-2**: studio-test gebruikt aparte `oranjewit-test` DB — geen conflict
2. **Fase 3**: TC-leden testen studio-next, Antjan kan v1 gebruiken (niet gelijktijdig editen)
3. **Monitoring**: Watch database transaction logs

**Akkoord nodig?** JA (Fase 3 parallelle test protocol)

#### 2. **Let's Encrypt rate limit op cutover**

**Situatie**: Vier custom domains per fase = vier certs.

**Mitigatie**:
1. Alle certs voorbereid (getest met staging cert) vóór cutover
2. Stagger cert-requests (niet alles tegelijk)

**Akkoord nodig?** JA (cert prepping protocol)

#### 3. **Sportlink-sync dubbel (Fase 3+)**

**Situatie**: v1 en studio-next hebben beide Sportlink sync.

**Risico**: Twee apps tegelijk sync-request → Sportlink API rate limit.

**Mitigatie**:
1. Fase 0-2: v2 `SPORTLINK_ENABLED=false` (test-DB, geen koppeling)
2. Fase 3: studio-next heeft `SPORTLINK_ENABLED=false` (TC-test, niet actief)
3. Na cutover: v1 uitzetten, v2 aanzetten
4. Stagger crons: studio-next uur 01:30 UTC

**Akkoord nodig?** JA

---

## 8. Samenvatting voor Antjan

| Vraag | Antwoord |
|---|---|
| **Hoe test ik fase 0-2?** | Op `studio-test.ckvoranjewit.app` met aparte test-DB (`oranjewit-test`). Schema en data staan apart van productie. |
| **Hoe test TC fase 3?** | Op `studio-next.ckvoranjewit.app` met gedeelde productie-DB. v1 is nog primair. |
| **Hoe cutover?** | DNS-swap: `teamindeling.ckvoranjewit.app` → studio-next. v1 fallback op `teamindeling-oud.ckvoranjewit.app`. |
| **Kan ik alle drie domein tegelijk gebruiken?** | Ja: v1 op `teamindeling.ckvoranjewit.app`, v2-next op `studio-next.ckvoranjewit.app`, v2-test op `studio-test.ckvoranjewit.app`. |
| **Wat gebeurt er met studio-test na cutover?** | Blijft bestaan als sandbox voor development. Kan gebruikt worden voor experimenten. |
| **Downtime cutover?** | ~1-3 minuten (DNS-cut + propagatie). v1 backup draait op `teamindeling-oud.ckvoranjewit.app`. |
| **Wat als v2 crashes?** | Revert DNS-cut → v1 comes back (2-5 min recovery). Diagnose v2 issue. |

---

## 9. Volgende Stappen

1. **DevOps**: Railway services (`studio-test`, `studio-next`) aanmaken, PostgreSQL `oranjewit-test` opzetten, env vars inrichten
2. **Desenvolvedor**: CI bijwerken met v2 deploy-triggers
3. **Operador**: `snapshot-prod-to-dev.ts` aanpassen met `SNAPSHOT_TARGET` env-var (zie `2026-05-13-railway-test-db-setup.md`)
4. **Antjan**: Fase 0-2 testen op `studio-test.ckvoranjewit.app`

---

**Document-locatie**: `/c/Users/Antjan/oranje-wit/docs/superpowers/specs/2026-05-08-ti-studio-v2-deployment-plan.md`
