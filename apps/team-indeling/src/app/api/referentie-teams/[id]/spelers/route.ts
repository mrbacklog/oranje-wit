import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const refTeam = await prisma.referentieTeam.findUnique({
      where: { id },
      select: { spelerIds: true },
    });
    if (!refTeam) return fail("ReferentieTeam niet gevonden", 404, "NOT_FOUND");

    const spelers = await prisma.speler.findMany({
      where: { id: { in: refTeam.spelerIds } },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geslacht: true,
        geboortejaar: true,
        geboortedatum: true,
        rating: true,
        ratingBerekend: true,
        status: true,
        huidig: true,
      },
      orderBy: { achternaam: "asc" },
    });

    return ok({ spelers });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
