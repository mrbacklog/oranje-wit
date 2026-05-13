# Railway Test-Database Setup — Stappenplan

**Datum**: 2026-05-13  
**Doel**: PostgreSQL `oranjewit-test` opzetten voor v2 Fase 0-2 (bouw + E2E testing)  
**Verantwoordelijke**: team-devops  
**Gerelateerd**: `2026-05-08-ti-studio-v2-deployment-plan.md` sectie 4 + `snapshot-prod-to-dev.ts`

---

## Samenvatting

v2 Fase 0-2 (`studio-test.ckvoranjewit.app`) test op aparte PostgreSQL `oranjewit-test` database in plaats van productie-DB. Dit geeft veilige isolatie: schema migrations, test-data-loads, en snapshot-refreshes beïnvloeden niet de live productie-database.

Test-DB wordt gevoerd via `snapshot-prod-to-dev.ts --target=railway-test`:
- **Initieel**: volledige productie-snapshot (alle 61 modellen)
- **Maandelijks**: refresh op eerste van de maand via CI-taak
- **Ad-hoc**: manueel refresh via command-line

---

## Stap 1: PostgreSQL `oranjewit-test` Instance Aanmaken

**Locatie**: Railway Dashboard → Project "oranje-wit-db" (zelfde als productie)

**Procedure:**
1. Ga naar https://railway.app
2. Selecteer project "oranje-wit-db"
3. Klik "+ New"
4. Selecteer "PostgreSQL"
5. Instellingen:
   - **Naam**: `oranjewit-test`
   - **Port**: default (5432)
   - **Username**: `postgres` (default)
   - **Password**: auto-gegenereerd (Railway genereert)
   - **Database**: `oranjewit_test` (auto-gegenereerd)
6. Klik "Create"

**Verificatie:**
- Railway Dashboard toont twee PostgreSQL services: `Postgres` (prod) en `oranjewit-test` (test)
- Kopieer de **connection string** uit Railway → noteer in stap 2

---

## Stap 2: Connection String Ophalen

**Locatie**: Railway Dashboard → `oranjewit-test` service → "Connect"

**Kopieëren:**
```
postgresql://postgres:PASSWORD@host:port/oranjewit_test
```

**Opslaan als env-var:**
```bash
# .env.local (development)
export TEST_DATABASE_URL="postgresql://postgres:PASSWORD@host:port/oranjewit_test"

# GitHub Secret (CI maandelijks refresh)
gh secret set TEST_DATABASE_URL -R mrbacklog/oranje-wit
```

---

## Stap 3: Schema-Deploy op Test-DB

**Voorwaarde**: `pnpm db:migrate` scripts zijn voorbereid in `packages/database/`

**Procedure:**

```bash
# 1. Genereer Prisma client (nodig voor migratie-scripts)
pnpm db:generate

# 2. Deploy alle migraties naar test-DB
# (Zelfde stappen als productie setup)
TEST_DATABASE_URL="postgresql://..." \
  pnpm db:migrate:deploy

# 3. Herstel VIEW speler_seizoenen (kritieke VIEW voor v2)
TEST_DATABASE_URL="postgresql://..." \
  pnpm db:ensure-views
```

**Output verwacht:**
```
Applying migration `20250101000000_init`
Applying migration `20250102000000_teams_anomalie`
...
All migrations applied successfully.

VIEW speler_seizoenen restored (4 columns, X dependencies)
```

**Controleer** dat alle 61 modellen in `prisma/schema.prisma` aanwezig zijn in test-DB:
```bash
TEST_DATABASE_URL="postgresql://..." \
  pnpm run prisma db seed  # (optioneel: bestaande seed-script)
```

---

## Stap 4: Initiële Snapshot (Productie → Test)

**Wat**: Volledige kopiering van productie-data naar test-DB (eenmalig na schema-setup)

**Procedure:**

```bash
# Snapshot-script draait met env-var SNAPSHOT_TARGET=railway-test
PROD_DATABASE_URL="$RAILWAY_DATABASE_URL" \
TEST_DATABASE_URL="postgresql://..." \
  npx tsx scripts/snapshot-prod-to-dev.ts --target=railway-test
```

**Output verwacht:**
```
=== Snapshot prod → test (railway-test) ===
Productie-rijen: { seizoenen: 5, leden: 304, teams: 12, ... }
Truncate test-tabellen...
[seizoenen] 5 rijen gekopieerd
[leden] 304 rijen gekopieerd
...
=== Snapshot voltooid ===
```

