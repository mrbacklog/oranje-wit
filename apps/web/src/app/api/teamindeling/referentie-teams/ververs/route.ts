import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { parseBody } from "@/lib/teamindeling/api/validate";

const Schema = z.object({
  seizoen: z.string().regex(/^\d{4}-\d{4}$/),
  scoreKeuzes: z.record(z.enum(["behoud", "reset"])),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;

    const { seizoen, scoreKeuzes } = parsed.data;

    // Reset teamscores voor teams waar "reset" is gekozen
    const teResettenIds = Object.entries(scoreKeuzes)
      .filter(([, keuze]) => keuze === "reset")
      .map(([id]) => id);

    if (teResettenIds.length > 0) {
      await prisma.referentieTeam.updateMany({
        where: { id: { in: teResettenIds } },
        data: { teamscore: null },
      });
    }

    // Haal bijgewerkte teams op
    const teams = await prisma.referentieTeam.findMany({
      where: { seizoen },
      select: {
        id: true,
        naam: true,
        seizoen: true,
        teamType: true,
        niveau: true,
        poolVeld: true,
        teamscore: true,
        spelerIds: true,
      },
      orderBy: { naam: "asc" },
    });

    return ok({ teams });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
