import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      app: "ti-studio-v2",
      version: process.env.RAILWAY_GIT_COMMIT_SHA || "dev",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
