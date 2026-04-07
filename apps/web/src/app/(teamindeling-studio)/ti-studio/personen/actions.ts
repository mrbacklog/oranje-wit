"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";

export async function getSpelersVoorStudio() {
  await requireTC();

  // Haal actief werkseizoen kaders op
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });

  if (!kaders) return [];

  // Haal alle spelers parallel op
  const [kadersSpelers, spelers, werkindeling] = await Promise.all([
    prisma.kadersSpeler.findMany({
      where: { kadersId: kaders.id },
      select: {
        spelerId: true,
        gezienStatus: true,
        notitie: true,
      },
    }),

    prisma.speler.findMany({
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geslacht: true,
        status: true,
        huidig: true,
        spelerspad: true,
      },
      orderBy: [{ achternaam: "asc" }],
    }),

    prisma.werkindeling.findFirst({
      where: { kadersId: kaders.id, status: "ACTIEF" },
      select: {
        versies: {
          orderBy: { nummer: "desc" },
          take: 1,
          select: {
            teams: {
              select: {
                naam: true,
                kleur: true,
                spelers: {
                  select: { spelerId: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  // Bouw spelerId → huidig indelingsteam mapping
  const teamMapping = new Map<string, { naam: string; kleur: string | null }>();
  const versie = werkindeling?.versies?.[0];
  if (versie) {
    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        teamMapping.set(ts.spelerId, { naam: team.naam, kleur: team.kleur ?? null });
      }
    }
  }

  const gezienMap = new Map(kadersSpelers.map((ks) => [ks.spelerId, ks]));

  return spelers.map((s) => {
    const gezien = gezienMap.get(s.id);
    const huidigRecord = s.huidig as { team?: string; kleur?: string } | null;
    const spelerspad = s.spelerspad as Array<{
      seizoen: string;
      team: string;
      kleur?: string;
    }> | null;
    // index 0 = huidig seizoen, index 1 = vorig seizoen
    const vorigSeizoenEntry = spelerspad?.[1];

    return {
      id: s.id as string,
      roepnaam: s.roepnaam as string,
      achternaam: s.achternaam as string,
      geboortejaar: s.geboortejaar as number,
      geslacht: s.geslacht as "M" | "V",
      status: s.status as string,
      gezienStatus: (gezien?.gezienStatus ?? "ONGEZIEN") as
        | "ONGEZIEN"
        | "GROEN"
        | "GEEL"
        | "ORANJE"
        | "ROOD",
      notitie: (gezien?.notitie ?? null) as string | null,
      huidigTeamNaam: (huidigRecord?.team ?? null) as string | null,
      huidigTeamKleur: (huidigRecord?.kleur ?? null) as string | null,
      vorigTeamNaam: (vorigSeizoenEntry?.team ?? null) as string | null,
      vorigTeamKleur: (vorigSeizoenEntry?.kleur ?? null) as string | null,
      huidigIndelingTeam: (teamMapping.get(s.id) ?? null) as {
        naam: string;
        kleur: string | null;
      } | null,
    };
  });
}

export type StudioSpeler = Awaited<ReturnType<typeof getSpelersVoorStudio>>[number];
