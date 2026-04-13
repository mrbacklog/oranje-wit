---
name: canary
description: Vergelijkt gedrag voor en na een deploy — endpoint response times, auth flows, database latency, pagina-inhoud. Detecteert regressies die /health-check mist.
user-invocable: false
allowed-tools: Bash, Read, Glob
argument-hint: "(geen argumenten — laadt vorige benchmark automatisch)"
---

# Canary — Post-deploy gedragsmonitoring

## Wanneer gebruiken

Alleen aanroepen door `deployment` of `devops` agent als onderdeel van post-deploy verificatie. Niet standalone aanroepen — altijd eerst `/benchmark save` uitvoeren.

## Stap 1: Baseline laden

Lees het meest recente benchmark-bestand:

```bash
ls -t docs/benchmarks/*.json 2>/dev/null | head -1
```

Als er geen benchmark-bestanden bestaan:
- Rapporteer: "**Eerste meting — geen vergelijking mogelijk.** Sla deze meting op als baseline via `/benchmark save`."
- Stop hier.

Als er een baseline is: lees het JSON-bestand en extraheer de baseline response times.

## Stap 2: Huidige endpoint response times meten

Meet alle productie-endpoints 3x en bereken de mediaan:

```bash
# Meting 1
for url in \
  "https://teamindeling.ckvoranjewit.app/api/health" \
  "https://ckvoranjewit.app/api/health"; do
  echo -n "$url: "
  curl -so /dev/null -w "%{http_code} %{time_total}s\n" --max-time 10 "$url" 2>/dev/null || echo "TIMEOUT"
done
```

Herhaal 3x. Bereken mediaan per endpoint.

**Drempelwaarden (vergelijking met baseline):**
- Response time > 150% van baseline = ORANJE
- Response time > 200% van baseline = ROOD
- HTTP-status gewijzigd t.o.v. baseline = ROOD (altijd, ongeacht reden)
- Endpoint niet bereikbaar (TIMEOUT) = ROOD

## Stap 3: Auth flow check

Controleer dat niet-geverifieerde requests correct worden doorgestuurd:

```bash
# Moet HTTP 302 geven met Location: accounts.google.com of de OW auth-pagina
curl -sI --max-time 10 "https://teamindeling.ckvoranjewit.app/teamindeling" 2>/dev/null | grep -E "HTTP/|Location:" | head -5
```

Verwacht: HTTP/1.1 302 of HTTP/2 302 + Location-header die wijst naar een auth-provider.
Bij HTTP 200 op een beschermde route = ROOD (auth werkt niet).
Bij HTTP 500 = ROOD.

## Stap 4: Database latency check

Haal `db_latency_ms` op uit de health-endpoint JSON-response:

```bash
curl -s --max-time 10 "https://teamindeling.ckvoranjewit.app/api/health" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('db_latency_ms', 'NIET_AANWEZIG'))" 2>/dev/null
```

Als het veld `NIET_AANWEZIG` is: sla deze check over en noteer "db_latency_ms niet beschikbaar in /api/health — TODO: uitbreiden".

Als het veld aanwezig is: vergelijk met baseline met dezelfde drempelwaarden als response times.

## Stap 5: Pagina-inhoud spot-check

```bash
# Check dat de hoofdpagina geladen is
curl -sL --max-time 10 "https://ckvoranjewit.app" 2>/dev/null | grep -c "Oranje Wit" || echo "0"
```

Als "Oranje Wit" 0x gevonden: ORANJE (kan ook caching zijn — geen ROOD).

## Stap 6: Rapporteer

Presenteer altijd dit formaat:

```
## Canary Check — [vorige-SHA] → [huidige-SHA]
Datum: [timestamp]

### Endpoint Response Times
| Endpoint | Baseline | Nu | Delta | Status |
|----------|----------|-----|-------|--------|
| teamindeling /health | 280ms | 310ms | +11% | GROEN |
| ckvoranjewit /health | 450ms | 890ms | +98% | ORANJE |

### Auth Flow
Redirect chain: INTACT / GEBROKEN
Details: [HTTP-status + Location-header]

### Database Latency
| App | Baseline | Nu | Delta | Status |
|-----|----------|----|-------|--------|
| team-indeling | 45ms | 48ms | +7% | GROEN |
[of: "db_latency_ms niet beschikbaar — TODO"]

### Pagina-inhoud
ckvoranjewit.app: "Oranje Wit" X× gevonden — GROEN/ORANJE

### Eindbeslissing
GROEN / ORANJE / ROOD

[Bij ROOD: spawn `deployment` agent voor rollback-analyse]
[Bij ORANJE: vermeld in rapportage aan PO, geen blokkade]
```

## Gerelateerde skills

- `/benchmark` — sla performance baselines op (altijd eerst uitvoeren vóór canary)
- `/health-check` — momentopname gezondheidscheck (infrastructuur-niveau)
- `/deploy-checklist` — volledige deploy-procedure (roept canary aan als Stap 9b)
