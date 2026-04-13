---
name: benchmark
description: Sla performance baselines op per deploy SHA in docs/benchmarks/. Vergelijk trends over deploys heen. Gebruik vóór /canary om een baseline te registreren.
user-invocable: false
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[actie: save | trend | list]"
---

# Benchmark — Performance baseline tracking

## Wanneer gebruiken

Aanroepen door `deployment` of `devops` agent als onderdeel van post-deploy:
- Vóór `/canary`: sla huidige meting op als baseline
- Periodiek: bekijk trends via `trend`

## Actie-detectie

Argument `trend` = trendrapport. Argument `list` = overzicht. Alles anders (incl. geen argument) = `save`.

## Actie: save (default)

### Stap 1: Huidige SHA bepalen

```bash
git rev-parse --short HEAD
```

### Stap 2: Deploy-type bepalen

```bash
# Check laatste commit-message voor deploy-type
git log --oneline -1
```
- Begint met `patch:` of `fix:` → deploy_type: "patch"
- Begint met `release:` of geen prefix na merge → deploy_type: "release"

### Stap 3: Endpoints meten

```bash
for url in \
  "https://teamindeling.ckvoranjewit.app/api/health" \
  "https://ckvoranjewit.app/api/health"; do
  echo -n "$url: "
  curl -so /dev/null -w "%{http_code} %{time_total}\n" --max-time 10 "$url" 2>/dev/null || echo "error 0"
done
```

Meet 3x per endpoint, bereken mediaan (p50) en hoogste meting (p95-benadering).

Haal ook db_latency_ms op:
```bash
curl -s --max-time 10 "https://teamindeling.ckvoranjewit.app/api/health" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('db_latency_ms','N/A'))" 2>/dev/null
```

Haal CI-duur op:
```bash
gh run list --limit 1 --json databaseId,conclusion,createdAt,updatedAt 2>/dev/null | python3 -c "import sys,json; runs=json.load(sys.stdin); r=runs[0] if runs else {}; print((r.get('updatedAt','') or ''))" 2>/dev/null
```

### Stap 4: Opslaan

Maak `docs/benchmarks/` aan als het niet bestaat.

Sla op als `docs/benchmarks/YYYY-MM-DD-<SHA7>.json`:

```json
{
  "sha": "<SHA7>",
  "timestamp": "<ISO-timestamp>",
  "deploy_type": "release|patch",
  "endpoints": {
    "teamindeling_health": { "p50_ms": 310, "p95_ms": 580, "status": 200 },
    "ckvoranjewit_health": { "p50_ms": 890, "p95_ms": 1200, "status": 200 }
  },
  "db_latency": {
    "teamindeling": 48
  },
  "notes": ""
}
```

Update `docs/benchmarks/README.md` (maak aan als nodig):

```markdown
# Benchmark Trend

| Datum | SHA | Type | TI Health | OW Health | DB TI |
|-------|-----|------|-----------|-----------|-------|
| [datum] | [sha] | release | 310ms | 890ms | 48ms |
```

Rapporteer: "Baseline opgeslagen: `docs/benchmarks/[filename]`"

## Actie: trend

Lees de laatste 5 benchmark-bestanden, rapporteer trend:

```bash
ls -t docs/benchmarks/*.json 2>/dev/null | head -5
```

```
## Performance Trend — laatste 5 deploys

| Deploy | SHA | Type | TI Health | OW Health | DB TI |
|--------|-----|------|-----------|-----------|-------|
| [datum] | [sha] | release | 310ms | 890ms | 48ms |
...

Trending UP (verslechtering): [endpoint] (+X% over 5 deploys) ⚠
Trending DOWN (verbetering): [endpoint] (-X% over 5 deploys) ✓
Stabiel: [endpoint]
```

## Actie: list

```bash
ls -lt docs/benchmarks/*.json 2>/dev/null
```

Presenteer als tabel: datum, SHA, deploy-type.

## Gerelateerde skills

- `/canary` — vergelijkt huidig gedrag met vorige baseline
- `/health-check` — momentopname infrastructuur
- `/deploy-checklist` — volledige deploy-procedure
