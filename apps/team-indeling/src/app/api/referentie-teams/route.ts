import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/api/response";
import { getActiefSeizoen } from "@/lib/seizoen";

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
