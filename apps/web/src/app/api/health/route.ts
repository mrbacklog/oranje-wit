import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "oranje-wit",
    timestamp: new Date().toISOString(),
  });
}
