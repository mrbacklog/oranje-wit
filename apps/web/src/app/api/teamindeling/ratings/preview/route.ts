import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { parseBody } from "@/lib/teamindeling/api/validate";
import { PEILJAAR } from "@oranje-wit/types";
import { berekenRating, haalLaatsteNiveau } from "@/lib/teamindeling/rating";

const Schema = z.object({
  teamId: z.string().min(1),
  teamscore: z.number().int().min(0).max(200),
  seizoen: z.string().regex(/^\d{4}-\d{4}$/),
  ronde: z.number().int().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;

    const { teamId, teamscore, seizoen, ronde } = parsed.data;

    const refTeam = await prisma.referentieTeam.findUnique({
      where: { id: teamId },
      select: { spelerIds: true },
    });
    if (!refTeam) return fail("ReferentieTeam niet gevonden", 404, "NOT_FOUND");

    const spelers = await prisma.speler.findMany({
      where: { id: { in: refTeam.spelerIds } },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        rating: true,
        ratingBerekend: true,
      },
    });

    // Rankings alleen voor spelers met korfballeeftijd < 20
    const jeugdSpelers = spelers.filter((s) => PEILJAAR - s.geboortejaar < 20);

    const previews = await Promise.all(
      jeugdSpelers.map(async (speler) => {
        const niveau = await haalLaatsteNiveau(speler.id, seizoen, prisma, ronde);
        const nieuweRating = berekenRating(teamscore, niveau);
        const huidigeRating = speler.rating;

        let verschilPct: number | null = null;
        if (huidigeRating != null && huidigeRating > 0) {
          verschilPct = Math.round(((nieuweRating - huidigeRating) / huidigeRating) * 1000) / 10;
        }

        return {
          spelerId: speler.id,
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          niveau: niveau ?? null,
          huidigeRating,
          nieuweRating,
          verschilPct,
        };
      })
    );

    // Sorteer op achternaam
    previews.sort((a, b) => a.achternaam.localeCompare(b.achternaam));

    return ok({ spelers: previews });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
