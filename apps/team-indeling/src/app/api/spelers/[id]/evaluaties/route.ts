import { prisma } from "@/lib/db/prisma";
import type { EvaluatieScore, TeamGemiddelde } from "@/components/scenario/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  // Haal evaluaties op voor deze speler (laatste 3, nieuwste eerst)
  const evaluaties = await prisma.evaluatie.findMany({
    where: { spelerId: id },
    orderBy: { seizoen: "desc" },
    take: 3,
    select: {
      seizoen: true,
      scores: true,
      opmerking: true,
      coach: true,
    },
  });

  const result = evaluaties.map((e) => ({
    seizoen: e.seizoen,
    scores: (e.scores ?? {}) as EvaluatieScore,
    opmerking: e.opmerking,
    coach: e.coach,
  }));

  // Team-vergelijking: bereken gemiddelden van teamgenoten
  let teamVergelijking: TeamGemiddelde | null = null;

  if (teamId) {
    const teamSpelers = await prisma.teamSpeler.findMany({
      where: { teamId },
      select: { spelerId: true },
    });

    const spelerIds = teamSpelers.map((ts) => ts.spelerId);

    if (spelerIds.length > 0) {
      // Haal meest recente evaluatie per teamgenoot
      const teamEvaluaties = await prisma.evaluatie.findMany({
        where: { spelerId: { in: spelerIds } },
        orderBy: { seizoen: "desc" },
        distinct: ["spelerId"],
        select: { scores: true },
      });

      let totaalNiveau = 0;
      let totaalInzet = 0;
      let totaalGroei = 0;
      let count = 0;

      for (const ev of teamEvaluaties) {
        const scores = (ev.scores ?? {}) as EvaluatieScore;
        if (scores.niveau != null || scores.inzet != null || scores.groei != null) {
          totaalNiveau += scores.niveau ?? 0;
          totaalInzet += scores.inzet ?? 0;
          totaalGroei += scores.groei ?? 0;
          count++;
        }
      }

      if (count > 0) {
        teamVergelijking = {
          niveau: Math.round((totaalNiveau / count) * 100) / 100,
          inzet: Math.round((totaalInzet / count) * 100) / 100,
          groei: Math.round((totaalGroei / count) * 100) / 100,
          aantalSpelers: count,
        };
      }
    }
  }

  return Response.json({ evaluaties: result, teamVergelijking });
}
