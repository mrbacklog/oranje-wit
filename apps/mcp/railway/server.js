const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { PROJECT_ID, ENV_ID, API_URL } = require("./config.js");

const execFileAsync = promisify(execFile);

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

// ─── Tool: railway_status ──────────────────────────────────────────────────

const server = new McpServer({
  name: "railway",
  version: "2.0.0",
});

server.tool(
  "railway_status",
  "Overzicht van alle OW-services met alias, naam en laatste deployment",
  {},
  async () => {
    try {
      const data = await railwayQuery(
        `
        query ($projectId: String!) {
          project(id: $projectId) {
            id name
            services {
              edges {
                node {
                  id name
                  serviceInstances {
                    edges {
                      node {
                        environmentId
                        latestDeployment {
                          id status createdAt
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
        { projectId: PROJECT_ID }
      );

      const { SERVICES } = require("./config.js");
      const idToAlias = {};
      for (const [alias, svc] of Object.entries(SERVICES)) {
        idToAlias[svc.id] = alias;
      }

      const services = data.project.services.edges.map((e) => {
        const node = e.node;
        const prodInstance = node.serviceInstances.edges.find(
          (inst) => inst.node.environmentId === ENV_ID
        );
        return {
          alias: idToAlias[node.id] || null,
          id: node.id,
          name: node.name,
          latestDeployment: prodInstance?.node?.latestDeployment || null,
        };
      });

      return ok({
        project: data.project.name,
        services,
        aantal: services.length,
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool: railway_ask ────────────────────────────────────────────────────

function buildAskCommand(question, serviceAlias) {
  const args = ["agent", "-p", question, "--json"];
  if (serviceAlias) {
    const { resolveService } = require("./config.js");
    const svc = resolveService(serviceAlias);
    args.push("--service", svc.name);
  }
  return { cmd: "railway", args };
}

server.tool(
  "railway_ask",
  "Stel een vraag aan de Railway AI-agent. Voor debugging, metrics, multi-step taken.",
  {
    question: z.string(),
    service: z.enum(["web", "ti-studio", "database"]).optional(),
  },
  async ({ question, service }) => {
    try {
      const { cmd, args } = buildAskCommand(question, service);
      const { stdout } = await execFileAsync(cmd, args, { timeout: 120_000 });
      try {
        return ok(JSON.parse(stdout));
      } catch {
        return ok({ raw: stdout });
      }
    } catch (e) {
      if (e.code === "ENOENT") return err("Railway CLI niet gevonden");
      if (e.killed) return err("timeout (120s)");
      return err(e.message);
    }
  }
);

// ─── Tool: railway_deploy ─────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getLatestDeploymentId(serviceId) {
  const data = await railwayQuery(
    `query ($projectId: String!, $serviceId: String!, $envId: String!) {
      deployments(
        input: { projectId: $projectId, serviceId: $serviceId, environmentId: $envId }
        first: 1
      ) {
        edges { node { id status createdAt } }
      }
    }`,
    { projectId: PROJECT_ID, serviceId, envId: ENV_ID }
  );
  const edge = data.deployments.edges[0];
  return edge ? edge.node : null;
}

server.tool(
  "railway_deploy",
  "Deploy een service. Default wacht op resultaat (SUCCESS/FAILED).",
  {
    service: z.enum(["web", "ti-studio"]),
    wait: z.boolean().optional().default(true),
  },
  async ({ service, wait }) => {
    try {
      const { resolveService } = require("./config.js");
      const svc = resolveService(service);
      const svcId = svc.id;

      await railwayQuery(
        `mutation ($envId: String!, $svcId: String!) {
          serviceInstanceDeploy(environmentId: $envId, serviceId: $svcId, latestCommit: true)
        }`,
        { envId: ENV_ID, svcId }
      );

      if (!wait) {
        return ok({ service, status: "TRIGGERED" });
      }

      await sleep(3000);
      const start = Date.now();
      const terminal = ["SUCCESS", "FAILED", "CRASHED", "REMOVED"];

      for (let i = 0; i < 30; i++) {
        const dep = await getLatestDeploymentId(svcId);
        if (dep && terminal.includes(dep.status)) {
          const elapsed = Math.round((Date.now() - start) / 1000);
          if (dep.status === "SUCCESS") {
            return ok({ service, status: dep.status, deploymentId: dep.id, elapsed: `${elapsed}s` });
          }
          return ok({
            service,
            status: dep.status,
            deploymentId: dep.id,
            elapsed: `${elapsed}s`,
            hint: "Gebruik railway_logs of railway_ask voor details.",
          });
        }
        await sleep(10_000);
      }

      return ok({
        service,
        status: "TIMEOUT",
        hint: "Deploy duurt langer dan 5 minuten. Gebruik railway_ask om status te checken.",
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool: railway_logs ───────────────────────────────────────────────────

server.tool(
  "railway_logs",
  "Logs van een service. Pakt automatisch de laatste deployment.",
  {
    service: z.enum(["web", "ti-studio"]),
    type: z.enum(["build", "runtime"]).optional().default("runtime"),
    lines: z.number().optional().default(100),
  },
  async ({ service, type, lines }) => {
    try {
      const { resolveService } = require("./config.js");
      const svc = resolveService(service);
      const dep = await getLatestDeploymentId(svc.id);
      if (!dep) return err("Geen deployment gevonden");

      const logField = type === "build" ? "buildLogs" : "deploymentLogs";
      const data = await railwayQuery(
        `query ($deploymentId: String!) {
          ${logField}(deploymentId: $deploymentId) {
            message timestamp severity
          }
        }`,
        { deploymentId: dep.id }
      );

      const allLogs = data[logField] || [];
      const sliced = allLogs.slice(-lines);
      return ok({
        service,
        deploymentId: dep.id,
        type,
        lines: sliced.length,
        logs: sliced,
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool: railway_variables ──────────────────────────────────────────────

server.tool(
  "railway_variables",
  "Environment variables ophalen of instellen.",
  {
    service: z.enum(["web", "ti-studio", "database"]),
    set: z.record(z.string()).optional(),
  },
  async ({ service, set }) => {
    try {
      const { resolveService } = require("./config.js");
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
            },
          }
        );
      }

      const data = await railwayQuery(
        `query ($projectId: String!, $envId: String!, $svcId: String!) {
          variables(projectId: $projectId, environmentId: $envId, serviceId: $svcId)
        }`,
        { projectId: PROJECT_ID, envId: ENV_ID, svcId: svc.id }
      );

      return ok({ service, variables: data.variables });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool: railway_domains ────────────────────────────────────────────────

server.tool(
  "railway_domains",
  "Custom domains beheren.",
  {
    service: z.enum(["web", "ti-studio"]).optional(),
    action: z.enum(["status", "create"]).optional().default("status"),
    domain: z.string().optional(),
  },
  async ({ service, action, domain }) => {
    try {
      const { resolveService, SERVICES } = require("./config.js");

      if (action === "create") {
        if (!service) return err("service is verplicht bij action=create");
        if (!domain) return err("domain is verplicht bij action=create");
        const svc = resolveService(service);
        const data = await railwayQuery(
          `mutation ($input: CustomDomainCreateInput!) {
            customDomainCreate(input: $input) {
              id domain
            }
          }`,
          {
            input: {
              projectId: PROJECT_ID,
              environmentId: ENV_ID,
              serviceId: svc.id,
              domain,
            },
          }
        );
        return ok({ service, action: "create", result: data.customDomainCreate });
      }

      // status
      const results = [];
      const aliases = service ? [service] : ["web", "ti-studio"];
      for (const alias of aliases) {
        const svc = resolveService(alias);
        const data = await railwayQuery(
          `query ($projectId: String!, $envId: String!, $svcId: String!) {
            customDomains(projectId: $projectId, environmentId: $envId, serviceId: $svcId) {
              id domain status { dnsRecords { hostName type requiredValue currentValue status } }
            }
          }`,
          { projectId: PROJECT_ID, envId: ENV_ID, svcId: svc.id }
        );
        results.push({ service: alias, domains: data.customDomains });
      }
      return ok(results);
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Start server ──────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Railway MCP server fout:", error);
    process.exit(1);
  });
}

module.exports = { railwayQuery, ok, err, buildAskCommand };
