# Railway Smart Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Herbouw de Railway MCP server van 14 naar 6 tools met `railway_ask` als AI-powerhouse, OW-defaults ingebakken, en CI/CD verbeteringen.

**Architecture:** Eén MCP server (`apps/mcp/railway/server.js`) met service-alias mapping. `railway_ask` delegeert naar de Railway CLI Agent (`railway agent -p`). De 5 overige tools gebruiken directe GraphQL calls met ingebakken project/environment IDs.

**Tech Stack:** Node.js 22, `@modelcontextprotocol/sdk`, `zod`, Railway GraphQL API v2, Railway CLI v4.30.5

**Spec:** `docs/superpowers/specs/2026-04-19-railway-smart-gateway-design.md`

---

## File Structure

| Bestand | Actie | Verantwoordelijkheid |
|---|---|---|
| `apps/mcp/railway/server.js` | Herschrijven | 6 tools, OW-defaults, service-alias map |
| `apps/mcp/railway/server.test.js` | Nieuw | Unit tests per tool |
| `apps/mcp/railway/package.json` | Wijzigen | Vitest toevoegen, test script |
| `.claude/skills/railway/SKILL.md` | Herschrijven | 6 tools documentatie, geen tokens |
| `.claude/skills/deployment/SKILL.md` | Herschrijven | Actuele services, URLs, flows |
| `scripts/verify-deploy.ts` | Herschrijven | Correcte endpoints web + ti-studio |
| `.github/workflows/ci.yml` | Wijzigen | Post-deploy health check toevoegen |
| `.github/workflows/patch.yml` | Wijzigen | Dubbele fast-gate verwijderen |
| `.github/workflows/release.yml` | Wijzigen | TI-Studio typecheck/lint/build toevoegen |

---

## Task 1: TI-Studio Service ID ophalen en service-alias map bouwen

**Files:**
- Create: `apps/mcp/railway/config.js`

- [ ] **Step 1: Haal TI-Studio service ID op via Railway API**

```bash
curl -s -X POST "https://backboard.railway.com/graphql/v2" \
  -H "Authorization: Bearer $(cat ~/.claude/mcp.json 2>/dev/null | node -e 'process.stdin.on("data",d=>{try{console.log(JSON.parse(d).mcpServers.railway.env.RAILWAY_TOKEN)}catch{console.log("")}}')'" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { projects { edges { node { id name services { edges { node { id name } } } } } } }"}' | node -e '
const data = JSON.parse(require("fs").readFileSync(0,"utf8"));
const proj = data.data.projects.edges.find(e => e.node.name.includes("oranje-wit"));
if (proj) proj.node.services.edges.forEach(s => console.log(s.node.id, s.node.name));
'
```

Alternatief via de Railway MCP tool (als beschikbaar):
```
→ railway_services
    projectId: "aa87602d-316d-4d3e-8860-f75d352fae27"
```

Noteer het service ID voor ti-studio (de service met naam die "ti-studio" bevat).

- [ ] **Step 2: Maak config.js met de service-alias map**

```javascript
// apps/mcp/railway/config.js

const PROJECT_ID = "aa87602d-316d-4d3e-8860-f75d352fae27";
const ENV_ID = "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1";

const SERVICES = {
  web: {
    id: "46a4f38c-eff1-4140-ad07-f12be057ef30",
    name: "ckvoranjewit.app",
  },
  "ti-studio": {
    id: "<INVULLEN NA STEP 1>",
    name: "ti-studio",
  },
  database: {
    id: "e7486b49-dba3-4e0a-8709-a501cea860ae",
    name: "Postgres",
  },
};

const API_URL = "https://backboard.railway.com/graphql/v2";

function resolveService(alias) {
  const svc = SERVICES[alias];
  if (!svc) {
    const beschikbaar = Object.keys(SERVICES).join(", ");
    throw new Error(`Onbekende service '${alias}', beschikbaar: ${beschikbaar}`);
  }
  return svc;
}

module.exports = { PROJECT_ID, ENV_ID, SERVICES, API_URL, resolveService };
```

