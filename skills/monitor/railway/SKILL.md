---
name: railway
description: Beheer Railway deployments, custom domains en IONOS DNS. Services, env vars, deployments, custom domains, SSL-certificaten en DNS-records.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[actie: status, deploy, logs, variables, domains, dns]"
---

# Railway — Platform Management via MCP

Beheer de Railway-omgeving van Oranje Wit via de GraphQL API v2. De MCP server biedt 14 tools voor deployment-lifecycle, custom domains en DNS.

## Architectuur

```
Claude Code ←→ apps/mcp/railway/server.js ←→ Railway GraphQL API v2
                                               https://backboard.railway.com/graphql/v2
                                               Authorization: Bearer <RAILWAY_TOKEN>
```

- **MCP server**: `apps/mcp/railway/server.js` — 14 tools
- **Config**: `.mcp.json` — server registratie + token (gitignored)
- **API**: Railway GraphQL API v2

## Railway project

Alles draait in één project:

| Project | ID | Functie |
|---|---|---|
| oranje-wit-db | `aa87602d-316d-4d3e-8860-f75d352fae27` | Alles: PostgreSQL + Monitor + Team-Indeling |

### Environment

| Environment | ID |
|---|---|
| production | `1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1` |

### Services

| Service | ID | URL |
|---|---|---|
| Postgres | `e7486b49-dba3-4e0a-8709-a501cea860ae` | `postgres.railway.internal:5432` (intern) |
| team-indeling | `49ed7b30-a243-4f30-87fa-ae56935fbbbc` | https://team-indeling-production.up.railway.app |
| monitor | `a7efb126-8ad1-460d-b787-2d03207c3f3c` | https://monitor-production-b2b1.up.railway.app |
| evaluatie | (nog aan te maken) | — |

### GitHub repo

- **Repo**: `mrbacklog/oranje-wit` (publiek)
- **Branch**: `master`
- **Auto-deploy**: **UITGESCHAKELD** — GitHub Actions is de enige deployer

### Deployment

Alle drie apps gebruiken **Dockerfiles** (niet Nixpacks):
- `apps/team-indeling/Dockerfile` — Node 22, pnpm workspace, Prisma
- `apps/monitor/Dockerfile` — Node 22, pnpm workspace, Prisma
- `apps/evaluatie/Dockerfile` — Node 22, pnpm workspace, Prisma

**Deploy-flow**: GitHub push → CI (quality + build) → Railway API (`serviceInstanceDeploy`) → alleen gewijzigde apps

## MCP Tools

### Informatie & Status

| Tool | Beschrijving | Parameters |
|---|---|---|
| `railway_status` | Auth check + projectoverzicht | — |
| `railway_services` | Services + laatste deployment | `projectId` |
| `railway_deployment_status` | Status en URL van een deployment | `deploymentId` |
| `railway_deployments` | Lijst recente deployments | `projectId`, `serviceId` |
| `railway_logs` | Build- of runtime-logs | `deploymentId`, `type` (build/deploy) |

### Acties

| Tool | Beschrijving | Parameters |
|---|---|---|
| `railway_service_create` | Service aanmaken + GitHub koppelen | `projectId`, `repo`, `name`, `branch` |
| `railway_service_connect` | Bestaande service aan GitHub koppelen | `serviceId`, `repo`, `branch` |
| `railway_variables_get` | Environment variables ophalen | `projectId`, `environmentId`, `serviceId` |
| `railway_variable_set` | Variables instellen (upsert) | `projectId`, `environmentId`, `serviceId`, `variables` |
| `railway_deploy` | Deployment triggeren (fire-and-forget) | `projectId`, `environmentId`, `serviceId` |
| `railway_deploy_pipeline` | Deploy + poll tot SUCCESS/FAILED (max 5 min) | `projectId`, `environmentId`, `serviceId` |
| `railway_domain_create` | Railway-domein genereren | `environmentId`, `serviceId` |

### Custom Domains

| Tool | Beschrijving | Parameters |
|---|---|---|
| `railway_custom_domain_create` | Custom domein koppelen aan service | `projectId`, `environmentId`, `serviceId`, `domain` |
| `railway_custom_domain_status` | Status alle custom domeinen + SSL | `projectId` |

## Custom Domains

### WAARSCHUWING: verwijder custom domains NOOIT

Railway genereert bij elke `customDomainCreate` een **unieke CNAME target** (bijv. `abc123.up.railway.app`).
Verwijderen + opnieuw aanmaken = nieuwe target = IONOS DNS bijwerken.

**Let's Encrypt rate limit**: max 5 certificaten per domein per week. Overschrijd je dit, dan ben je 7 dagen geblokkerd.

### Huidige custom domains

| Domein | Service | IONOS Record ID |
|---|---|---|
| `monitor.ckvoranjewit.app` | monitor | `e3aae275-d73e-5ad7-6fa6-b81101349fc1` |
| `teamindeling.ckvoranjewit.app` | team-indeling | `43e88ed9-fbd1-80e2-0152-35418c3bf97e` |

> **Tip:** Gebruik `railway_custom_domain_status` om de actuele CNAME targets en certificaatstatus op te vragen.

### Workflow: nieuw custom domain

1. Maak custom domain aan via `railway_custom_domain_create`
2. Noteer de `cnameTarget` uit de response
3. Werk het IONOS CNAME record bij (zie IONOS DNS sectie)
4. Wacht minimaal 1 uur op SSL-certificaat
5. Controleer met `railway_custom_domain_status`

### SSL Troubleshooting

Als een domein vasthangt op `VALIDATING_OWNERSHIP`:

