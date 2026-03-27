import { valideerToken } from "@/lib/evaluatie/tokens";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;

export default async function CoordinatorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-surface-card max-w-sm rounded-lg border p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Geen geldige link</h1>
          <p className="text-text-secondary mt-2">Gebruik de link uit je uitnodigingsmail.</p>
        </div>
      </main>
    );
  }

  const uitnodiging = await valideerToken(token);

  if (!uitnodiging || uitnodiging.type !== "coordinator") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-surface-card max-w-sm rounded-lg border p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Ongeldige link</h1>
          <p className="text-text-secondary mt-2">Deze link is verlopen of ongeldig.</p>
        </div>
      </main>
    );
  }

  const { ronde } = uitnodiging;

  const coordTeams = await (prisma.coordinatorTeam.findMany as PrismaFn)({
    where: {
      coordinator: { email: uitnodiging.email },
      seizoen: ronde.seizoen,
    },
    include: {
      owTeam: { select: { id: true, naam: true, categorie: true } },
    },
  });

  const teamStats = await Promise.all(
    coordTeams.map(
      async (ct: { owTeam: { id: number; naam: string | null; categorie: string | null } }) => {
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
        return { team: ct.owTeam, ingediend, uitnodigingen };
      }
    )
  );

  const deadlineStr = ronde.deadline.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-ow-oranje text-2xl font-bold">{ronde.naam}</h1>
        <p className="text-text-muted mt-1">
          Coordinator: {uitnodiging.naam} — Deadline: {deadlineStr}
        </p>
      </div>

      {teamStats.length === 0 ? (
        <p className="text-text-muted">Geen teams toegewezen voor dit seizoen.</p>
      ) : (
        <div className="space-y-4">
          {teamStats.map(({ team, ingediend, uitnodigingen: totaal }) => (
            <Link
              key={team.id}
              href={`/evaluatie/coordinator/${ronde.id}/${team.id}?token=${token}`}
              className="bg-surface-card block rounded-lg border p-4 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{team.naam}</h2>
                  <p className="text-text-muted text-sm">{team.categorie}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold ${ingediend === totaal && totaal > 0 ? "text-green-400" : "text-ow-oranje"}`}
                  >
                    {ingediend}/{totaal}
                  </span>
                  <p className="text-text-muted text-xs">evaluaties</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