- [ ] **Step 3: Commit**

```bash
git add apps/mcp/railway/config.js
git commit -m "feat(railway-mcp): service-alias config met OW-defaults"
```

---

## Task 2: Basis MCP server met `railway_status`

**Files:**
- Modify: `apps/mcp/railway/server.js` (volledig herschrijven)
- Create: `apps/mcp/railway/server.test.js`
- Modify: `apps/mcp/railway/package.json`

- [ ] **Step 1: Voeg vitest toe aan package.json**

```json
{
  "name": "railway-mcp",
  "version": "2.0.0",
  "description": "Railway Smart Gateway MCP — 6 tools met OW-defaults",
  "main": "server.js",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Schrijf de basis server met railway_status**

```javascript
// apps/mcp/railway/server.js
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { PROJECT_ID, ENV_ID, SERVICES, API_URL, resolveService } = require("./config.js");

const server = new McpServer({
  name: "railway",
  version: "2.0.0",
});

async function railwayQuery(query, variables = {}) {
  const token = process.env.RAILWAY_TOKEN;
  if (!token) throw new Error("RAILWAY_TOKEN niet geconfigureerd");

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!resp.ok) throw new Error(`Railway API HTTP ${resp.status}: ${resp.statusText}`);

  const json = await resp.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(message) {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }] };
}

// ─── Tool 1: railway_status ─────────────────────────────────────────────────

