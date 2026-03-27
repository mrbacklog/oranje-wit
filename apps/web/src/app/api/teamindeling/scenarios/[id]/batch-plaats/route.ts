import { prisma, anyTeam } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { z } from "zod";
import { logger } from "@oranje-wit/types";

const FilterSchema = z.object({
  teamNaam: z.string().min(1),
  filter: z
    .object({
      huidigTeam: z.string().optional(),
      huidigKleur: z.string().optional(),
      geslacht: z.enum(["M", "V"]).optional(),
      geboortejaarVan: z.number().optional(),
      geboortejaarTot: z.number().optional(),
      spelerIds: z.array(z.string()).optional(),
      status: z.string().optional(),
    })
    .optional(),
  dryRun: z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scenarioId } = await params;
    const body = await request.json();
    const parsed = FilterSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        `Ongeldige input: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const { teamNaam, filter, dryRun } = parsed.data;

    // Zoek scenario + laatste versie + teams
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: {
        status: true,
        versies: {
          orderBy: { nummer: "desc" as const },
          take: 1,
          select: {
            id: true,
            teams: {
              select: {
                id: true,
                naam: true,
                spelers: { select: { spelerId: true } },
              },
            },
          },
        },
      },
    });

    if (!scenario) return fail("Scenario niet gevonden", 404, "NOT_FOUND");
    if (scenario.status !== "ACTIEF") return fail("Scenario is niet actief", 400, "NOT_ACTIVE");

    const versie = scenario.versies[0];
    if (!versie) return fail("Geen versie gevonden", 404, "NOT_FOUND");

    // Zoek doelteam (case-insensitive)
    const doelTeam = versie.teams.find(
      (t: { naam: string }) => t.naam.toLowerCase() === teamNaam.toLowerCase()
    );
    if (!doelTeam)
      return fail(
        `Team "${teamNaam}" niet gevonden. Beschikbaar: ${versie.teams.map((t: { naam: string }) => t.naam).join(", ")}`,
        404,
        "TEAM_NOT_FOUND"
      );

    // Check of doelteam in een selectie zit
    const doelTeamData = (await anyTeam.findUniqueOrThrow({
      where: { id: doelTeam.id },
      select: { selectieGroepId: true },
    })) as { selectieGroepId: string | null };

    // Verzamel alle al-ingedeelde speler-IDs in dit scenario (TeamSpeler + SelectieSpeler)
    const alIngedeeld = new Set<string>();
    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        alIngedeeld.add(ts.spelerId);
      }
    }

    const selectieIngedeeld = await prisma.selectieSpeler.findMany({
      where: { selectieGroep: { versieId: versie.id } },
      select: { spelerId: true },
    });
    for (const ss of selectieIngedeeld) {
      alIngedeeld.add(ss.spelerId);
    }

    // Bouw speler-query op basis van filters
    const where: Record<string, unknown> = {};
    if (filter?.geslacht) where.geslacht = filter.geslacht;
    if (filter?.status) where.status = filter.status;
    if (filter?.geboortejaarVan || filter?.geboortejaarTot) {
      where.geboortejaar = {
        ...(filter.geboortejaarVan ? { gte: filter.geboortejaarVan } : {}),
        ...(filter.geboortejaarTot ? { lte: filter.geboortejaarTot } : {}),
      };
    }
    if (filter?.spelerIds) where.id = { in: filter.spelerIds };

    const spelers = await prisma.speler.findMany({
      where,
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geslacht: true,
        huidig: true,
        status: true,
      },
      orderBy: [{ geboortejaar: "asc" }, { achternaam: "asc" }],
    });

    // Filter op huidig team/kleur (JSON veld)
    let gefilterd = spelers;
    if (filter?.huidigTeam) {
      const zoekTeam = filter.huidigTeam.toLowerCase();
      gefilterd = gefilterd.filter((s: { huidig: unknown }) => {
        const h = s.huidig as { team?: string } | null;
        return h?.team?.toLowerCase().includes(zoekTeam);
      });
    }
    if (filter?.huidigKleur) {
      const zoekKleur = filter.huidigKleur.toUpperCase();
      gefilterd = gefilterd.filter((s: { huidig: unknown }) => {
        const h = s.huidig as { kleur?: string } | null;
        return h?.kleur?.toUpperCase() === zoekKleur;
      });
    }

    // Filter al-ingedeelde spelers eruit
    const tePlaatsen = gefilterd.filter((s: { id: string }) => !alIngedeeld.has(s.id));

    const resultaat = tePlaatsen.map(
      (s: {
        id: string;
        roepnaam: string;
        achternaam: string;
        geboortejaar: number;
        geslacht: string;
        huidig: unknown;
      }) => {
        const h = s.huidig as { team?: string } | null;
        return {
          id: s.id,
          naam: `${s.roepnaam} ${s.achternaam}`,
          geboortejaar: s.geboortejaar,
          geslacht: s.geslacht,
          huidigTeam: h?.team ?? null,
        };
      }
    );

    if (dryRun) {
      return ok({
        dryRun: true,
        teamNaam: doelTeam.naam,
        aantalGevonden: resultaat.length,
        spelers: resultaat,
      });
    }

    // Daadwerkelijk plaatsen - kies juiste tabel
    if (tePlaatsen.length > 0) {
      if (doelTeamData.selectieGroepId) {
        await prisma.selectieSpeler.createMany({
          data: tePlaatsen.map((s: { id: string }) => ({
            selectieGroepId: doelTeamData.selectieGroepId!,
            spelerId: s.id,
          })),
          skipDuplicates: true,
        });
      } else {
        await prisma.teamSpeler.createMany({
          data: tePlaatsen.map((s: { id: string }) => ({
            teamId: doelTeam.id,
            spelerId: s.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    logger.info(`Batch-plaats: ${tePlaatsen.length} spelers → ${doelTeam.naam}`);

    return ok({
      teamNaam: doelTeam.naam,
      aantalGeplaatst: tePlaatsen.length,
      spelers: resultaat,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`Batch-plaatsing mislukt: ${message}`);
  }
}
