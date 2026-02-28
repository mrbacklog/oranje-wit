---
name: railway
description: Beheer Railway deployments via de GraphQL API. Services aanmaken, GitHub repo's koppelen, environment variables instellen, deployments triggeren en logs bekijken.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[actie: status, deploy, logs, variables]"
---

# Railway — Platform Management via MCP

Beheer de Railway-omgeving van Oranje Wit via de GraphQL API v2. De MCP server biedt 11 tools voor het volledige deployment-lifecycle.

## Architectuur

```
Claude Code ←→ apps/mcp/railway/server.js ←→ Railway GraphQL API v2
                                               https://backboard.railway.com/graphql/v2
                                               Authorization: Bearer <RAILWAY_TOKEN>
```

- **MCP server**: `apps/mcp/railway/server.js` — 11 tools
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

### GitHub repo

- **Repo**: `mrbacklog/oranje-wit` (publiek)
- **Branch**: `master`
- **Auto-deploy**: ja, bij elke push naar master

### Deployment

Beide apps gebruiken **Dockerfiles** (niet Nixpacks):
- `apps/team-indeling/Dockerfile` — Node 22, pnpm workspace, Prisma
- `apps/monitor/Dockerfile` — Node 22, pnpm workspace, Prisma

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
| `railway_deploy` | Deployment triggeren | `projectId`, `environmentId`, `serviceId` |
| `railway_domain_create` | Railway-domein genereren | `environmentId`, `serviceId` |

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

### 4. Handmatig deploy triggeren

```
→ railway_deploy
    environmentId: "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1"
    serviceId: "49ed7b30-..."  # team-indeling
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
| `apps/mcp/railway/server.js` | MCP server (11 tools) |
| `apps/mcp/railway/package.json` | Dependencies |
| `.mcp.json` | Server registratie + token (gitignored) |
| `apps/team-indeling/Dockerfile` | Docker build voor TI |
| `apps/monitor/Dockerfile` | Docker build voor monitor |
| `apps/team-indeling/railway.json` | Railway config (legacy, Dockerfile wordt nu gebruikt) |
| `apps/monitor/railway.json` | Railway config (legacy, Dockerfile wordt nu gebruikt) |
