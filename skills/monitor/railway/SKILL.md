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
Claude Code ←→ mcp-railway/server.js ←→ Railway GraphQL API v2
                                         https://backboard.railway.com/graphql/v2
                                         Authorization: Bearer <RAILWAY_TOKEN>
```

- **MCP server**: `mcp-railway/server.js` — 11 tools
- **Config**: `.mcp.json` — server registratie + token
- **API**: Railway GraphQL API v2

## Railway projecten

| Project | ID | Functie |
|---|---|---|
| oranje-wit | `00b52783-04c1-4c38-a232-7efb92c98207` | Verenigingsmonitor (Express API + frontend) |
| oranje-wit-db | `aa87602d-316d-4d3e-8860-f75d352fae27` | PostgreSQL database |

### Environments

| Project | Environment | ID |
|---|---|---|
| oranje-wit | production | `956e6e51-89f7-4939-b3f6-04b43e723632` |
| oranje-wit-db | production | `1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1` |

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
```

### 2. Nieuwe service deployen vanuit GitHub

```
→ railway_service_create
    projectId: "00b52783-04c1-4c38-a232-7efb92c98207"
    repo: "antjanlaban/oranje-wit"
    name: "verenigingsmonitor"

→ railway_variable_set
    projectId: "00b52783-..."
    environmentId: "956e6e51-..."
    serviceId: "<nieuw service ID>"
    variables: {"NODE_ENV": "production", "DATABASE_URL": "postgresql://..."}

→ railway_domain_create
    environmentId: "956e6e51-..."
    serviceId: "<service ID>"
```

### 3. Deployment status en logs

```
→ railway_deployments
    projectId: "00b52783-..."
    serviceId: "<service ID>"

→ railway_logs
    deploymentId: "<deployment ID>"
    type: "build"
```

### 4. Environment variables beheren

```
→ railway_variables_get
    projectId: "00b52783-..."
    environmentId: "956e6e51-..."
    serviceId: "<service ID>"

→ railway_variable_set
    ...
    variables: {"KEY": "value"}
```

## Authenticatie

- **Token type**: Account Token (NIET project token)
- **Aanmaken**: https://railway.com/account/tokens
- **Configuratie**: `.mcp.json` → `railway.env.RAILWAY_TOKEN`
- **Account**: info@mrbacklog.nl

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
| `mcp-railway/server.js` | MCP server (11 tools) |
| `mcp-railway/package.json` | Dependencies |
| `.mcp.json` | Server registratie + token |
