const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const server = new McpServer({
  name: 'railway',
  version: '1.0.0',
});

const API_URL = 'https://backboard.railway.com/graphql/v2';

async function railwayQuery(query, variables = {}) {
  const token = process.env.RAILWAY_TOKEN;
  if (!token) throw new Error('RAILWAY_TOKEN niet geconfigureerd');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!resp.ok) throw new Error(`Railway API HTTP ${resp.status}: ${resp.statusText}`);

  const json = await resp.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

function ok(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(message) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }] };
}

// ─── Tool 1: railway_status ─────────────────────────────────────────────────

server.tool('railway_status', 'Auth check en projectoverzicht', {}, async () => {
  try {
    const data = await railwayQuery(`
      query {
        projects {
          edges {
            node {
              id name
              environments { edges { node { id name } } }
              services { edges { node { id name } } }
            }
          }
        }
      }
    `);
    const projects = data.projects.edges.map(e => ({
      id: e.node.id,
      name: e.node.name,
      environments: e.node.environments.edges.map(env => ({ id: env.node.id, name: env.node.name })),
      services: e.node.services.edges.map(svc => ({ id: svc.node.id, name: svc.node.name })),
    }));
    return ok({ status: 'verbonden', projecten: projects, aantal: projects.length });
  } catch (e) {
    return err(e.message);
  }
});

// ─── Tool 2: railway_services ───────────────────────────────────────────────

