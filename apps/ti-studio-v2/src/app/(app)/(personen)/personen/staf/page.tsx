import { db as prisma } from "@/lib/db";
import { logger } from "@oranje-wit/types";
import { StafFilterbar } from "@/components/personen/staf/StafFilterbar";
import { StafTabel } from "@/components/personen/staf/StafTabel";
import type { StafRijData, MemoBadge } from "@/components/personen/types";

function bepaalMemoBadge(werkitems: Array<{ status: string; prioriteit: string }>): MemoBadge {
  if (werkitems.length === 0) return "geen";
  const item = werkitems[0];
  if (item.status === "OPGELOST") return "opgelost";
  if (item.status === "OPEN" && (item.prioriteit === "BLOCKER" || item.prioriteit === "HOOG")) {
    return "risico";
  }
  if (item.status === "IN_BESPREKING") return "bespreking";
  if (item.status === "OPEN") return "open";
  return "geen";
}

export default async function StafPage() {
  let stafleden: StafRijData[] = [];

  try {
    const raw = await prisma.staf.findMany({
      where: { actief: true },
      orderBy: { naam: "asc" },
      select: {
        id: true,
        naam: true,
        rollen: true,
        email: true,
        geboortejaar: true,
        teamStaf: {
          select: {
            rol: true,
            team: {
              select: { id: true, naam: true, kleur: true },
            },
          },
        },
        werkitems: {
          where: {
            type: "MEMO",
            status: { not: "OPGELOST" },
          },
          select: { id: true, status: true, prioriteit: true },
          take: 1,
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stafleden = raw.map((s: any) => ({
      id: s.id,
      naam: s.naam,
      rollen: s.rollen,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teamKoppelingen: s.teamStaf.map((ts: any) => ({
        teamId: ts.team.id,
        teamNaam: ts.team.naam,
        teamKleur: ts.team.kleur,
        rol: ts.rol,
      })),
      heeftOpenMemo: s.werkitems.length > 0,
      memoBadge: bepaalMemoBadge(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s.werkitems.map((w: any) => ({
          status: w.status as string,
          prioriteit: w.prioriteit as string,
        }))
      ),
      email: s.email,
      geboortejaar: s.geboortejaar,
    }));
  } catch (err) {
    logger.warn("StafPage: data ophalen mislukt:", err);
  }

  return (
    <div>
      <StafFilterbar />
      <StafTabel data={stafleden} />
    </div>
  );
}
