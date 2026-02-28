import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = parseInt(id, 10);
  if (isNaN(teamId)) {
    return NextResponse.json({ error: "Ongeldig team ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const naam = typeof body.naam === "string" ? body.naam.trim() : null;

    const updated = await prisma.oWTeam.update({
      where: { id: teamId },
      data: { naam: naam || null },
    });

    return NextResponse.json({ id: updated.id, naam: updated.naam });
  } catch (error) {
    console.error("PATCH /api/teams/[id]/naam error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
