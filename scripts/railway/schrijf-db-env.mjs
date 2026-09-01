/**
 * Haalt de Postgres-credentials op via de Railway GraphQL API en schrijft
 * packages/database/.env met DATABASE_URL + DIRECT_URL.
 *
 * De Postgres-service heeft geen kant-en-klare publieke URL; die wordt hier
 * samengesteld uit POSTGRES_USER/PASSWORD/DB + RAILWAY_TCP_PROXY_DOMAIN/PORT.
 *
 * Gebruik: RAILWAY_TOKEN=<account-token> node scripts/railway/schrijf-db-env.mjs
 */

import { writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_URL = "https://backboard.railway.com/graphql/v2";
const PROJECT_ID = "aa87602d-316d-4d3e-8860-f75d352fae27";
const ENV_ID = "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1";
const DB_SERVICE_ID = "e7486b49-dba3-4e0a-8709-a501cea860ae";

const ENV_PAD = resolve(__dirname, "../../packages/database/.env");

const token = process.env.RAILWAY_TOKEN;
if (!token) {
  process.stderr.write("RAILWAY_TOKEN ontbreekt\n");
  process.exit(1);
}

const QUERY = `query V($p:String!,$e:String!,$s:String!){ variables(projectId:$p, environmentId:$e, serviceId:$s) }`;

const resp = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ query: QUERY, variables: { p: PROJECT_ID, e: ENV_ID, s: DB_SERVICE_ID } }),
});

if (!resp.ok) {
  process.stderr.write(`Railway API HTTP ${resp.status}\n`);
  process.exit(1);
}

const json = await resp.json();
if (json.errors) {
  process.stderr.write(`Railway API: ${json.errors.map((e) => e.message).join("; ")}\n`);
  process.exit(1);
}

const v = json.data.variables;
const ontbreekt = [
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "RAILWAY_TCP_PROXY_DOMAIN",
  "RAILWAY_TCP_PROXY_PORT",
].filter((k) => !v[k]);

if (ontbreekt.length > 0) {
  process.stderr.write(`Ontbrekende variabelen op de Postgres-service: ${ontbreekt.join(", ")}\n`);
  process.exit(1);
}

const url = `postgresql://${v.POSTGRES_USER}:${encodeURIComponent(v.POSTGRES_PASSWORD)}@${v.RAILWAY_TCP_PROXY_DOMAIN}:${v.RAILWAY_TCP_PROXY_PORT}/${v.POSTGRES_DB}`;

if (existsSync(ENV_PAD)) {
  process.stderr.write(`${ENV_PAD} bestaat al — niet overschreven.\n`);
  process.exit(1);
}

writeFileSync(
  ENV_PAD,
  `# Gegenereerd door scripts/railway/schrijf-db-env.mjs — niet committen (.gitignore)\nDATABASE_URL=${url}\nDIRECT_URL=${url}\n`,
  { encoding: "utf8", mode: 0o600 }
);

process.stdout.write(
  `Geschreven: packages/database/.env\n` +
    `  host: ${v.RAILWAY_TCP_PROXY_DOMAIN}:${v.RAILWAY_TCP_PROXY_PORT}\n` +
    `  db:   ${v.POSTGRES_DB}\n` +
    `  user: ${v.POSTGRES_USER}\n`
);
