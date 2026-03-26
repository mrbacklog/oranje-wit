import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";

const TeamscoreSchema = z.object({
  teamscore: z.number().int().min(0).max(200),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parsed = await parseBody(request, TeamscoreSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const refTeam = await prisma.referentieTeam.update({
      where: { id },
      data: { teamscore: parsed.data.teamscore },
      select: { id: true, naam: true, teamscore: true },
    });
    return ok(refTeam);
  } catch {
    return fail(`ReferentieTeam ${id} niet gevonden`, 404, "NOT_FOUND");
  }
}