**Verificatie:**
```bash
# Controleer aantal rijen
TEST_DATABASE_URL="postgresql://..." psql -c "SELECT COUNT(*) FROM leden;"
# Expected: 304 (of huidige productie-tellers)
```

---

## Stap 5: Railway `studio-test` Service Env-Var Instellen

**Locatie**: Railway Dashboard → `studio-test` service → "Variables"

**Voeg toe:**
```
DATABASE_URL = [TEST_DATABASE_URL van stap 2]
SPORTLINK_ENABLED = false
```

**Opslaan** → Railway redeploy automatisch

---

## Stap 6: Maandelijkse Snapshot-Refresh (CI-taak)

**Optioneel, maar aanbevolen** voor up-to-date test-data.

**Procedure** (in `.github/workflows/scheduled-refresh.yml` of equivalent):

```yaml
name: Monthly Test-DB Snapshot Refresh

on:
  schedule:
    - cron: '0 2 1 * *'  # Eerste van de maand, 02:00 UTC

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install
      
      - name: Snapshot prod → test
        env:
          PROD_DATABASE_URL: ${{ secrets.RAILWAY_DATABASE_URL }}
          TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        run: npx tsx scripts/snapshot-prod-to-dev.ts --target=railway-test
```

---

## Stap 7: Lokale Ontwikkeling — Docker Setup (Ongewijzigd)

**Bestaande workflow**: Lokale `docker-compose.yml` draait `postgres:16` op `localhost:5434`.

**Geen wijziging** — `snapshot-prod-to-dev.ts --target=docker-dev` blijft standaard:

```bash
# Lokaal: snapshot prod → docker dev (bestaande setup)
PROD_DATABASE_URL="$RAILWAY_DATABASE_URL" \
DEV_DATABASE_URL="postgresql://localhost:5434/oranjewit_dev" \
  npx tsx scripts/snapshot-prod-to-dev.ts --target=docker-dev
```

**Nieuwe optie** naast bestaande:

```bash
# Railway test-DB: snapshot prod → railway-test
PROD_DATABASE_URL="$RAILWAY_DATABASE_URL" \
TEST_DATABASE_URL="$TEST_DATABASE_URL" \
  npx tsx scripts/snapshot-prod-to-dev.ts --target=railway-test
```

---

## Stap 8: Verificatie Checklist

Controleer na setup:

- [ ] PostgreSQL `oranjewit-test` service zichtbaar in Railway Dashboard
- [ ] Connection string werkt: `psql "$TEST_DATABASE_URL"`
- [ ] Schema deployed: `\dt` toont 61 tabellen
- [ ] VIEW hersteld: `SELECT * FROM speler_seizoenen LIMIT 1;` werkt
- [ ] Initiale snapshot compleet: `SELECT COUNT(*) FROM leden;` ≠ 0
- [ ] Railway `studio-test` service heeft `DATABASE_URL` env-var ingesteld
- [ ] `studio-test.ckvoranjewit.app` bereikbaar + login werkt
- [ ] Snapshot-script ondersteunt beide targets: `--target=docker-dev` en `--target=railway-test`

---

## Troubleshooting

### Connection refused op TEST_DATABASE_URL

**Oorzaak**: Railway host/port incorrect of firewall.

**Fix**: Hercheck connection string in Railway Dashboard. Copy-paste exact.

### VIEW `speler_seizoenen` niet hersteteld

**Oorzaak**: `pnpm db:ensure-views` faalt, mogelijk schema-incompatibiliteit.

**Fix**:
```bash
# Handmatig herstel
TEST_DATABASE_URL="postgresql://..." \
  psql -c "CREATE OR REPLACE VIEW speler_seizoenen AS ..."
```

### Snapshot mislukt: "Parameter count mismatch"

**Oorzaak**: Kolom-verschil tussen prod en test (bijv. schema is niet gelijk).

**Fix**:
1. Controleer beide schemas: `pnpm prisma db pull` op beide DBs
2. Herrun schema deploy op test-DB
3. Herstart snapshot

### `studio-test` service laadt, maar database-queries falen

**Oorzaak**: `DATABASE_URL` env-var niet ingesteld op Railway service.

**Fix**: Hercheck stap 5 — `DATABASE_URL` moet exact match `TEST_DATABASE_URL`.

---

## Volgende Stappen

1. **DevOps voert alle stappen uit** (1-7)
2. **Operator past `snapshot-prod-to-dev.ts` aan** (zie aparte taak) met `SNAPSHOT_TARGET` env-var
3. **CI-taak** voor maandelijks refresh (stap 6, optioneel maar aanbevolen)
4. **Antjan start Fase 0-2** testen op `studio-test.ckvoranjewit.app`
