export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import {
  TeamsOverzicht,
  type TeamItem,
} from "@/components/teamindeling/mobile/teams/TeamsOverzicht";

export default async function TeamsPage() {
  const seizoen = await getActiefSeizoen();

  // Haal werkindeling op voor spelerscounts
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  const werkindelingId = blauwdruk ? await getWerkindelingId(blauwdruk.id) : null;
  const werkindeling = werkindelingId
    ? await prisma.werkindeling.findUnique({
        where: { id: werkindelingId },
        select: {
          versies: {
            orderBy: { nummer: "desc" },
            take: 1,
            select: {
              teams: {
                select: {
                  naam: true,
                  kleur: true,
                  categorie: true,
                  _count: { select: { spelers: true } },
                },
              },
            },
          },
        },
      })
    : null;

  // Maak een lookup: teamnaam -> spelercount uit werkindeling
  const werkindelingCounts = new Map<string, number>();
  if (werkindeling?.versies[0]) {
    for (const team of werkindeling.versies[0].teams) {
      werkindelingCounts.set(team.naam.toLowerCase(), team._count.spelers);
    }
  }

  // Haal OWTeams op voor het seizoen
  const owTeams = await prisma.oWTeam.findMany({
    where: { seizoen },
    orderBy: { sortOrder: "asc" },
  });

  // Staftoewijzingen per team voor later gebruik
  const teams: TeamItem[] = owTeams.map((team) => ({
    id: team.id,
    naam: team.naam,
    owCode: team.owCode,
    categorie: team.categorie,
    kleur: team.kleur?.toUpperCase() ?? null,
    leeftijdsgroep: team.leeftijdsgroep,
    spelvorm: team.spelvorm,
    spelersCount: werkindelingCounts.get((team.naam ?? team.owCode).toLowerCase()) ?? 0,
  }));

  return <TeamsOverzicht teams={teams} seizoen={seizoen} />;
}
