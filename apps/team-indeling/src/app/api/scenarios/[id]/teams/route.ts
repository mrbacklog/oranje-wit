import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const scenario = await prisma.scenario.findUnique({
      where: { id },
      select: {
        versies: {
          select: {
            selectieGroepen: {
              include: {
                spelers: { include: { speler: true } },
                staf: { include: { staf: true } },
              },
            },
            teams: {
              include: {
                spelers: { include: { speler: true } },
                staf: { include: { staf: true } },
              },
              orderBy: { volgorde: "asc" },
            },
          },
          orderBy: { nummer: "desc" },
          take: 1,
        },
      },
    });

    const versie = scenario?.versies[0];
    const teams = versie?.teams ?? [];
    const selectieGroepen = versie?.selectieGroepen ?? [];

    return ok({ teams, selectieGroepen });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`Teams ophalen mislukt: ${message}`);
  }
}
