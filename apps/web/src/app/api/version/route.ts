import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * GET /api/version
 *
 * Retourneert build- en deployment-informatie:
 * - Git commit SHA (RAILWAY_GIT_COMMIT_SHA)
 * - Build timestamp
 * - Node environment
 *
 * Dit endpoint is openbaar (geen auth nodig) zodat DevOps
 * kan verifiëren dat de build die live staat de verwachte
 * versie draait.
 *
 * Voorbeeld response:
 * {
 *   "version": "a1b2c3d",
 *   "build": "2026-04-03T14:30:00Z",
 *   "env": "production",
 *   "app": "oranje-wit"
 * }
 */
export async function GET() {
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA || "dev";
  const buildTime = process.env.DEPLOYMENT_TIME || new Date().toISOString();
  const environment = process.env.NODE_ENV || "unknown";

  return NextResponse.json(
    {
      version: sha,
      build: buildTime,
      env: environment,
      app: "oranje-wit",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
