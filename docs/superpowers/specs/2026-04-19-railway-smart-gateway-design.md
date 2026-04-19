# Railway Smart Gateway — Design Spec

**Datum**: 2026-04-19
**Status**: In implementatie
**Doel**: Eenduidige, maximale Railway-integratie voor AI-agents

---

## Probleem

De huidige Railway-integratie heeft drie problemen:

1. **Te veel losse tool-calls** — een deploy-diagnose kost 4+ calls (services → deployments → logs → status)
2. **Ontbrekende capabilities** — geen metrics, geen debugging, geen rollbacks via tooling
3. **Agents kiezen suboptimaal** — 14 tools met overlappende functionaliteit, agents weten niet welke wanneer

## Oplossing: Smart Gateway

Herbouw de MCP server als dunne orchestratielaag met 6 tools:

- `railway_ask` als powerhouse (Railway CLI Agent) voor complexe/open vragen
- 5 directe GraphQL tools voor atomaire acties met OW-defaults ingebakken

### Architectuur

```
Claude Code agents (deployment, devops, etc.)
        │
        ▼
Railway MCP Server (apps/mcp/railway/server.js)
├── railway_ask ──────→ Railway CLI Agent (railway agent -p "..." --json)
├── railway_status ───→ Railway GraphQL API v2
├── railway_deploy ───→ Railway GraphQL API v2 + polling
├── railway_logs ─────→ Railway GraphQL API v2
├── railway_variables → Railway GraphQL API v2
└── railway_domains ──→ Railway GraphQL API v2

OW-defaults ingebakken:
  PROJECT_ID  = aa87602d-316d-4d3e-8860-f75d352fae27
  ENV_ID      = 1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1
  SERVICES    = { web: 46a4f38c..., ti-studio: <id>, database: e7486b49... }
```

## Tool-definities

### 1. `railway_ask` — AI-gestuurde powerhouse

```
Input:  {
  question: string,              // Vrije tekst vraag
  service?: "web" | "ti-studio" | "database"  // Optionele scope
}
Output: { answer: string, actions_taken?: string[] }
```

**Implementatie**: Draait `railway agent -p "<question>" --service <service> --json` via child_process.

**Use-cases**:
- Debugging: "waarom faalt de laatste deploy van web?"
- Metrics: "toon CPU en memory van ti-studio"
- Multi-step: "voeg een Redis service toe aan het project"
- Analyse: "vergelijk de laatste 5 deploys qua build-tijd"

**Timeout**: 120 seconden (Railway agent kan complexe taken uitvoeren).

### 2. `railway_status` — snelle health check

```
Input:  {} (geen parameters — OW-defaults)
Output: {
  services: [{
    name: string,
    alias: "web" | "ti-studio" | "database",
    status: string,
    url?: string,
    lastDeploy: { id, status, createdAt }
  }]
}
```

**Verschil met huidig**: Geen `projectId` parameter nodig, service aliases automatisch meegegeven.

### 3. `railway_deploy` — deploy + polling

```
Input:  {
  service: "web" | "ti-studio",  // Alias, niet UUID
  wait?: boolean                  // Default: true (wacht op resultaat)
}
Output: {
  ok: boolean,
  status: "SUCCESS" | "FAILED" | "CRASHED" | "TIMEOUT",
  deploymentId: string,
  elapsed?: string,
  url?: string,
  hint?: string                   // Bij failure: "gebruik railway_logs of railway_ask"
}
```

**Merged**: Huidige `railway_deploy` (fire-and-forget) + `railway_deploy_pipeline` (polling). Parameter `wait` bepaalt het gedrag.

### 4. `railway_logs` — directe logs

```
Input:  {
  service: "web" | "ti-studio",
  type?: "build" | "runtime",    // Default: "runtime"
  lines?: number                  // Default: 100
}
Output: { logs: string, deploymentId: string }
```

**Verschil met huidig**: Geen `deploymentId` nodig — pakt automatisch de laatste deployment. Service via alias.

### 5. `railway_variables` — get en set in één tool

```
Input:  {
  service: "web" | "ti-studio" | "database",
  set?: Record<string, string>   // Optioneel: upsert
}
Output: { variables: Record<string, string> }
```

**Merged**: Huidige `railway_variables_get` + `railway_variable_set`. Zonder `set` = ophalen, met `set` = upsert + resultaat teruggeven.

### 6. `railway_domains` — custom domain beheer

```
Input:  {
  service?: "web" | "ti-studio",       // Optioneel: filter op service
  action?: "status" | "create",        // Default: "status"
  domain?: string                      // Verplicht bij action: "create"
}
Output: {
  domains: [{
    domain: string,
    service: string,
    verified: boolean,
    ssl: string,
    cname: string
  }]
}
```

