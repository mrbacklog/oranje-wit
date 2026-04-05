import { NextResponse } from "next/server";
import { prisma } from "@/lib/teamindeling/db/prisma";

/**
 * Test-only API: Reset alle werkindelingen naar inactief
 * Gebruikt in E2E tests voor isolatie tussen tests
 *
 * Alleen actief in development/test omgeving
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const result = await prisma.werkindeling.updateMany({
      where: {},
      data: { verwijderdOp: new Date() },
    });

    return NextResponse.json({
      ok: true,
      count: result.count,
      message: `Reset ${result.count} werkindelingen`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error during reset",
      },
      { status: 500 }
    );
  }
}
