---
name: health-check
description: Controleert de gezondheid van alle services, database, DNS en SSL. Geeft een stoplicht-overzicht (groen/oranje/rood) per component.
user-invocable: true
allowed-tools: Read, Bash, Glob
argument-hint: "[component: alle | apps | database | dns | railway]"
---

# Health Check — Service gezondheid controleren

Controleert alle componenten van de c.k.v. Oranje Wit infrastructuur en rapporteert met een stoplicht per component.

## Stappen

Voer alle checks uit en rapporteer het resultaat als stoplicht-overzicht.

### 1. Railway services status

Gebruik de Railway MCP tools:

```
railway_services
  projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
```

Check per service:
- Laatste deployment status (SUCCESS / FAILED / BUILDING)
- Wanneer laatst gedeployd

### 2. App endpoints bereikbaarheid

Test elke productie-URL:

```bash
curl -so /dev/null -w "%{http_code} %{time_total}s" https://teamindeling.ckvoranjewit.app
curl -so /dev/null -w "%{http_code} %{time_total}s" https://monitor.ckvoranjewit.app
curl -so /dev/null -w "%{http_code} %{time_total}s" https://evaluaties.ckvoranjewit.app
curl -so /dev/null -w "%{http_code} %{time_total}s" https://scout.ckvoranjewit.app
```

Beoordeling:
- HTTP 200 + < 3s = GROEN
- HTTP 200 + > 3s = ORANJE (traag)
- HTTP != 200 of timeout = ROOD

### 3. Database status

Gebruik de Database MCP tool:

```
ow_status
```

Check:
- Database bereikbaar (ja/nee)
- Aantal tabellen en rijen
- Laatste sync-tijdstempel (indien beschikbaar)

### 4. DNS en SSL

Check DNS-records via Google DNS API:

```bash
curl -s "https://dns.google/resolve?name=teamindeling.ckvoranjewit.app&type=CNAME"
curl -s "https://dns.google/resolve?name=monitor.ckvoranjewit.app&type=CNAME"
curl -s "https://dns.google/resolve?name=evaluaties.ckvoranjewit.app&type=CNAME"
curl -s "https://dns.google/resolve?name=scout.ckvoranjewit.app&type=CNAME"
```

Check SSL-certificaten:

```bash
curl -sI https://teamindeling.ckvoranjewit.app 2>&1 | head -5
```

Beoordeling:
- CNAME resolves + SSL valid = GROEN
- CNAME resolves + SSL issues = ORANJE
- CNAME missing = ROOD

### 5. Laatste CI run

```bash
gh run list --limit 3
```

Beoordeling:
- Laatste run SUCCESS = GROEN
- Laatste run in_progress = ORANJE
- Laatste run FAILED = ROOD

### 6. Railway custom domains

```
railway_custom_domain_status
  projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
  environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
```

## Output formaat

Rapporteer als tabel:

```
## Health Check — [datum + tijd]

| Component          | Status | Details                          |
|---|---|---|
| Team-Indeling      | GROEN  | HTTP 200, 0.8s                   |
| Monitor            | GROEN  | HTTP 200, 1.2s                   |
| Evaluatie          | GROEN  | HTTP 200, 0.9s                   |
| Scouting           | ROOD   | HTTP 404 (niet gedeployd)        |
| Database           | GROEN  | 41 tabellen, bereikbaar          |
| DNS (TI)           | GROEN  | CNAME ok, SSL valid              |
| DNS (Monitor)      | GROEN  | CNAME ok, SSL valid              |
| DNS (Evaluatie)    | GROEN  | CNAME ok, SSL valid              |
| DNS (Scouting)     | ORANJE | CNAME niet geconfigureerd        |
| CI (laatste run)   | GROEN  | #142 SUCCESS (2 min geleden)     |
| Railway deploys    | GROEN  | Alle services SUCCESS            |

Totaal: 8/11 GROEN, 2/11 ORANJE, 1/11 ROOD
```

## Bij rode items

- **App niet bereikbaar** → check Railway deployment logs, service status
- **Database niet bereikbaar** → check Railway Postgres service, connection string
- **DNS niet geconfigureerd** → Cloudflare CNAME record aanmaken
- **CI faalt** → `gh run view <id> --log-failed` voor details
- **SSL issues** → wacht 1 uur na DNS-wijziging, check CAA records

## Gerelateerde skills

- `/ci-status` — gedetailleerde CI informatie
- `shared/deployment` — deployment procedures
- `monitor/railway` — Railway MCP tools
