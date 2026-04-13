export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@oranje-wit/teamindeling-shared/seizoen";
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import {
  MobileDashboard,
  type WerkindelingData,
  type MijnTeamItem,
} from "@/components/teamindeling/mobile/dashboard/MobileDashboard";

/** Spelvorm-gebaseerde teamgrootte target */
function getTarget(spelvorm: string | null): number {
  const s = (spelvorm ?? "").toLowerCase();
  if (s.includes("viertal") || s.includes("4-tal")) return 6;
  if (s.includes("zestal") || s.includes("6-tal")) return 8;
  if (s.includes("achtal") || s.includes("8-tal")) return 10;
  return 12;
}

export default async function TeamIndelingMobileDashboard() {
  const seizoen = await getActiefSeizoen();

  const blauwdruk = await prisma.kaders.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  const werkindelingId = blauwdruk ? await getWerkindelingId(blauwdruk.id) : null;
  const werkindeling = werkindelingId
    ? await prisma.werkindeling.findUnique({
        where: { id: werkindelingId },
        select: {
          naam: true,
          status: true,
          updatedAt: true,
          versies: {
            orderBy: { nummer: "desc" },
            take: 1,
            select: {
              teams: {
                orderBy: { volgorde: "asc" },
                select: {
                  id: true,
                  naam: true,
                  categorie: true,
                  kleur: true,
                  _count: { select: { spelers: true } },
                },
              },
            },
          },
        },
      })
    : null;

  // Haal OWTeams op voor "Mijn teams" sectie
  const owTeams = await prisma.oWTeam.findMany({
    where: { seizoen },
    orderBy: { sortOrder: "asc" },
  });

  // Bouw werkindeling-data
  const teams = werkindeling?.versies?.[0]?.teams ?? [];
  const werkindelingData: WerkindelingData | null = werkindeling
    ? {
        naam: werkindeling.naam,
        status: werkindeling.status,
        updatedAt: werkindeling.updatedAt.toISOString(),
        teamCount: teams.length,
        spelerCount: teams.reduce(
          (sum: number, t: { _count: { spelers: number } }) => sum + t._count.spelers,
          0
        ),
      }
    : null;

  // Bouw "Mijn teams" — map werkindelingcounts op OWTeams
  const werkindelingCounts = new Map<string, number>();
  for (const team of teams) {
    werkindelingCounts.set(team.naam.toLowerCase(), team._count.spelers);
  }

  const mijnTeams: MijnTeamItem[] = owTeams.map((owTeam) => {
    const teamNaam = owTeam.naam ?? owTeam.owCode;
    return {
      id: owTeam.id,
      naam: teamNaam,
      kleur: owTeam.kleur?.toUpperCase() ?? null,
      spelersCount: werkindelingCounts.get(teamNaam.toLowerCase()) ?? 0,
      target: getTarget(owTeam.spelvorm),
    };
  });

  return (
    <MobileDashboard seizoen={seizoen} werkindeling={werkindelingData} mijnTeams={mijnTeams} />
  );
}
