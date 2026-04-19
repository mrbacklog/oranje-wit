---
name: railway
description: Beheer Railway deployments, custom domains en IONOS DNS. Services, env vars, deployments, custom domains, SSL-certificaten en DNS-records.
context: fork
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[actie: status, deploy, logs, variables, domains, dns]"
---

# Railway — Smart Gateway v2

Beheer de Railway-omgeving van Oranje Wit via 6 MCP tools. De Smart Gateway vervangt de oude 14-tool server met service-aliassen en slimme defaults.

## Architectuur

```
Claude Code ←→ apps/mcp/railway/server.js ←→ Railway GraphQL API v2
                     ↓                         https://backboard.railway.com/graphql/v2
                config.js
                (aliases, IDs)
```

- **MCP server**: `apps/mcp/railway/server.js` — 6 tools
- **Config**: `apps/mcp/railway/config.js` — service-aliassen, project/env IDs
- **Auth**: token in `~/.claude/mcp.json` (buiten repo)

## Service-aliassen

Alle tools accepteren een **alias** in plaats van een UUID:

| Alias | Service | ID | URL |
|---|---|---|---|
| `web` | ckvoranjewit.app | `46a4f38c` | https://www.ckvoranjewit.app |
| `ti-studio` | ti-studio | `4feb4549-cafb-433c-89fb-505aeb05ae44` | https://teamindeling.ckvoranjewit.app |
| `database` | Postgres | `e7486b49` | `postgres.railway.internal:5432` |

Project ID: `aa87602d-316d-4d3e-8860-f75d352fae27`
Environment (production): `1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1`

## MCP Tools (6)

### 1. `railway_status`

Overzicht van alle services met alias, naam en laatste deployment.

```
→ railway_status
# Geen parameters
```

### 2. `railway_ask`

Stel een vraag aan de Railway AI-agent. Voor debugging, metrics, multi-step taken.

| Parameter | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `question` | string | ja | Vraag in natuurlijke taal |
| `service` | `web` / `ti-studio` / `database` | nee | Scope naar specifieke service |

```
→ railway_ask
    question: "Wat is het geheugengebruik van de laatste 24 uur?"
    service: "web"
```

### 3. `railway_deploy`

Deploy een service. Wacht standaard op resultaat (SUCCESS/FAILED, max 5 min).

| Parameter | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `service` | `web` / `ti-studio` | ja | Service alias |
| `wait` | boolean | nee | Default `true`. `false` = fire-and-forget |

```
→ railway_deploy
    service: "web"
```

### 4. `railway_logs`

Logs van een service. Pakt automatisch de laatste deployment.

| Parameter | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `service` | `web` / `ti-studio` | ja | Service alias |
| `type` | `build` / `runtime` | nee | Default `runtime` |
| `lines` | number | nee | Default `100` |

```
→ railway_logs
    service: "ti-studio"
    type: "build"
```

### 5. `railway_variables`

Environment variables ophalen of instellen (upsert).

| Parameter | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `service` | `web` / `ti-studio` / `database` | ja | Service alias |
| `set` | `Record<string, string>` | nee | Key-value pairs om te upserten |

```
→ railway_variables
    service: "web"

→ railway_variables
    service: "ti-studio"
    set: {"NEXT_PUBLIC_VERSION": "2.1.0"}
```

### 6. `railway_domains`

Custom domains beheren — status opvragen of nieuw domain koppelen.

| Parameter | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `service` | `web` / `ti-studio` | nee | Filter op service (bij status) |
| `action` | `status` / `create` | nee | Default `status` |
| `domain` | string | bij create | Domeinnaam om te koppelen |

```
→ railway_domains

→ railway_domains
    service: "web"
    action: "create"
    domain: "nieuw.ckvoranjewit.app"
```

## Agent-routering

| Vraag | Tool |
|---|---|
| "Draait alles?" | `railway_status` |
| "Deploy web naar productie" | `railway_deploy` service=web |
| "Waarom faalt de build?" | `railway_logs` type=build |
| "Wat is het geheugengebruik?" | `railway_ask` |
| "Toon env vars van ti-studio" | `railway_variables` service=ti-studio |
| "SSL status van domeinen?" | `railway_domains` |
| "Voeg custom domain toe" | `railway_domains` action=create |

## Custom Domains

### WAARSCHUWING: verwijder custom domains NOOIT

Railway genereert bij elke `customDomainCreate` een **unieke CNAME target** (bijv. `abc123.up.railway.app`).
Verwijderen + opnieuw aanmaken = nieuwe target = DNS bijwerken.

**Let's Encrypt rate limit**: max 5 certificaten per domein per week. Overschrijd je dit, dan ben je 7 dagen geblokkeerd.

### Huidige custom domains

| Domein | Service |
|---|---|
| `www.ckvoranjewit.app` | web |
| `teamindeling.ckvoranjewit.app` | ti-studio |

### Workflow: nieuw custom domain

1. `railway_domains` action=create, service=..., domain=...
2. Noteer de `cnameTarget` uit de response
3. Werk het Cloudflare CNAME record bij (DNS only, grijs wolkje, `proxied: false`)
4. Wacht minimaal 1 uur op SSL-certificaat
5. Controleer met `railway_domains`

## DNS: Cloudflare + IONOS

- **Registrar**: IONOS (domeinregistratie)
- **DNS provider**: Cloudflare (gratis tier, account: info@mrbacklog.nl)
- **Nameservers**: `randy.ns.cloudflare.com`, `suzanne.ns.cloudflare.com`
- **Zone ID**: `274388d92ae20e1a2276eb8ead67669c`
- **CNAME records** voor Railway: `proxied: false` (DNS only) — nodig voor SSL-validatie
- **Cloudflare API credentials**: zie `memory/cloudflare.md`
- **IONOS DNS**: niet meer actief (nameservers op Cloudflare), API credentials in `memory/ionos.md`

DNS-propagatie checken:
```bash
curl -s "https://dns.google/resolve?name=www.ckvoranjewit.app&type=CNAME"
```

## Authenticatie

- **Token type**: Account Token
- **Configuratie**: `~/.claude/mcp.json` — tokens staan ALLEEN daar, nooit in code of skills
- **Account**: info@mrbacklog.nl
- **GitHub**: mrbacklog (gekoppeld aan Railway)
- **Token vernieuwen**: Railway dashboard → Account Tokens → update `~/.claude/mcp.json` + GitHub secret `RAILWAY_TOKEN`

## Bestanden

| Bestand | Functie |
|---|---|
| `apps/mcp/railway/server.js` | MCP server (6 tools) |
| `apps/mcp/railway/config.js` | Service-aliassen en IDs |
| `apps/mcp/railway/package.json` | Dependencies |
| `~/.claude/mcp.json` | Server registratie + token (buiten repo) |
| `apps/web/Dockerfile` | Docker build voor web |
| `apps/ti-studio/Dockerfile` | Docker build voor ti-studio |
| `.github/workflows/ci.yml` | CI pipeline incl. deploy job |
