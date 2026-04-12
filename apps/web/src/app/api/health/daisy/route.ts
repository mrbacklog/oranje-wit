// apps/web/src/app/api/health/daisy/route.ts
// Daisy-specifieke health check: AI-config + SSE-database verbinding.
// Geen auth vereist — publiek endpoint voor monitoring en CI smoke tests.
import { NextResponse } from "next/server";
import { logger } from "@oranje-wit/types";
import { Client } from "pg";

const TIMEOUT_MS = 3000;

async function checkAiConfig(): Promise<{ status: "ok" | "misconfigured"; error?: string }> {
  const heeftKey = !!(process.env.ANTHROPIC_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (!heeftKey) {
    return {
      status: "misconfigured",
      error:
        "Geen AI provider key geconfigureerd (ANTHROPIC_API_KEY of GOOGLE_GENERATIVE_AI_API_KEY)",
    };
  }
  return { status: "ok" };
}

async function checkSseVerbinding(): Promise<{
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  // Gebruik DATABASE_DIRECT_URL indien aanwezig — PgBouncer transaction-mode
  // ondersteunt LISTEN/NOTIFY niet.
  const connStr = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connStr,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Verbinding timeout na 3s")), TIMEOUT_MS)
      ),
    ]);
    await client.end();
    return { status: "ok", latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    logger.warn("health/daisy: SSE pg verbinding mislukt", error);
    return {
      status: "error",
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  const [ai, sse] = await Promise.all([checkAiConfig(), checkSseVerbinding()]);
  const isHealthy = ai.status === "ok" && sse.status === "ok";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      checks: { ai, sse },
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
