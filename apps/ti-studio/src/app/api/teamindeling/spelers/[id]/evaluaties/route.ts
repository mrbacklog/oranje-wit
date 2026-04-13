import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { guardAuth } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { EvaluatieScore, TeamGemiddelde } from "@oranje-wit/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const evaluaties = await prisma.evaluatie.findMany({
      where: { spelerId: id, type: "trainer" },
      orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
      select: {
        seizoen: true,
        ronde: true,
        type: true,
        scores: true,
        opmerking: true,
        coach: true,
        teamNaam: true,
      },
    });

    const result = evaluaties.map((e) => ({
      seizoen: e.seizoen,
      ronde: e.ronde,
      type: e.type,
      scores: (e.scores ?? {}) as EvaluatieScore,
      opmerking: e.opmerking,
      coach: e.coach,
      teamNaam: e.teamNaam,
    }));

    let teamVergelijking: TeamGemiddelde | null = null;

    if (teamId) {
      const teamSpelers = await prisma.teamSpeler.findMany({
        where: { teamId },
        select: { spelerId: true },
      });

      const spelerIds = teamSpelers.map((ts) => ts.spelerId);

      if (spelerIds.length > 0) {
        const teamEvaluaties = await prisma.evaluatie.findMany({
          where: { spelerId: { in: spelerIds }, type: "trainer" },
          orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
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

    return NextResponse.json({ ok: true, data: { evaluaties: result, teamVergelijking } });
  } catch (error) {
    logger.warn("api/teamindeling/spelers/[id]/evaluaties:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
