import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: "cmmf0vr4600010fpeqbsma61g" },
      include: {
        versies: {
          include: {
            selectieGroepen: true,
            teams: {
              select: { id: true, naam: true, selectieGroepId: true },
              orderBy: { volgorde: "asc" },
            },
          },
          orderBy: { nummer: "desc" },
        },
      },
    });

    if (!scenario) return NextResponse.json({ error: "not found" }, { status: 404 });

    const v = scenario.versies[0];
    if (!v) return NextResponse.json({ error: "no versie" }, { status: 404 });

    // Haal speler counts apart op
    const sgIds = v.selectieGroepen.map((sg) => sg.id);
    const spelerCounts = await prisma.selectieSpeler.groupBy({
      by: ["selectieGroepId"],
      where: { selectieGroepId: { in: sgIds } },
      _count: true,
    });
    const countMap = new Map(spelerCounts.map((c) => [c.selectieGroepId, c._count]));

    return NextResponse.json({
      scenario: scenario.naam,
      versie: v.id,
      teamsCount: v.teams.length,
      selectieGroepenCount: v.selectieGroepen.length,
      selectieGroepen: v.selectieGroepen.map((sg) => ({
        id: sg.id,
        naam: sg.naam,
        spelersCount: countMap.get(sg.id) ?? 0,
      })),
      teams: v.teams.map((t) => ({
        naam: t.naam,
        selectieGroepId: t.selectieGroepId,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
