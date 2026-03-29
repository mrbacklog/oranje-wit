export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import {
  TeamsOverzicht,
  type TeamItem,
} from "@/components/teamindeling/mobile/teams/TeamsOverzicht";

export default async function TeamsPage() {
  const seizoen = await getActiefSeizoen();

  // Haal werkindeling op (scenario met isWerkindeling=true) voor spelerscounts
  const werkindeling = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdruk: { seizoen } },
    },
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
  });

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
