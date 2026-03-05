import { valideerToken } from "@/lib/tokens";
import { prisma } from "@/lib/db/prisma";
import CoordinatorTeamView from "@/components/CoordinatorTeamView";

export default async function CoordinatorTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ rondeId: string; teamId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ rondeId, teamId }, { token }] = await Promise.all([params, searchParams]);

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Geen geldige link.</p>
      </main>
    );
  }

  const uitnodiging = await valideerToken(token);
  if (!uitnodiging || uitnodiging.type !== "coordinator") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Ongeldige of verlopen link.</p>
      </main>
    );
  }

  // Verify coordinator has access to this team
  const coordTeam = await prisma.coordinatorTeam.findFirst({
    where: {
      coordinator: { email: uitnodiging.email },
      owTeamId: parseInt(teamId),
      seizoen: uitnodiging.ronde.seizoen,
    },
    select: { id: true },
  });
  if (!coordTeam) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Geen toegang tot dit team.</p>
      </main>
    );
  }

  const team = await prisma.oWTeam.findUnique({
    where: { id: parseInt(teamId) },
    select: { id: true, naam: true, categorie: true },
  });

  // Get all evaluaties for this team and ronde
  const evaluaties = await prisma.evaluatie.findMany({
    where: { rondeId, teamNaam: team?.naam, status: "ingediend" },
    include: {
      speler: { select: { id: true, roepnaam: true, achternaam: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by coach (each trainer submits evaluations for all players)
  const perCoach = new Map<string, typeof evaluaties>();
  for (const e of evaluaties) {
    const coach = e.coach ?? "Onbekend";
    const list = perCoach.get(coach) ?? [];
    list.push(e);
    perCoach.set(coach, list);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <a href={`/coordinator?token=${token}`} className="text-sm text-orange-600 hover:underline">
          ← Terug naar overzicht
        </a>
      </div>
      <h1 className="text-2xl font-bold">{team?.naam ?? "Team"}</h1>
      <p className="mt-1 text-gray-500">{uitnodiging.ronde.naam}</p>

      <CoordinatorTeamView
        evaluaties={evaluaties.map((e) => ({
          id: e.id,
          spelerId: e.spelerId,
          spelerNaam: e.speler ? `${e.speler.roepnaam} ${e.speler.achternaam}` : e.spelerId,
          coach: e.coach ?? "Onbekend",
          scores: e.scores as Record<string, number | string | null>,
          opmerkingen: e.opmerking,
          coordinatorMemo: e.coordinatorMemo,
          ingediendOp: e.ingediendOp?.toISOString() ?? null,
        }))}
        token={token}
      />
    </main>
  );
}
