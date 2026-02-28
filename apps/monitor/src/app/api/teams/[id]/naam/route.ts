import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const teamId = parseInt(id, 10);
  if (isNaN(teamId)) {
    return fail("Ongeldig team ID", 400, "BAD_REQUEST");
  }

  try {
    const body = await request.json();
    const naam = typeof body.naam === "string" ? body.naam.trim() : null;

    const updated = await prisma.oWTeam.update({
      where: { id: teamId },
      data: { naam: naam || null },
    });

    return ok({ id: updated.id, naam: updated.naam });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`Team naam bijwerken mislukt: ${message}`);
  }
}
