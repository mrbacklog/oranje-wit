import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;

    const ronde = await prisma.evaluatieRonde.findUnique({
      where: { id },
      select: { seizoen: true },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");

    // Teams voor dit seizoen
    const teams = await prisma.oWTeam.findMany({
      where: { seizoen: ronde.seizoen },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        naam: true,
        categorie: true,
        kleur: true,
        spelvorm: true,
      },
    });

    // Spelers per team (uit competitie_spelers, actueel seizoen)
    const spelers = await prisma.competitieSpeler.findMany({
      where: { seizoen: ronde.seizoen },
      select: {
        relCode: true,
        team: true,
        geslacht: true,
        lid: {
          select: {
            roepnaam: true,
            tussenvoegsel: true,
            achternaam: true,
            email: true,
          },
        },
      },
    });

    // Groepeer spelers per team
    const spelersPerTeam = new Map<string, typeof spelers>();
    for (const s of spelers) {
      const lijst = spelersPerTeam.get(s.team) ?? [];
      lijst.push(s);
      spelersPerTeam.set(s.team, lijst);
    }

    const result = teams.map((team) => ({
      ...team,
      spelers: (spelersPerTeam.get(team.naam ?? "") ?? []).map((s) => ({
        relCode: s.relCode,
        naam: s.lid
          ? `${s.lid.roepnaam} ${s.lid.tussenvoegsel ? s.lid.tussenvoegsel + " " : ""}${s.lid.achternaam}`
          : s.relCode,
        geslacht: s.geslacht,
        email: s.lid?.email,
      })),
    }));

    return ok({ teams: result });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
