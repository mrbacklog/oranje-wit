import { valideerToken } from "@/lib/evaluatie/tokens";
import { prisma } from "@/lib/db/prisma";
import CoordinatorTeamView from "@/components/evaluatie/CoordinatorTeamView";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;

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

  const coordTeam = await (prisma.coordinatorTeam.findFirst as PrismaFn)({
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

  const team = await (prisma.oWTeam.findUnique as PrismaFn)({
    where: { id: parseInt(teamId) },
    select: { id: true, naam: true, categorie: true },
  });

  const evaluaties = await (prisma.evaluatie.findMany as PrismaFn)({
    where: { rondeId, teamNaam: team?.naam, status: "ingediend" },
    include: {
      speler: { select: { id: true, roepnaam: true, achternaam: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <a
          href={`/evaluatie/coordinator?token=${token}`}
          className="text-ow-oranje text-sm hover:underline"
        >
          &larr; Terug naar overzicht
        </a>
      </div>
      <h1 className="text-2xl font-bold">{team?.naam ?? "Team"}</h1>
      <p className="text-text-muted mt-1">{uitnodiging.ronde.naam}</p>

      <CoordinatorTeamView
        evaluaties={evaluaties.map(
          (e: {
            id: string;
            spelerId: string;
            speler: { id: string; roepnaam: string; achternaam: string } | null;
            coach: string | null;
            scores: Record<string, unknown>;
            opmerking: string | null;
            coordinatorMemo: string | null;
            ingediendOp: Date | null;
          }) => ({
            id: e.id,
            spelerId: e.spelerId,
            spelerNaam: e.speler ? `${e.speler.roepnaam} ${e.speler.achternaam}` : e.spelerId,
            coach: e.coach ?? "Onbekend",
            scores: e.scores as Record<string, number | string | null>,
            opmerkingen: e.opmerking,
            coordinatorMemo: e.coordinatorMemo,
            ingediendOp: e.ingediendOp?.toISOString() ?? null,
          })
        )}
        token={token}
      />
    </main>
  );
}