server.tool(
  'railway_services',
  'Services + laatste deployment in een project',
  { projectId: z.string().describe('Railway project ID') },
  async ({ projectId }) => {
    try {
      const data = await railwayQuery(`
        query ($projectId: String!) {
          project(id: $projectId) {
            id name
            services {
              edges {
                node {
                  id name icon
                  serviceInstances {
                    edges {
                      node {
                        environmentId
                        startCommand buildCommand
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
      `, { projectId });
      const services = data.project.services.edges.map(e => ({
        id: e.node.id,
        name: e.node.name,
        instances: e.node.serviceInstances.edges.map(inst => ({
          environmentId: inst.node.environmentId,
          startCommand: inst.node.startCommand,
          buildCommand: inst.node.buildCommand,
          latestDeployment: inst.node.latestDeployment,
        })),
      }));
      return ok({ project: data.project.name, services, aantal: services.length });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 3: railway_deployment_status ──────────────────────────────────────

server.tool(
  'railway_deployment_status',
  'Status en URL van een deployment',
  { deploymentId: z.string().describe('Deployment ID') },
  async ({ deploymentId }) => {
    try {
      const data = await railwayQuery(`
        query ($deploymentId: String!) {
          deployment(id: $deploymentId) {
            id status staticUrl canRollback createdAt updatedAt
          }
        }
      `, { deploymentId });
      return ok(data.deployment);
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 4: railway_logs ───────────────────────────────────────────────────

server.tool(
  'railway_logs',
  'Build- of runtime-logs van een deployment',
  {
    deploymentId: z.string().describe('Deployment ID'),
    type: z.enum(['build', 'deploy']).describe('Log type: build of deploy'),
  },
  async ({ deploymentId, type }) => {
    try {
      const query = type === 'build'
        ? `query ($id: String!) { buildLogs(deploymentId: $id) { message } }`
        : `query ($id: String!) { deploymentLogs(deploymentId: $id) { message } }`;
      const data = await railwayQuery(query, { id: deploymentId });
      const logs = type === 'build' ? data.buildLogs : data.deploymentLogs;
      const lines = Array.isArray(logs) ? logs.map(l => l.message).join('\n') : JSON.stringify(logs);
      return ok({ type, deploymentId, logs: lines });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 5: railway_service_create ─────────────────────────────────────────

server.tool(
  'railway_service_create',
  'Service aanmaken en optioneel GitHub repo koppelen',
  {
    projectId: z.string().describe('Railway project ID'),
    repo: z.string().optional().describe('GitHub repo (owner/repo) om direct te koppelen'),
    name: z.string().optional().describe('Service naam'),
    branch: z.string().optional().describe('Git branch (default: master)'),
  },
  async ({ projectId, repo, name, branch }) => {
    try {
      const input = { projectId };
      if (name) input.name = name;
      if (repo) input.source = { repo };

      const createData = await railwayQuery(`
        mutation ($input: ServiceCreateInput!) {
          serviceCreate(input: $input) { id name }
        }
      `, { input });

      const serviceId = createData.serviceCreate.id;
      const serviceName = createData.serviceCreate.name;
      const result = { bericht: `Service "${serviceName}" aangemaakt`, serviceId };

      // Als repo meegegeven maar source niet werkte, probeer serviceConnect
      if (repo && !input.source) {
        const connectInput = { repo };
        if (branch) connectInput.branch = branch;
        await railwayQuery(`
          mutation ($id: String!, $input: ServiceConnectInput!) {
            serviceConnect(id: $id, input: $input) { id name }
          }
        `, { id: serviceId, input: connectInput });
        result.bericht += ` en gekoppeld aan ${repo}`;
      }

      if (repo) result.repo = repo;
      return ok(result);
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 6: railway_service_connect ────────────────────────────────────────

server.tool(
  'railway_service_connect',
  'Bestaande service koppelen aan een GitHub repo',
  {
    serviceId: z.string().describe('Service ID'),
    repo: z.string().describe('GitHub repo (owner/repo)'),
    branch: z.string().optional().describe('Git branch (default: main)'),
  },
  async ({ serviceId, repo, branch }) => {
    try {
      const input = { repo };
      if (branch) input.branch = branch;
      const data = await railwayQuery(`
        mutation ($id: String!, $input: ServiceConnectInput!) {
          serviceConnect(id: $id, input: $input) { id name }
        }
      `, { id: serviceId, input });
      return ok({
        bericht: `Service "${data.serviceConnect.name}" gekoppeld aan ${repo}`,
        serviceId: data.serviceConnect.id,
        repo,
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 7: railway_variables_get ──────────────────────────────────────────

server.tool(
  'railway_variables_get',
  'Environment variables ophalen voor een service',
  {
    projectId: z.string().describe('Railway project ID'),
    environmentId: z.string().describe('Environment ID'),
    serviceId: z.string().describe('Service ID'),
  },
  async ({ projectId, environmentId, serviceId }) => {
    try {
      const data = await railwayQuery(`
        query ($projectId: String!, $environmentId: String!, $serviceId: String!) {
          variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
        }
      `, { projectId, environmentId, serviceId });
      return ok({ variables: data.variables });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 8: railway_variable_set ───────────────────────────────────────────

server.tool(
  'railway_variable_set',
  'Environment variables instellen (upsert, triggert deploy)',
  {
    projectId: z.string().describe('Railway project ID'),
    environmentId: z.string().describe('Environment ID'),
    serviceId: z.string().describe('Service ID'),
    variables: z.record(z.string()).describe('Key-value pairs, bijv. {"NODE_ENV":"production"}'),
  },
  async ({ projectId, environmentId, serviceId, variables }) => {
    try {
      await railwayQuery(`
        mutation ($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }
      `, { input: { projectId, environmentId, serviceId, variables, replace: false } });
      return ok({
        bericht: `${Object.keys(variables).length} variable(s) ingesteld`,
        keys: Object.keys(variables),
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 9: railway_deploy ─────────────────────────────────────────────────

server.tool(
  'railway_deploy',
  'Deployment triggeren voor een service in een environment',
  {
    projectId: z.string().describe('Railway project ID'),
    environmentId: z.string().describe('Environment ID'),
    serviceId: z.string().describe('Service ID'),
  },
  async ({ projectId, environmentId, serviceId }) => {
    try {
      await railwayQuery(`
        mutation ($projectId: String!, $environmentId: String!, $serviceId: String!) {
          serviceInstanceDeploy(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
        }
      `, { projectId, environmentId, serviceId });
      return ok({ bericht: 'Deployment getriggerd' });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 10: railway_domain_create ─────────────────────────────────────────

server.tool(
  'railway_domain_create',
  'Railway-domein (.up.railway.app) genereren voor een service',
  {
    environmentId: z.string().describe('Environment ID'),
    serviceId: z.string().describe('Service ID'),
  },
  async ({ environmentId, serviceId }) => {
    try {
      const data = await railwayQuery(`
        mutation ($input: ServiceDomainCreateInput!) {
          serviceDomainCreate(input: $input) { id domain }
        }
      `, { input: { environmentId, serviceId } });
      return ok({
        bericht: 'Domein aangemaakt',
        domain: data.serviceDomainCreate.domain,
        url: `https://${data.serviceDomainCreate.domain}`,
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ─── Tool 11: railway_deployments ───────────────────────────────────────────

server.tool(
  'railway_deployments',
  'Lijst recente deployments voor een service',
  {
    projectId: z.string().describe('Railway project ID'),
    serviceId: z.string().describe('Service ID'),
  },
  async ({ projectId, serviceId }) => {
    try {
      const data = await railwayQuery(`
        query ($projectId: String!, $serviceId: String!) {
          deployments(projectId: $projectId, serviceId: $serviceId, first: 10) {
            edges {
              node { id status staticUrl canRollback createdAt }
            }
          }
        }
      `, { projectId, serviceId });
      const deploys = data.deployments.edges.map(e => e.node);
      return ok({ deployments: deploys, aantal: deploys.length });
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

main().catch(err => {
  console.error('Railway MCP server fout:', err);
  process.exit(1);
});
