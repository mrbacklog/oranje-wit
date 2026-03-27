import { valideerToken } from "@/lib/tokens";
import { prisma, PrismaFn } from "@/lib/db/prisma";
import TrainerEvaluatieForm from "@/components/TrainerEvaluatieForm";

async function haalSpelersOp(seizoen: string, teamNaam: string | null | undefined) {
  if (!teamNaam) return [];
  // Prisma 7 type recursie workaround (TS2321)
  const spelers = await (prisma.competitieSpeler.findMany as PrismaFn)({
    where: { seizoen, team: teamNaam },
    select: {
      relCode: true,
      geslacht: true,
      lid: {
        select: {
          roepnaam: true,
          tussenvoegsel: true,
          achternaam: true,
        },
      },
    },
    orderBy: { lid: { achternaam: "asc" } },
  });
  return spelers.map(
    (s: {
      relCode: string;
      geslacht: string | null;
      lid: { roepnaam: string; tussenvoegsel: string | null; achternaam: string } | null;
    }) => ({
      relCode: s.relCode,
      naam: s.lid
        ? `${s.lid.roepnaam} ${s.lid.tussenvoegsel ? s.lid.tussenvoegsel + " " : ""}${s.lid.achternaam}`
        : s.relCode,
      geslacht: s.geslacht ?? "O",
    })
  );
}

export default async function InvullenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-surface-card rounded-lg border p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Ongeldige link</h1>
          <p className="text-text-muted mt-2">Gebruik de link uit je uitnodigingsmail.</p>
        </div>
      </main>
    );
  }

  const uitnodiging = await valideerToken(token);

  if (!uitnodiging) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-surface-card rounded-lg border p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Verlopen of ongeldige link</h1>
          <p className="text-text-muted mt-2">Deze evaluatieronde is niet meer actief.</p>
        </div>
      </main>
    );
  }

  const spelers = await haalSpelersOp(uitnodiging.ronde.seizoen, uitnodiging.owTeam?.naam);

  return (
    <TrainerEvaluatieForm
      token={token}
      trainerNaam={uitnodiging.naam}
      teamNaam={uitnodiging.owTeam?.naam ?? "Onbekend team"}
      rondeNaam={uitnodiging.ronde.naam}
      deadline={uitnodiging.ronde.deadline.toISOString()}
      spelers={spelers}
    />
  );
}
