import { redirect } from "next/navigation";
import { auth } from "@oranje-wit/auth";
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { AdminDashboard } from "@/components/evaluatie/admin-dashboard";
import { CoordinatorDashboard } from "@/components/evaluatie/coordinator-dashboard";
import { EvaluatieLanding } from "@/components/evaluatie/evaluatie-landing";

type PrismaFn = (...args: any[]) => any;

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function EvaluatiePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (token) {
    const uitnodiging = await (prisma.evaluatieUitnodiging.findUnique as PrismaFn)({
      where: { token },
      select: { type: true },
    });

    if (uitnodiging) {
      const type = uitnodiging.type as string;
      if (type === "trainer") redirect(`/evaluatie/invullen?token=${token}`);
      if (type === "zelf") redirect(`/evaluatie/zelf?token=${token}`);
      if (type === "coordinator") redirect(`/evaluatie/coordinator?token=${token}`);
    }
  }

  const session = await auth();

  if (!session?.user) {
    return <EvaluatieLanding />;
  }

  const user = session.user as unknown as Record<string, unknown>;
  const isTC = user.isTC === true;
  const email = (user.email as string) ?? "";

  if (isTC) {
    const rondes = await (prisma.evaluatieRonde.findMany as PrismaFn)({
      orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
      include: {
        _count: {
          select: {
            uitnodigingen: true,
            evaluaties: true,
          },
        },
      },
    });

    const ingediendTotaal = await (prisma.evaluatie.count as PrismaFn)({
      where: { status: "ingediend" },
    });

    const openstaand = await (prisma.evaluatieUitnodiging.count as PrismaFn)({});

    return (
      <AdminDashboard
        rondes={JSON.parse(JSON.stringify(rondes))}
        totaalIngediend={ingediendTotaal as number}
        totaalUitnodigingen={openstaand as number}
      />
    );
  }

  const coordTeams = await (prisma.coordinatorTeam.findMany as PrismaFn)({
    where: {
      coordinator: { email },
      seizoen: HUIDIG_SEIZOEN,
    },
    include: {
      coordinator: { select: { naam: true } },
      owTeam: { select: { id: true, naam: true, categorie: true } },
    },
  });

  const teams = coordTeams as Array<{
    id: string;
    owTeam: { id: number; naam: string | null; categorie: string | null };
    coordinator: { naam: string };
  }>;

  if (teams.length === 0) {
    return <EvaluatieLanding ingelogd bericht="Je hebt geen toegewezen teams voor dit seizoen." />;
  }

  const actieveRondes = await (prisma.evaluatieRonde.findMany as PrismaFn)({
    where: { seizoen: HUIDIG_SEIZOEN, status: "actief" },
    orderBy: { ronde: "asc" },
  });

  const rondes = actieveRondes as Array<{
    id: string;
    naam: string;
    ronde: number;
    deadline: Date;
    status: string;
  }>;

  const teamStats = await Promise.all(
    teams.map(async (ct) => {
      const perRonde = await Promise.all(
        rondes.map(async (ronde) => {
          const [ingediend, uitnodigingen] = await Promise.all([
            (prisma.evaluatie.count as PrismaFn)({
              where: {
                rondeId: ronde.id,
                teamNaam: ct.owTeam.naam,
                status: "ingediend",
              },
            }),
            (prisma.evaluatieUitnodiging.count as PrismaFn)({
              where: {
                rondeId: ronde.id,
                owTeamId: ct.owTeam.id,
                type: "trainer",
              },
            }),
          ]);
          return {
            rondeId: ronde.id,
            rondeNaam: ronde.naam,
            deadline: ronde.deadline.toISOString(),
            ingediend: ingediend as number,
            uitnodigingen: uitnodigingen as number,
          };
        })
      );
      return {
        teamId: ct.owTeam.id,
        teamNaam: ct.owTeam.naam ?? "Onbekend team",
        categorie: ct.owTeam.categorie ?? "",
        rondes: perRonde,
      };
    })
  );

  const coordinatorNaam = teams[0]?.coordinator?.naam ?? "";

  return <CoordinatorDashboard naam={coordinatorNaam} teams={teamStats} />;
}