**Merged**: Huidige `railway_domain_create` + `railway_custom_domain_create` + `railway_custom_domain_status`.

## Service-alias mapping

Eén centrale map in de MCP server:

```javascript
const SERVICES = {
  web:         { id: "46a4f38c-eff1-4140-ad07-f12be057ef30", name: "ckvoranjewit.app" },
  "ti-studio": { id: "4feb4549-cafb-433c-89fb-505aeb05ae44",  name: "ti-studio" },
  database:    { id: "e7486b49-dba3-4e0a-8709-a501cea860ae", name: "Postgres" },
};
const PROJECT_ID = "aa87602d-316d-4d3e-8860-f75d352fae27";
const ENV_ID     = "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1";
```

Agents zeggen `"web"`, de MCP vertaalt naar UUIDs. Nieuwe service = één regel toevoegen.

## Foutafhandeling

| Situatie | Gedrag |
|---|---|
| Railway CLI niet beschikbaar | `railway_ask` geeft foutmelding, andere tools werken (GraphQL) |
| Railway API down | `{ error: "Railway API onbereikbaar", hint: "check status.railway.com" }` |
| Onbekende service alias | `{ error: "Onbekende service 'x'", beschikbaar: ["web", "ti-studio", "database"] }` |
| Deploy faalt | Status + hint om `railway_logs` of `railway_ask` te gebruiken |
| `railway_ask` timeout | Na 120s: `{ error: "Railway agent timeout", hint: "probeer een specifiekere vraag" }` |

## Agent-routering

Eenduidige beslisboom voor agents:

| Vraagtype | Tool | Voorbeeld |
|---|---|---|
| Wat is de status? | `railway_status` | Health check, deploy overzicht |
| Deploy X | `railway_deploy` | Na CI, na merge |
| Toon logs | `railway_logs` | Build fouten, runtime errors |
| Haal/zet variabelen | `railway_variables` | Env vars checken of wijzigen |
| Domein beheer | `railway_domains` | SSL status, nieuw domein |
| **Al het andere** | `railway_ask` | Debugging, metrics, waarom-vragen, multi-step |

---

## CI/CD Audit — Bevindingen & Verbeteringen

### Huidige staat

Drie workflows:

