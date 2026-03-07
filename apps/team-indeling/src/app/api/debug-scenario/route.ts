import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: "cmmf0vr4600010fpeqbsma61g" },
      include: {
        versies: {
          include: {
            selectieGroepen: {
              include: {
                spelers: { select: { id: true, spelerId: true } },
                staf: { select: { id: true, stafId: true } },
              },
            },
            teams: {
              select: {
                id: true,
                naam: true,
                selectieGroepId: true,
                _count: { select: { spelers: true, staf: true } },
              },
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

    return NextResponse.json({
      scenario: scenario.naam,
      versie: v.id,
      teamsCount: v.teams.length,
      selectieGroepenCount: v.selectieGroepen.length,
      selectieGroepen: v.selectieGroepen.map((sg) => ({
        id: sg.id,
        naam: sg.naam,
        spelersCount: sg.spelers.length,
        stafCount: sg.staf.length,
      })),
      teams: v.teams.map((t) => ({
        naam: t.naam,
        selectieGroepId: t.selectieGroepId,
        spelers: t._count.spelers,
        staf: t._count.staf,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
