import { valideerToken } from "@/lib/evaluatie/tokens";
import { prisma } from "@/lib/db/prisma";
import SpelerZelfEvaluatieForm from "@/components/evaluatie/SpelerZelfEvaluatieForm";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;

export default async function ZelfEvaluatiePage({
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

  if (!uitnodiging || uitnodiging.type !== "speler") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-surface-card max-w-sm rounded-lg border p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Ongeldige link</h1>
          <p className="text-text-secondary mt-2">Deze link is verlopen of ongeldig.</p>
        </div>
      </main>
    );
  }

  const bestaand = await (prisma.spelerZelfEvaluatie.findFirst as PrismaFn)({
    where: {
      spelerId: uitnodiging.spelerId!,
      seizoen: uitnodiging.ronde.seizoen,
      ronde: uitnodiging.ronde.ronde,
      status: "ingediend",
    },
  });

  if (bestaand) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-surface-card max-w-sm rounded-lg border p-8 text-center">
          <h1 className="text-lg font-bold text-green-400">Al ingevuld</h1>
          <p className="text-text-secondary mt-2">
            Je hebt je zelfevaluatie al ingediend. Bedankt!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-ow-oranje text-2xl font-bold">Zelfevaluatie</h1>
        <p className="text-text-secondary mt-2">
          Hoi {uitnodiging.naam}! Vul onderstaande evaluatie eerlijk in.
        </p>
        <p className="text-text-muted mt-1 text-sm">
          Je antwoorden zijn anoniem voor trainers. Alleen de coordinator kan ze inzien.
        </p>
      </div>

      <SpelerZelfEvaluatieForm token={token} />
    </main>
  );
}