1. **Check DNS propagatie**: `curl -s "https://dns.google/resolve?name=<domain>&type=CNAME"`
2. **Vergelijk CNAME**: moet exact matchen met `requiredValue` uit `railway_custom_domain_status`
3. **Check CAA records**: `curl -s "https://dns.google/resolve?name=<domain>&type=CAA"` — mag Let's Encrypt niet blokkeren
4. **Check HTTP bereikbaarheid**: `curl -sk http://<domain>` — moet Railway bereiken
5. **Wacht**: minimaal 1 uur na DNS-wijziging, Railway docs zeggen tot 72 uur
6. **Check service**: moet actief draaien (deployment status = SUCCESS)
7. **NOOIT** verwijderen en opnieuw aanmaken (rate limits!)

## DNS: Cloudflare (primair) + IONOS (registrar)

### Architectuur

```
Registrar: IONOS → Nameservers: Cloudflare → DNS records → Railway
```

- **Registrar**: IONOS (domeinregistratie, nameserver-instelling)
- **DNS provider**: Cloudflare (gratis tier, account: info@mrbacklog.nl)
- **Cloudflare nameservers**: `randy.ns.cloudflare.com`, `suzanne.ns.cloudflare.com`
- **Reden**: IONOS DNS veroorzaakte VALIDATING_OWNERSHIP bij Railway custom domains

### Cloudflare API

- **API prefix**: `https://api.cloudflare.com/client/v4`
- **Zone ID**: `274388d92ae20e1a2276eb8ead67669c`
- **Auth**: `Authorization: Bearer <token>` — credentials in `memory/cloudflare.md`
- CNAME records voor Railway moeten `"proxied": false` zijn (DNS only, grijs wolkje)
- Dit is nodig zodat Railway direct het verkeer ontvangt voor SSL-validatie
- Beheer via: https://dash.cloudflare.com of API

```bash
# Alle DNS records ophalen
curl -s "https://api.cloudflare.com/client/v4/zones/274388d92ae20e1a2276eb8ead67669c/dns_records" \
  -H "Authorization: Bearer <token>"

# CNAME record bijwerken
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/274388d92ae20e1a2276eb8ead67669c/dns_records/<recordId>" \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"content":"new-target.up.railway.app"}'
```

### IONOS DNS API (backup/legacy)

- **Endpoint**: `https://api.hosting.ionos.com/dns/v1`
- **Auth**: `X-API-Key` header — credentials in `memory/ionos.md`
- **Zone ID**: `db06574b-d460-11f0-bd5c-0a5864440e35`
- **Let op**: IONOS DNS is niet meer actief (nameservers staan op Cloudflare)
- IONOS API kan NIET nameservers wijzigen (alleen records in zone)

### DNS-propagatie verifiëren

```bash
# Nameservers checken
curl -s "https://dns.google/resolve?name=ckvoranjewit.app&type=NS"

# CNAME checken
curl -s "https://dns.google/resolve?name=monitor.ckvoranjewit.app&type=CNAME"
```

## Veelgebruikte workflows

### 1. Status checken

```
→ railway_status
→ railway_services
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
```

### 2. Deployment status en logs

```
→ railway_deployments
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
    serviceId: "49ed7b30-a243-4f30-87fa-ae56935fbbbc"  # team-indeling

→ railway_logs
    deploymentId: "<deployment ID>"
    type: "build"
```

### 3. Environment variables beheren

```
→ railway_variables_get
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
    environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
    serviceId: "49ed7b30-..."  # of "a7efb126-..."

→ railway_variable_set
    ...
    variables: {"KEY": "value"}
```

### 4. Handmatig deploy triggeren (fire-and-forget)

```
→ railway_deploy
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
    environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
    serviceId: "49ed7b30-..."  # team-indeling
```

### 5. Deploy + wacht op resultaat (aanbevolen)

```
→ railway_deploy_pipeline
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
    environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
    serviceId: "49ed7b30-..."  # team-indeling (of "a7efb126-..." voor monitor)

# Returnt: { ok: true/false, status, deploymentId, staticUrl, elapsed }
# Bij FAILED: bekijk logs via railway_logs met het deploymentId
```

## Authenticatie

- **Token type**: Account Token (NIET project token)
- **Aanmaken**: https://railway.com/account/tokens
- **Configuratie**: `.mcp.json` → `railway.env.RAILWAY_TOKEN`
- **Account**: info@mrbacklog.nl
- **GitHub account**: mrbacklog (gekoppeld aan Railway)

### Token vernieuwen

1. Ga naar https://railway.com/account/tokens
2. Maak nieuw Account Token aan
3. Update `.mcp.json` met het nieuwe token
4. Herstart Claude Code om de MCP server te herladen

## Beperkingen API tokens

- `me` query is NIET beschikbaar (Railway beperking)
- Gebruik `railway_status` (via `projects` query) als auth check
- Account tokens hebben toegang tot alle projecten van het account

## Bestanden

| Bestand | Functie |
|---|---|
| `apps/mcp/railway/server.js` | MCP server (13 tools) |
| `apps/mcp/railway/package.json` | Dependencies |
| `.mcp.json` | Server registratie + token (gitignored) |
| `apps/team-indeling/Dockerfile` | Docker build voor TI |
| `apps/monitor/Dockerfile` | Docker build voor monitor |
| `apps/team-indeling/railway.json` | Railway config (legacy, Dockerfile wordt nu gebruikt) |
| `apps/monitor/railway.json` | Railway config (legacy, Dockerfile wordt nu gebruikt) |
