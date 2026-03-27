import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok } from "@/lib/teamindeling/api/response";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export async function GET() {
  const seizoen = await getActiefSeizoen();

  const teams = await prisma.referentieTeam.findMany({
    where: { seizoen },
    select: {
      id: true,
      naam: true,
      seizoen: true,
      teamType: true,
      niveau: true,
      poolVeld: true,
      teamscore: true,
    },
    orderBy: { naam: "asc" },
  });

  return ok(teams);
}