| Workflow | Trigger | Doel | Status |
|---|---|---|---|
| `ci.yml` | Push/PR naar main | Fast-gate + build + E2E + deploy | **Actief, primair** |
| `patch.yml` | Push naar main (patch:/fix: prefix) | Fast-gate + post-deploy verify | **Actief** |
| `release.yml` | Push naar release/** branch | Fast-gate + build + smoke + full E2E + squash-merge | **Actief** |

### Probleem 1: Dubbele fast-gate bij patches

Bij een `patch:` commit draaien **twee workflows tegelijk**:

1. `ci.yml` → fast-gate (skippt E2E vanwege prefix) → build → deploy
2. `patch.yml` → fast-gate (duplicate) → verify

De fast-gate in `patch.yml` is exact dezelfde als in `ci.yml`. Verspilling van CI-minuten.

**Verbetering**: `patch.yml` fast-gate verwijderen — `ci.yml` doet dit al. `patch.yml` hoeft alleen de post-deploy verificatie te doen, getriggerd na succesvolle deploy in `ci.yml`.

### Probleem 2: TI-Studio ontbreekt in typecheck/lint (patch.yml)

`patch.yml` doet typecheck en lint alleen voor `@oranje-wit/web`, niet voor `@oranje-wit/ti-studio`. `ci.yml` doet wél beide. Inconsistentie.

**Verbetering**: Als patch.yml fast-gate blijft bestaan, voeg ti-studio typecheck/lint toe. Beter: verwijder de dubbele fast-gate (zie probleem 1).

### Probleem 3: Deploy wacht niet op resultaat

`ci.yml` deploy-job triggert Railway deploys (fire-and-forget) maar verifieert niet of de deployment slaagt. Er is geen health check na deploy in `ci.yml`.

`patch.yml` heeft wél een `verify` job met `pnpm verify:deploy`, maar die wacht slechts 30 seconden — een Railway build duurt typisch 2-5 minuten.

**Verbetering**: Post-deploy verificatie toevoegen aan `ci.yml` deploy-job, met adequate wachttijd. Of: `patch.yml` verify-job gebruiken voor alle deploys (niet alleen patches).

### Probleem 4: Geen post-deploy health check in ci.yml

Na deploy in `ci.yml` wordt er niet gecontroleerd of de app daadwerkelijk draait. Als Railway een build-fout heeft, merkt niemand het totdat een gebruiker klaagt.

**Verbetering**: Na deploy-trigger wachten op Railway deployment status (via GraphQL polling of `railway_ask`), gevolgd door health check op `https://www.ckvoranjewit.app/api/health`.

### Probleem 5: release.yml bouwt ti-studio niet

`release.yml` build-job draait alleen `pnpm build` (web), niet `pnpm --filter @oranje-wit/ti-studio build`. Als een release ti-studio raakt, wordt dat niet gevalideerd.

**Verbetering**: TI-Studio build toevoegen aan release.yml.

---

## Legacy — Opruimen

### 1. Deployment skill verouderd

[.claude/skills/deployment/SKILL.md](.claude/skills/deployment/SKILL.md) bevat:
- **Verouderde service IDs**: team-indeling (`49ed7b30`), monitor (`a7efb126`), evaluatie (`c7a578c6`) — dit zijn pre-consolidatie services
- **Verouderde URLs**: `ckvoranjewit.app/teamindeling` (bestaat niet meer, is `teamindeling.ckvoranjewit.app`)
- **Verouderde commando's**: `pnpm test:e2e:ti`, `pnpm test:e2e:monitor` — deze bestaan niet (meer)
- **Verouderde app-tabel**: 3 losse apps i.p.v. 2 (web + ti-studio)
- **Ontbrekend**: TI-Studio deploy (service ID, Dockerfile)
- **Verouderde tool-referenties**: Verwijst naar 14 tools die worden teruggebracht naar 6

**Actie**: Volledig herschrijven na Smart Gateway implementatie.

### 2. Railway skill — token in plaintext

[.claude/skills/railway/SKILL.md](.claude/skills/railway/SKILL.md) regel 253 bevat de Railway API token in plaintext in een curl-voorbeeld:
```
Authorization: Bearer 758497fe-16c0-4d3b-9fc9-11207eab0163
```

Ook GitHub secrets staan in plaintext (regel 59-63).

**Actie**: Verwijder hardcoded tokens uit skill-documentatie. Verwijs naar `~/.claude/mcp.json` of GitHub Secrets UI.

### 3. Legacy services in Railway skill

Railway skill vermeldt legacy services:
- `team-indeling` (`49ed7b30`) — pre-consolidatie, niet meer in gebruik
- `evaluatie` (`c7a578c6`) — pre-consolidatie, niet meer in gebruik

En legacy custom domains:
- `teamindeling.ckvoranjewit.app` → legacy service
- `evaluatie.ckvoranjewit.app` → legacy service

**Actie**: Markeer als legacy of verwijder. Voeg ti-studio service toe (ontbreekt).

### 4. verify-deploy.ts verouderd

[scripts/verify-deploy.ts](scripts/verify-deploy.ts) controleert 3 apps (Team-Indeling, Monitor, Evaluatie) maar:
- Alle 3 gebruiken dezelfde health endpoint (`www.ckvoranjewit.app/api/health`) — het is effectief dezelfde check 3x
- Team-Indeling URL is `www.ckvoranjewit.app/teamindeling` — verouderd (is nu `teamindeling.ckvoranjewit.app`)
- Mist ti-studio health check (`teamindeling.ckvoranjewit.app/api/health`)

**Actie**: Herschrijven met correcte endpoints voor web + ti-studio.

### 5. Cloudflare Worker proxy verouderd

[cloudflare/railway-proxy/worker.js](cloudflare/railway-proxy/worker.js) bevat routing voor:
- `evaluaties.ckvoranjewit.app` → `evaluatie-production.up.railway.app` (legacy service)
- `scout.ckvoranjewit.app` → `ckvoranjewitapp-production.up.railway.app`

**Actie**: Evalueer welke routes nog actueel zijn na Fase B splitsing.

### 6. TI-Studio service ID ontbreekt

Nergens in de codebase is het TI-Studio Railway service ID gedocumenteerd. Het staat alleen als GitHub secret (`RAILWAY_SERVICE_TI_STUDIO`). De Railway skill vermeldt het niet, de deployment skill vermeldt het niet.

**Actie**: Service ID ophalen en documenteren in de nieuwe Smart Gateway config.

---

## Wat verdwijnt (14 → 6 tools)

| Huidige tool | Vervanging |
|---|---|
| `railway_status` | **Behouden** (vereenvoudigd, geen params) |
| `railway_services` | Gemerged in `railway_status` |
| `railway_deployment_status` | `railway_status` of `railway_ask` |
| `railway_logs` | **Behouden** (vereenvoudigd, service alias) |
| `railway_service_create` | `railway_ask` |
| `railway_service_connect` | `railway_ask` |
| `railway_variables_get` | Gemerged in `railway_variables` |
| `railway_variable_set` | Gemerged in `railway_variables` |
| `railway_deploy` | **Behouden** (merged met pipeline) |
| `railway_deploy_pipeline` | Gemerged in `railway_deploy` (wait: true) |
| `railway_domain_create` | Gemerged in `railway_domains` |
| `railway_custom_domain_create` | Gemerged in `railway_domains` |
| `railway_custom_domain_status` | Gemerged in `railway_domains` |
| `railway_deployments` | `railway_status` of `railway_ask` |

## Implementatie-scope

### Fase 1: Smart Gateway MCP Server
- Herbouw `apps/mcp/railway/server.js` met 6 tools
- Service-alias mapping met OW-defaults
- `railway_ask` via Railway CLI agent
- Alle bestaande GraphQL queries behouden (vereenvoudigd)

### Fase 2: Skills & Documentatie
- Railway skill herschrijven (6 tools, geen tokens in plaintext)
- Deployment skill herschrijven (actuele services, URLs, commands)
- Agent routing-tabel documenteren

### Fase 3: CI/CD Verbeteringen
- Dubbele fast-gate in `patch.yml` elimineren
- Post-deploy health check toevoegen aan `ci.yml`
- TI-Studio build toevoegen aan `release.yml`
- `verify-deploy.ts` herschrijven met correcte endpoints

### Fase 4: Legacy Opruimen
- Tokens uit skill-documentatie verwijderen
- Legacy services markeren in Railway skill
- Cloudflare Worker proxy routes evalueren
- TI-Studio service ID documenteren

## Teststrategie

### MCP Server unit tests

Elke tool krijgt unit tests in `apps/mcp/railway/server.test.js`:

| Test | Wat |
|---|---|
| **Service-alias resolutie** | `"web"` → correct UUID, `"onbekend"` → foutmelding met beschikbare opties |
| **OW-defaults** | Calls naar GraphQL bevatten correcte PROJECT_ID/ENV_ID zonder dat agent ze meegeeft |
| **railway_ask** | CLI wordt aangeroepen met juiste flags, timeout wordt afgehandeld, JSON output wordt geparsed |
| **railway_deploy wait=true** | Polling-loop werkt: simuleert BUILDING → SUCCESS en BUILDING → FAILED |
| **railway_deploy wait=false** | Fire-and-forget: returnt direct na trigger |
| **railway_logs** | Haalt automatisch laatste deployment, respecteert `lines` parameter |
| **railway_variables get** | Ophalen zonder `set` parameter |
| **railway_variables set** | Upsert met `set`, returnt bijgewerkte variabelen |
| **railway_domains** | Status en create acties, foutmelding bij create zonder domain |
| **Foutafhandeling** | API down → duidelijke foutmelding, CLI timeout → hint |

**Aanpak**: Mock de `fetch` (GraphQL) en `child_process.execFile` (CLI agent) zodat tests geen netwerk nodig hebben.

### Integratietest (handmatig, eenmalig)

Na implementatie een live-test met de echte Railway API:

```
1. railway_status          → verwacht: 3 services (web, ti-studio, database)
2. railway_logs web        → verwacht: runtime logs van laatste deploy
3. railway_variables web   → verwacht: env vars (DATABASE_URL, etc.)
4. railway_domains         → verwacht: custom domains met SSL status
5. railway_ask "toon de laatste 3 deploys van web" → verwacht: Railway agent antwoord
```

### CI integratie

- Unit tests draaien mee in `pnpm test` (Vitest, via workspace)
- Geen E2E/integratietests in CI — Railway API mag niet vanuit CI aangeroepen worden
- `package.json` van `apps/mcp/railway` krijgt een `test` script

### Post-deploy verificatie

`scripts/verify-deploy.ts` wordt herschreven met:

| Check | Endpoint | Verwacht |
|---|---|---|
| Web app | `https://www.ckvoranjewit.app/api/health` | HTTP 200 + SHA match |
| TI-Studio | `https://teamindeling.ckvoranjewit.app/api/health` | HTTP 200 + SHA match |
| DNS resolutie | `dns.google/resolve` voor beide domeinen | CNAME correct |

## Vereisten

- **Railway CLI v4.9+**: Geinstalleerd (v4.30.5 aanwezig)
- **Railway CLI authenticatie**: `railway login` moet gedaan zijn op de machine waar de MCP server draait
- **RAILWAY_TOKEN**: Blijft nodig voor GraphQL tools (env var in `.mcp.json`)
- **Geen breaking changes**: Agents die nu Railway tools gebruiken blijven werken na skill-update
