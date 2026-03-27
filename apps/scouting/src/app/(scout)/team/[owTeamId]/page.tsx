import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { TeamScoutWizard } from "./team-scout-wizard";
import { bepaalLeeftijdsgroep } from "@/lib/scouting/leeftijdsgroep";
import { getScoutingConfigV3, getKernItems } from "@/lib/scouting/vragen";

interface PageProps {
  params: Promise<{ owTeamId: string }>;
}

export default async function TeamScoutPage({ params }: PageProps) {
  const { owTeamId } = await params;
  const teamId = parseInt(owTeamId, 10);

  if (isNaN(teamId)) {
    notFound();
  }

  const team = await (prisma.oWTeam as any).findUnique({
    where: { id: teamId },
    select: {
      id: true,
      naam: true,
      seizoen: true,
      kleur: true,
      leeftijdsgroep: true,
    },
  });

  if (!team) {
    notFound();
  }

  const aliases = await prisma.teamAlias.findMany({
    where: { owTeamId: team.id },
    select: { alias: true },
  });

  const teamNamen = [team.naam, ...aliases.map((a) => a.alias)].filter(Boolean) as string[];

  const competitieSpelers = await prisma.competitieSpeler.findMany({
    where: {
      seizoen: team.seizoen,
      team: { in: teamNamen },
    },
    select: { relCode: true },
    distinct: ["relCode"],
  });

  const relCodes = competitieSpelers.map((cs) => cs.relCode);

  const spelers = (await (prisma.speler as any).findMany({
    where: { id: { in: relCodes } },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      huidig: true,
    },
    orderBy: { roepnaam: "asc" },
  })) as Array<{
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string;
    huidig: unknown;
  }>;

  if (spelers.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-xl font-bold">Geen spelers gevonden</h1>
        <p className="text-text-secondary text-sm">
          Team {team.naam} heeft geen geregistreerde spelers.
        </p>
      </div>
    );
  }

  const leeftijdsgroep = bepaalLeeftijdsgroep(spelers[0]);
  const config = getScoutingConfigV3(leeftijdsgroep);
  const kernItems = getKernItems(leeftijdsgroep);

  const fotos = await prisma.lidFoto.findMany({
    where: { relCode: { in: relCodes } },
    select: { relCode: true },
  });
  const fotoSet = new Set(fotos.map((f) => f.relCode));

  const spelersVoorWizard = spelers.map((s) => ({
    id: s.id,
    roepnaam: s.roepnaam,
    achternaam: s.achternaam,
    geboortejaar: s.geboortejaar,
    heeftFoto: fotoSet.has(s.id),
  }));

  return (
    <TeamScoutWizard
      team={{
        id: team.id,
        naam: team.naam ?? "Onbekend",
        kleur: team.kleur,
        leeftijdsgroep: team.leeftijdsgroep,
      }}
      spelers={spelersVoorWizard}
      leeftijdsgroep={leeftijdsgroep}
      config={config}
      kernItems={kernItems}
    />
  );
}
