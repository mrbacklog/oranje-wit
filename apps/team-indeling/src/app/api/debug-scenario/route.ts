import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const groepen = await prisma.selectieGroep.findMany({
      where: { versie: { scenarioId: "cmmf0vr4600010fpeqbsma61g" } },
      include: {
        _count: { select: { spelers: true, staf: true, teams: true } },
      },
    });

    const teams = await prisma.team.findMany({
      where: { versie: { scenarioId: "cmmf0vr4600010fpeqbsma61g" } },
      select: {
        naam: true,
        selectieGroepId: true,
        _count: { select: { spelers: true } },
      },
      orderBy: { volgorde: "asc" },
    });

    return NextResponse.json({
      selectieGroepen: groepen.map((sg) => ({
        id: sg.id,
        naam: sg.naam,
        spelers: sg._count.spelers,
        staf: sg._count.staf,
        teams: sg._count.teams,
      })),
      teams: teams.map((t) => ({
        naam: t.naam,
        selectieGroepId: t.selectieGroepId,
        spelers: t._count.spelers,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
