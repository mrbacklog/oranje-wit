export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import {
  WerkindelingView,
  type WerkTeamItem,
} from "@/components/teamindeling/mobile/werkindeling/WerkindelingView";

/** TeamType-gebaseerde teamgrootte target */
function getTarget(teamType: string | null): number {
  if (teamType === "VIERTAL") return 6;
  if (teamType === "ACHTTAL") return 10;
  return 12;
}

/** Map Team.kleur enum naar kleur-string voor de UI */
function mapKleur(kleur: string | null): string | null {
  // kleur is al een uppercase enum-waarde (BLAUW, GROEN, etc.) of null
  return kleur ?? null;
}

export default async function ScenariosOverview() {
  const seizoen = await getActiefSeizoen();

  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  const werkindelingId = blauwdruk ? await getWerkindelingId(blauwdruk.id) : null;
  const werkindeling = werkindelingId
    ? await prisma.werkindeling.findUnique({
        where: { id: werkindelingId, verwijderdOp: null },
        select: {
          naam: true,
          status: true,
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
                  teamType: true,
                  _count: { select: { spelers: true } },
                },
              },
            },
          },
        },
      })
    : null;

  if (!werkindeling) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Werkindeling
        </h1>
        <p style={{ color: "var(--text-tertiary)" }}>
          Nog geen werkindeling voor seizoen {seizoen}.
        </p>
      </div>
    );
  }

  const versieTeams = werkindeling.versies[0]?.teams ?? [];

  const teams: WerkTeamItem[] = versieTeams.map((team: any) => ({
    id: team.id,
    naam: team.naam,
    categorie: team.categorie,
    kleur: mapKleur(team.kleur),
    spelersCount: team._count.spelers,
    target: getTarget(team.teamType),
  }));

  return (
    <WerkindelingView
      naam={werkindeling.naam}
      status={werkindeling.status}
      seizoen={seizoen}
      teams={teams}
    />
  );
}