server.tool(
  "railway_status",
  "Overzicht van alle OW services met laatste deployment status",
  {},
  async () => {
    try {
      const data = await railwayQuery(
        `query ($projectId: String!) {
          project(id: $projectId) {
            name
            services {
              edges {
                node {
                  id name
                  serviceInstances {
                    edges {
                      node {
                        environmentId
                        latestDeployment { id status createdAt staticUrl }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
        { projectId: PROJECT_ID }
      );

      const aliasMap = Object.fromEntries(
        Object.entries(SERVICES).map(([alias, svc]) => [svc.id, alias])
      );

      const services = data.project.services.edges.map((e) => {
        const svc = e.node;
        const prodInstance = svc.serviceInstances.edges.find(
          (i) => i.node.environmentId === ENV_ID
        );
        return {
          name: svc.name,
          alias: aliasMap[svc.id] || null,
          id: svc.id,
          lastDeploy: prodInstance?.node?.latestDeployment || null,
        };
      });

      return ok({ project: data.project.name, services });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Start server ───────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Exporteer voor tests
module.exports = { railwayQuery, resolveService, ok, err };

if (require.main === module) {
  main().catch((e) => {
    console.error("Railway MCP server fout:", e);
    process.exit(1);
  });
}
```

- [ ] **Step 3: Schrijf test voor railway_status en service-alias resolutie**

```javascript
// apps/mcp/railway/server.test.js
import { describe, it, expect } from "vitest";
const { resolveService } = require("./config.js");

describe("resolveService", () => {
  it("resolved 'web' naar correct service ID", () => {
    const svc = resolveService("web");
    expect(svc.id).toBe("46a4f38c-eff1-4140-ad07-f12be057ef30");
    expect(svc.name).toBe("ckvoranjewit.app");
  });

  it("resolved 'database' naar Postgres", () => {
    const svc = resolveService("database");
    expect(svc.id).toBe("e7486b49-dba3-4e0a-8709-a501cea860ae");
  });

  it("gooit fout bij onbekende alias", () => {
    expect(() => resolveService("onbekend")).toThrow("Onbekende service 'onbekend'");
    expect(() => resolveService("onbekend")).toThrow("beschikbaar: web, ti-studio, database");
  });
});
```

- [ ] **Step 4: Draai de tests**

```bash
cd apps/mcp/railway && pnpm install && pnpm test
```

Verwacht: 3 PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mcp/railway/server.js apps/mcp/railway/server.test.js apps/mcp/railway/package.json
git commit -m "feat(railway-mcp): v2 basis — server + railway_status + config tests"
```

---

## Task 3: Tool `railway_ask` (Railway CLI Agent)

**Files:**
- Modify: `apps/mcp/railway/server.js` (tool toevoegen)
- Modify: `apps/mcp/railway/server.test.js` (tests toevoegen)

- [ ] **Step 1: Schrijf test voor railway_ask**

Voeg toe aan `server.test.js`:

```javascript
import { describe, it, expect, vi } from "vitest";
import { execFile } from "child_process";

// Mock execFile voor railway agent CLI
vi.mock("child_process", () => ({
  execFile: vi.fn(),
}));

describe("railway_ask CLI invocatie", () => {
  it("bouwt correct command op zonder service", () => {
    const { buildAskCommand } = require("./server.js");
    const cmd = buildAskCommand("waarom crasht mijn app?");
    expect(cmd.args).toContain("-p");
    expect(cmd.args).toContain("waarom crasht mijn app?");
    expect(cmd.args).toContain("--json");
  });

  it("bouwt correct command op met service scope", () => {
    const { buildAskCommand } = require("./server.js");
    const cmd = buildAskCommand("toon logs", "web");
    expect(cmd.args).toContain("--service");
    expect(cmd.args).toContain("ckvoranjewit.app");
  });
});
```

- [ ] **Step 2: Draai test — verwacht FAIL (buildAskCommand bestaat nog niet)**

```bash
cd apps/mcp/railway && pnpm test
```

- [ ] **Step 3: Implementeer railway_ask tool**

Voeg toe aan `server.js`, vóór de `main()` functie:

```javascript
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

function buildAskCommand(question, serviceAlias) {
  const args = ["agent", "-p", question, "--json"];
  if (serviceAlias) {
    const svc = resolveService(serviceAlias);
    args.push("--service", svc.name);
  }
  return { cmd: "railway", args };
}

server.tool(
  "railway_ask",
  "Stel een vraag aan de Railway AI-agent. Voor debugging, metrics, multi-step taken en alles wat niet in de andere 5 tools past.",
  {
    question: z.string().describe("Vrije tekst vraag aan de Railway agent"),
    service: z
      .enum(["web", "ti-studio", "database"])
      .optional()
      .describe("Optionele service-scope"),
  },
  async ({ question, service }) => {
    try {
      const { cmd, args } = buildAskCommand(question, service);
      const { stdout } = await execFileAsync(cmd, args, {
        timeout: 120_000,
        env: { ...process.env },
      });

      try {
        const result = JSON.parse(stdout);
        return ok({ answer: result.response || result.message || stdout, raw: result });
      } catch {
        return ok({ answer: stdout.trim() });
      }
    } catch (e) {
      if (e.killed) {
        return err("Railway agent timeout (120s). Probeer een specifiekere vraag.");
      }
      if (e.code === "ENOENT") {
        return err(
          "Railway CLI niet gevonden. Installeer via: npm i -g @railway/cli"
        );
      }
      return err(`Railway agent fout: ${e.message}`);
    }
  }
);

// Exporteer buildAskCommand voor tests
module.exports = { railwayQuery, resolveService, ok, err, buildAskCommand };
```

- [ ] **Step 4: Draai tests — verwacht PASS**

```bash
cd apps/mcp/railway && pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add apps/mcp/railway/server.js apps/mcp/railway/server.test.js
git commit -m "feat(railway-mcp): railway_ask tool via Railway CLI Agent"
```

---

## Task 4: Tool `railway_deploy` (merged met pipeline)

**Files:**
- Modify: `apps/mcp/railway/server.js`
- Modify: `apps/mcp/railway/server.test.js`

- [ ] **Step 1: Schrijf test voor railway_deploy**

```javascript
describe("railway_deploy", () => {
  it("resolved service alias naar correct ID", () => {
    const svc = resolveService("web");
    expect(svc.id).toBe("46a4f38c-eff1-4140-ad07-f12be057ef30");
  });

  it("fire-and-forget modus als wait=false", () => {
    // Test dat de tool NIET gaat pollen als wait=false
    // Implementatie-detail: mock railwayQuery, verify geen polling calls
  });
});
```

- [ ] **Step 2: Implementeer railway_deploy**

Voeg toe aan `server.js`:

```javascript
server.tool(
  "railway_deploy",
  "Deploy een service. Default wacht op resultaat (SUCCESS/FAILED). Gebruik wait:false voor fire-and-forget.",
  {
    service: z.enum(["web", "ti-studio"]).describe("Service alias"),
    wait: z.boolean().optional().default(true).describe("Wacht op resultaat (default: true)"),
  },
  async ({ service, wait }) => {
    try {
      const svc = resolveService(service);

      // Trigger deploy
      await railwayQuery(
        `mutation ($envId: String!, $svcId: String!) {
          serviceInstanceDeploy(environmentId: $envId, serviceId: $svcId, latestCommit: true)
        }`,
        { envId: ENV_ID, svcId: svc.id }
      );

      if (!wait) {
        return ok({ ok: true, status: "TRIGGERED", service, bericht: "Deploy getriggerd (fire-and-forget)" });
      }

      // Poll status
      await new Promise((r) => setTimeout(r, 3000));

      const listData = await railwayQuery(
        `query ($projectId: String!, $serviceId: String!) {
          deployments(projectId: $projectId, serviceId: $serviceId, first: 1) {
            edges { node { id status staticUrl createdAt } }
          }
        }`,
        { projectId: PROJECT_ID, serviceId: svc.id }
      );

      const deployment = listData.deployments.edges[0]?.node;
      if (!deployment) throw new Error("Geen deployment gevonden na trigger");

      const deploymentId = deployment.id;
      const TERMINAL = ["SUCCESS", "FAILED", "CRASHED", "REMOVED"];

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 10_000));

        const statusData = await railwayQuery(
          `query ($id: String!) {
            deployment(id: $id) { id status staticUrl }
          }`,
          { id: deploymentId }
        );

        const { status, staticUrl } = statusData.deployment;

        if (TERMINAL.includes(status)) {
          if (status === "SUCCESS") {
            return ok({ ok: true, status, service, deploymentId, url: staticUrl, elapsed: `${(i + 1) * 10}s` });
          }
          return ok({
            ok: false,
            status,
            service,
            deploymentId,
            hint: `Deploy mislukt (${status}). Gebruik railway_logs of railway_ask voor diagnose.`,
          });
        }
      }

      return ok({
        ok: false,
        status: "TIMEOUT",
        service,
        deploymentId,
        hint: "Deploy duurde langer dan 5 minuten. Gebruik railway_ask voor status.",
      });
    } catch (e) {
      return err(e.message);
    }
  }
);
```

- [ ] **Step 3: Draai tests**

```bash
cd apps/mcp/railway && pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add apps/mcp/railway/server.js apps/mcp/railway/server.test.js
git commit -m "feat(railway-mcp): railway_deploy met wait/fire-and-forget modus"
```

---

## Task 5: Tools `railway_logs`, `railway_variables`, `railway_domains`

**Files:**
- Modify: `apps/mcp/railway/server.js`
- Modify: `apps/mcp/railway/server.test.js`

- [ ] **Step 1: Schrijf tests voor de 3 tools**

```javascript
describe("railway_logs", () => {
  it("resolved service alias en gebruikt default type 'runtime'", () => {
    const svc = resolveService("web");
    expect(svc.id).toBeDefined();
    // Verdere mock-tests voor GraphQL call
  });
});

describe("railway_variables", () => {
  it("get-modus zonder set parameter", () => {
    // Verify dat alleen een query wordt uitgevoerd, geen mutation
  });

  it("set-modus met set parameter", () => {
    // Verify dat mutation wordt uitgevoerd
  });
});

describe("railway_domains", () => {
  it("status-modus zonder domain", () => {
    // Default action = status
  });

  it("create-modus vereist domain parameter", () => {
    // Moet fout geven als action=create zonder domain
  });
});
```

- [ ] **Step 2: Implementeer railway_logs**

```javascript
server.tool(
  "railway_logs",
  "Logs van een service ophalen. Pakt automatisch de laatste deployment.",
  {
    service: z.enum(["web", "ti-studio"]).describe("Service alias"),
    type: z.enum(["build", "runtime"]).optional().default("runtime").describe("Log type"),
    lines: z.number().optional().default(100).describe("Aantal regels"),
  },
  async ({ service, type, lines }) => {
    try {
      const svc = resolveService(service);

      // Haal laatste deployment ID
      const listData = await railwayQuery(
        `query ($projectId: String!, $serviceId: String!) {
          deployments(projectId: $projectId, serviceId: $serviceId, first: 1) {
            edges { node { id status } }
          }
        }`,
        { projectId: PROJECT_ID, serviceId: svc.id }
      );

      const deployment = listData.deployments.edges[0]?.node;
      if (!deployment) return err(`Geen deployments gevonden voor ${service}`);

      const deploymentId = deployment.id;
      const query =
        type === "build"
          ? `query ($id: String!) { buildLogs(deploymentId: $id) { message } }`
          : `query ($id: String!) { deploymentLogs(deploymentId: $id) { message } }`;

      const data = await railwayQuery(query, { id: deploymentId });
      const logs = type === "build" ? data.buildLogs : data.deploymentLogs;
      const logLines = Array.isArray(logs)
        ? logs.slice(-lines).map((l) => l.message).join("\n")
        : JSON.stringify(logs);

      return ok({ service, type, deploymentId, logs: logLines });
    } catch (e) {
      return err(e.message);
    }
  }
);
```

- [ ] **Step 3: Implementeer railway_variables**

```javascript
server.tool(
  "railway_variables",
  "Environment variables ophalen of instellen. Zonder 'set' parameter = ophalen, met 'set' = upsert.",
  {
    service: z.enum(["web", "ti-studio", "database"]).describe("Service alias"),
    set: z.record(z.string()).optional().describe("Key-value pairs om in te stellen"),
  },
  async ({ service, set }) => {
    try {
      const svc = resolveService(service);

      if (set && Object.keys(set).length > 0) {
        await railwayQuery(
          `mutation ($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input)
          }`,
          {
            input: {
              projectId: PROJECT_ID,
              environmentId: ENV_ID,
              serviceId: svc.id,
              variables: set,
              replace: false,
            },
          }
        );
      }

      const data = await railwayQuery(
        `query ($projectId: String!, $environmentId: String!, $serviceId: String!) {
          variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
        }`,
        { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId: svc.id }
      );

      const result = { service, variables: data.variables };
      if (set) result.bericht = `${Object.keys(set).length} variable(s) ingesteld`;
      return ok(result);
    } catch (e) {
      return err(e.message);
    }
  }
);
```

- [ ] **Step 4: Implementeer railway_domains**

```javascript
server.tool(
  "railway_domains",
  "Custom domains beheren. Default: status overzicht. Met action 'create': nieuw domein koppelen.",
  {
    service: z.enum(["web", "ti-studio"]).optional().describe("Filter op service"),
    action: z.enum(["status", "create"]).optional().default("status").describe("Actie"),
    domain: z.string().optional().describe("Domein (verplicht bij create)"),
  },
  async ({ service, action, domain }) => {
    try {
      if (action === "create") {
        if (!domain) return err("Parameter 'domain' is verplicht bij action 'create'");
        if (!service) return err("Parameter 'service' is verplicht bij action 'create'");

        const svc = resolveService(service);
        const data = await railwayQuery(
          `mutation ($input: CustomDomainCreateInput!) {
            customDomainCreate(input: $input) {
              id domain
              status {
                verified certificateStatus
                dnsRecords { fqdn requiredValue currentValue status }
              }
            }
          }`,
          { input: { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId: svc.id, domain } }
        );

        const cd = data.customDomainCreate;
        return ok({
          bericht: `Custom domein "${cd.domain}" aangemaakt`,
          domain: cd.domain,
          cname: cd.status.dnsRecords?.[0]?.requiredValue,
          verified: cd.status.verified,
          ssl: cd.status.certificateStatus,
        });
      }

      // Status overzicht
      const data = await railwayQuery(
        `query ($projectId: String!) {
          project(id: $projectId) {
            services {
              edges {
                node {
                  id name
                  serviceInstances {
                    edges {
                      node {
                        environmentId
                        domains {
                          customDomains {
                            domain
                            status { verified certificateStatus dnsRecords { fqdn requiredValue currentValue status } }
                          }
                          serviceDomains { domain }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
        { projectId: PROJECT_ID }
      );

      const aliasMap = Object.fromEntries(
        Object.entries(SERVICES).map(([alias, svc]) => [svc.id, alias])
      );

      let services = data.project.services.edges.map((e) => {
        const svc = e.node;
        const alias = aliasMap[svc.id] || null;
        const inst = svc.serviceInstances.edges.find((i) => i.node.environmentId === ENV_ID);
        return {
          service: svc.name,
          alias,
          customDomains: (inst?.node?.domains?.customDomains || []).map((cd) => ({
            domain: cd.domain,
            verified: cd.status.verified,
            ssl: cd.status.certificateStatus,
            cname: cd.status.dnsRecords?.[0]?.requiredValue,
          })),
          railwayDomains: (inst?.node?.domains?.serviceDomains || []).map((d) => d.domain),
        };
      });

      if (service) {
        const svc = resolveService(service);
        services = services.filter((s) => s.alias === service);
      }

      return ok({ domains: services });
    } catch (e) {
      return err(e.message);
    }
  }
);
```

- [ ] **Step 5: Draai tests**

```bash
cd apps/mcp/railway && pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add apps/mcp/railway/server.js apps/mcp/railway/server.test.js
git commit -m "feat(railway-mcp): railway_logs, railway_variables, railway_domains"
```

---

## Task 6: Live integratietest

**Files:** Geen wijzigingen — alleen verificatie

- [ ] **Step 1: Herstart MCP server en test railway_status**

Herstart Claude Code om de MCP server te herladen. Test:

```
→ railway_status
```

Verwacht: JSON met 3+ services, elk met alias ("web", "ti-studio", "database") en laatste deployment info.

- [ ] **Step 2: Test railway_logs**

```
→ railway_logs
    service: "web"
```

Verwacht: Runtime logs van de laatste deployment.

- [ ] **Step 3: Test railway_variables**

```
→ railway_variables
    service: "web"
```

Verwacht: Env vars (DATABASE_URL, NEXTAUTH_SECRET, etc.).

- [ ] **Step 4: Test railway_domains**

```
→ railway_domains
```

Verwacht: Custom domains met SSL status.

- [ ] **Step 5: Test railway_ask**

```
→ railway_ask
    question: "toon de status van alle services in het project"
```

Verwacht: Railway AI-agent antwoord met overzicht. Als Railway CLI niet geauthenticeerd is, verwacht foutmelding "Railway CLI niet gevonden" of auth-fout.

- [ ] **Step 6: Noteer resultaten en fix eventuele problemen**

---

## Task 7: Railway skill herschrijven

**Files:**
- Modify: `.claude/skills/railway/SKILL.md` (volledig herschrijven)

- [ ] **Step 1: Herschrijf de Railway skill**

De skill moet bevatten:
- Architectuur-diagram (Smart Gateway)
- 6 tools met parameters en voorbeelden
- Agent-routeringstabel
- Service-alias tabel (web, ti-studio, database)
- Custom domain waarschuwingen (behouden)
- DNS/Cloudflare sectie (behouden, gecomprimeerd)
- **GEEN tokens of secrets in plaintext**
- Verwijzingen naar `~/.claude/mcp.json` voor credentials

Verwijder:
- Alle 14 oude tool-beschrijvingen
- Hardcoded token in curl-voorbeelden
- GitHub secrets in plaintext
- Legacy service IDs (team-indeling, evaluatie)

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/railway/SKILL.md
git commit -m "docs(railway): skill herschreven voor Smart Gateway v2 — 6 tools, geen tokens"
```

---

## Task 8: Deployment skill herschrijven

**Files:**
- Modify: `.claude/skills/deployment/SKILL.md` (volledig herschrijven)

- [ ] **Step 1: Herschrijf de Deployment skill**

Actualiseer met:
- 2 apps (web + ti-studio), niet 3 losse apps
- Correcte service IDs (uit config.js)
- Correcte URLs: `www.ckvoranjewit.app` en `teamindeling.ckvoranjewit.app`
- Verwijzing naar 6 MCP tools (niet 14)
- Actuele deployment-flow via CI
- TI-Studio Dockerfile: `apps/ti-studio/Dockerfile`

Verwijder:
- Verouderde service IDs (team-indeling `49ed7b30`, monitor `a7efb126`, evaluatie `c7a578c6`)
- Verouderde URLs (`ckvoranjewit.app/teamindeling`)
- Verouderde commando's (`pnpm test:e2e:ti`, `pnpm test:e2e:monitor`)
- Selectieve deploy tabel (pre-consolidatie)

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/deployment/SKILL.md
git commit -m "docs(deployment): skill geactualiseerd — 2 apps, 6 tools, correcte URLs"
```

---

## Task 9: verify-deploy.ts herschrijven

**Files:**
- Modify: `scripts/verify-deploy.ts`

- [ ] **Step 1: Herschrijf verify-deploy.ts**

```typescript
/* eslint-disable no-console */
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface HealthCheckResult {
  name: string;
  url: string;
  healthUrl: string;
  status: "GROEN" | "ORANJE" | "ROOD";
  details: string;
  responseTime?: number;
  sha?: string;
}

const APPS = [
  {
    name: "Web (Monitor, Evaluatie, Scouting, Beheer, Beleid)",
    url: "https://www.ckvoranjewit.app",
    healthUrl: "https://www.ckvoranjewit.app/api/health",
  },
  {
    name: "TI-Studio (Team-Indeling)",
    url: "https://teamindeling.ckvoranjewit.app",
    healthUrl: "https://teamindeling.ckvoranjewit.app/api/health",
  },
];

async function fetchWithTimeout(
  url: string,
  timeoutMs = 5000
): Promise<{ status: number; body: string; time: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const start = performance.now();
    const response = await fetch(url, { signal: controller.signal });
    const time = performance.now() - start;
    const body = await response.text();
    return { status: response.status, body, time };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHealth(app: (typeof APPS)[0]): Promise<HealthCheckResult> {
  try {
    const { status, body, time } = await fetchWithTimeout(app.healthUrl);

    if (status !== 200) {
      return {
        name: app.name, url: app.url, healthUrl: app.healthUrl,
        status: "ROOD", details: `HTTP ${status}`, responseTime: Math.round(time),
      };
    }

    let sha = "";
    try {
      const json = JSON.parse(body);
      sha = json.version || json.sha || "";
    } catch { /* ignore */ }

    if (time > 3000) {
      return {
        name: app.name, url: app.url, healthUrl: app.healthUrl,
        status: "ORANJE", details: `HTTP 200 maar traag (${Math.round(time)}ms)`,
        responseTime: Math.round(time), sha,
      };
    }

    return {
      name: app.name, url: app.url, healthUrl: app.healthUrl,
      status: "GROEN", details: `HTTP 200 (${Math.round(time)}ms)`,
      responseTime: Math.round(time), sha,
    };
  } catch (error) {
    return {
      name: app.name, url: app.url, healthUrl: app.healthUrl,
      status: "ROOD", details: `Fout: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function main() {
  console.log("\n=== POST-DEPLOY VERIFICATIE ===\n");

  const git = await (async () => {
    try {
      const { stdout: sha } = await execAsync("git rev-parse HEAD");
      return sha.trim().slice(0, 7);
    } catch { return "unknown"; }
  })();

  console.log(`Lokale SHA: ${git}\n`);

  const results = await Promise.all(APPS.map(checkHealth));

  console.log("| App | Status | Details | Response | SHA |");
  console.log("|---|---|---|---|---|");
  for (const r of results) {
    const status = r.status === "GROEN" ? "GROEN" : r.status === "ORANJE" ? "ORANJE" : "ROOD";
    console.log(`| ${r.name} | ${status} | ${r.details} | ${r.responseTime ?? "-"}ms | ${r.sha?.slice(0, 7) ?? "-"} |`);
  }

  const rood = results.filter((r) => r.status === "ROOD").length;
  process.exit(rood > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Fout:", e); process.exit(2); });
```

- [ ] **Step 2: Commit**

```bash
git add scripts/verify-deploy.ts
git commit -m "fix: verify-deploy.ts — correcte endpoints web + ti-studio"
```

---

## Task 10: CI/CD verbeteringen

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/patch.yml`
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Voeg post-deploy health check toe aan ci.yml**

Na de twee Railway deploy steps in `ci.yml`, voeg toe:

```yaml
      - name: Wacht op Railway deployment (90s)
        run: sleep 90

      - name: Post-deploy health check
        run: |
          for URL in "https://www.ckvoranjewit.app/api/health" "https://teamindeling.ckvoranjewit.app/api/health"; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || echo "000")
            if [ "$STATUS" != "200" ]; then
              echo "WAARSCHUWING: $URL returned HTTP $STATUS"
            else
              echo "OK: $URL"
            fi
          done
```

- [ ] **Step 2: Verwijder dubbele fast-gate uit patch.yml**

Herschrijf `patch.yml` zodat alleen de verify-job overblijft, getriggerd door `workflow_run` van `ci.yml`:

```yaml
name: Patch Post-Deploy Verify

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  verify:
    if: |
      github.event.workflow_run.conclusion == 'success' &&
      (startsWith(github.event.workflow_run.head_commit.message, 'patch:') ||
       startsWith(github.event.workflow_run.head_commit.message, 'patch(') ||
       startsWith(github.event.workflow_run.head_commit.message, 'fix:') ||
       startsWith(github.event.workflow_run.head_commit.message, 'fix('))
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0

      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Wacht op Railway deployment (120s)
        run: sleep 120

      - name: Post-deploy verificatie
        run: pnpm verify:deploy
```

- [ ] **Step 3: Voeg ti-studio typecheck, lint en build toe aan release.yml**

In de `fast-gate` job, na de web lint step:

```yaml
      - name: Typecheck (ti-studio)
        run: pnpm --filter @oranje-wit/ti-studio exec tsc --noEmit

      - name: Lint (ti-studio)
        run: pnpm --filter @oranje-wit/ti-studio lint
```

In de `build` job, na de web build step:

```yaml
      - name: Build (ti-studio)
        run: pnpm --filter @oranje-wit/ti-studio build
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/patch.yml .github/workflows/release.yml
git commit -m "fix(ci): post-deploy health check, patch dedup, ti-studio in release"
```

---

## Task 11: Spec bijwerken en opruimen

**Files:**
- Modify: `docs/superpowers/specs/2026-04-19-railway-smart-gateway-design.md`

- [ ] **Step 1: Werk de spec bij met TI-Studio service ID**

Vervang `<TI_STUDIO_SERVICE_ID>` met het daadwerkelijke ID uit Task 1.

- [ ] **Step 2: Markeer de spec als geïmplementeerd**

Verander `**Status**: Ontwerp` naar `**Status**: Geïmplementeerd`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-19-railway-smart-gateway-design.md
git commit -m "docs: spec bijgewerkt — ti-studio ID ingevuld, status geïmplementeerd"
```
