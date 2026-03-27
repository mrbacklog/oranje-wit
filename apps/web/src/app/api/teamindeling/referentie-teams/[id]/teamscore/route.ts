import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { parseBody } from "@/lib/teamindeling/api/validate";
import { guardTC } from "@oranje-wit/auth/checks";

const TeamscoreSchema = z.object({
  teamscore: z.number().int().min(0).max(200),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

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
