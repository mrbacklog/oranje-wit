import { NextResponse } from "next/server";
import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

const DB_TIMEOUT_MS = 3000;

async function checkDatabase(): Promise<{
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout na 3s")), DB_TIMEOUT_MS)
      ),
    ]);
    return { status: "ok", latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Scouting health check database fout:", message);
    return {
      status: "error",
      latencyMs: Math.round(performance.now() - start),
      error: message,
    };
  }
}

export async function GET() {
  const db = await checkDatabase();
  const isHealthy = db.status === "ok";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      app: "scouting",
      version: process.env.RAILWAY_GIT_COMMIT_SHA || "dev",
      timestamp: new Date().toISOString(),
      checks: {
        database: db,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
