import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { ok, fail } from "@/lib/api/response";
import { requireEditor } from "@oranje-wit/auth/checks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;

    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.findUnique as PrismaFn)({
      where: { id },
      select: { seizoen: true },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");

    // Teams voor dit seizoen
    // Prisma 7 type recursie workaround (TS2321)
    const teams = await (prisma.oWTeam.findMany as PrismaFn)({
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
    // Prisma 7 type recursie workaround (TS2321)
    const spelers = await (prisma.competitieSpeler.findMany as PrismaFn)({
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

    const result = teams.map(
      (team: {
        id: number;
        naam: string | null;
        categorie: string | null;
        kleur: string | null;
        spelvorm: string | null;
      }) => ({
        ...team,
        spelers: (spelersPerTeam.get(team.naam ?? "") ?? []).map(
          (s: {
            relCode: string;
            team: string;
            geslacht: string | null;
            lid: {
              roepnaam: string;
              tussenvoegsel: string | null;
              achternaam: string;
              email: string | null;
            } | null;
          }) => ({
            relCode: s.relCode,
            naam: s.lid
              ? `${s.lid.roepnaam} ${s.lid.tussenvoegsel ? s.lid.tussenvoegsel + " " : ""}${s.lid.achternaam}`
              : s.relCode,
            geslacht: s.geslacht,
            email: s.lid?.email,
          })
        ),
      })
    );

    return ok({ teams: result });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
