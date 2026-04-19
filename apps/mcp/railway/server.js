const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { PROJECT_ID, ENV_ID, API_URL } = require("./config.js");

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

module.exports = { railwayQuery, ok, err };
