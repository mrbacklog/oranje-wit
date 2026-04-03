/* eslint-disable no-console */
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface HealthCheckResult {
  name: string;
  url: string;
  status: "GROEN" | "ORANJE" | "ROOD";
  details: string;
  responseTime?: number;
  httpCode?: number;
  sha?: string;
}

/**
 * Apps die moeten draaien. Railway URLs zijn raw app-servers (geen auth/proxy).
 * Cloudflare URLs zijn publieke domeinen (via Worker proxy, kan auth hebben).
 *
 * Voor post-deploy verificatie gebruiken we de raw Railway URLs omdat:
 * 1. Health checks moeten ALTIJD bereikbaar zijn (geen auth)
 * 2. Ze geven directe SHA info terug
 * 3. Ze zijn onafhankelijk van Cloudflare-configuratie
 */
const APPS = [
  {
    name: "Team-Indeling",
    url: "https://www.ckvoranjewit.app/teamindeling",
    healthEndpoint: "https://team-indeling-production.up.railway.app/api/health",
  },
  {
    name: "Monitor",
    url: "https://www.ckvoranjewit.app/monitor",
    healthEndpoint: "https://monitor-production-b2b1.up.railway.app/api/health",
  },
  {
    name: "Evaluatie",
    url: "https://evaluaties.ckvoranjewit.app",
    healthEndpoint: "https://evaluatie-production.up.railway.app/api/health",
  },
];

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 5000
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
    const { status, body, time } = await fetchWithTimeout(app.healthEndpoint);

    if (status !== 200) {
      return {
        name: app.name,
        url: app.url,
        status: "ROOD",
        details: `HTTP ${status} - health endpoint niet OK`,
        httpCode: status,
        responseTime: Math.round(time),
      };
    }

    let sha = "";
    try {
      const json = JSON.parse(body);
      sha = json.version || "";
    } catch {
      // ignore parse error
    }

    if (time > 3000) {
      return {
        name: app.name,
        url: app.url,
        status: "ORANJE",
        details: `HTTP 200 maar traag (${Math.round(time)}ms)`,
        responseTime: Math.round(time),
        httpCode: 200,
        sha,
      };
    }

    return {
      name: app.name,
      url: app.url,
      status: "GROEN",
      details: `HTTP 200, gezond (${Math.round(time)}ms)`,
      responseTime: Math.round(time),
      httpCode: 200,
      sha,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      name: app.name,
      url: app.url,
      status: "ROOD",
      details: `Bereikbaarheid fout: ${msg}`,
    };
  }
}

async function checkGitStatus(): Promise<{ currentSha: string; isClean: boolean }> {
  try {
    const { stdout: sha } = await execAsync("git rev-parse HEAD");
    const { stdout: status } = await execAsync("git status --porcelain");
    return {
      currentSha: sha.trim().slice(0, 7),
      isClean: status.trim().length === 0,
    };
  } catch {
    return { currentSha: "unknown", isClean: false };
  }
}

async function checkCIStatus(): Promise<{ status: string; runId?: string }> {
  try {
    const { stdout } = await execAsync("gh run list --limit 1 --json status,databaseId");
    const runs = JSON.parse(stdout);
    if (runs.length === 0) {
      return { status: "ONBEKEND" };
    }
    const run = runs[0];
    return { status: run.status || "ONBEKEND", runId: run.databaseId };
  } catch {
    return { status: "ONBEKEND" };
  }
}

function formatTable(results: HealthCheckResult[]): string {
  const getal = (n: number | undefined) => (n ? `${n}ms` : "—");

  let table = "\n| App | Status | Details | Response | SHA |\n";
  table += "|---|---|---|---|---|\n";

  for (const result of results) {
    const status =
      result.status === "GROEN" ? "✅ GROEN" : result.status === "ORANJE" ? "⚠️ ORANJE" : "❌ ROOD";
    const details = result.details;
    const response = getal(result.responseTime);
    const sha = result.sha ? result.sha.slice(0, 7) : "—";

    table += `| ${result.name} | ${status} | ${details} | ${response} | ${sha} |\n`;
  }

  return table;
}

async function main() {
  console.log("\n========================================");
  console.log("POST-DEPLOY VERIFICATIE");
  console.log("========================================\n");

  const [git, ci, ...appHealths] = await Promise.all([
    checkGitStatus(),
    checkCIStatus(),
    ...APPS.map(checkHealth),
  ]);

  console.log(`📍 Lokale Git SHA: ${git.currentSha}`);
  console.log(`📍 Lokale working tree: ${git.isClean ? "schoon" : "⚠️ ONCLEAN"}`);
  console.log(`📍 CI status: ${ci.status}${ci.runId ? ` (run: ${ci.runId})` : ""}\n`);

  console.log("Productie-endpoints:\n");
  console.log(formatTable(appHealths));

  const statuses = appHealths.map((r) => r.status);
  const groen = statuses.filter((s) => s === "GROEN").length;
  const oranje = statuses.filter((s) => s === "ORANJE").length;
  const rood = statuses.filter((s) => s === "ROOD").length;

  console.log(`\nTotaal: ${groen}/${APPS.length} GROEN, ${oranje} ORANJE, ${rood} ROOD\n`);

  // Exit code: 0 als alles groen, 1 als oranje/rood
  const hasIssues = oranje > 0 || rood > 0;
  process.exit(hasIssues ? 1 : 0);
}

main().catch((error) => {
  console.error("Verificatiescript fout:", error);
  process.exit(2);
});
