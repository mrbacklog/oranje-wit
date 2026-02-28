import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const scenario = await prisma.scenario.findUnique({
    where: { id },
    select: {
      versies: {
        select: {
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

  const teams = scenario?.versies[0]?.teams ?? [];

  return Response.json({ teams });
}
