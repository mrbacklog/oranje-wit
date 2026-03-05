import { valideerToken } from "@/lib/tokens";
import { prisma } from "@/lib/db/prisma";
import SpelerZelfEvaluatieForm from "@/components/SpelerZelfEvaluatieForm";

export default async function ZelfEvaluatiePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="max-w-sm rounded-lg border bg-white p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Geen geldige link</h1>
          <p className="mt-2 text-gray-600">Gebruik de link uit je uitnodigingsmail.</p>
        </div>
      </main>
    );
  }

  const uitnodiging = await valideerToken(token);

  if (!uitnodiging || uitnodiging.type !== "speler") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="max-w-sm rounded-lg border bg-white p-8 text-center">
          <h1 className="text-lg font-bold text-red-600">Ongeldige link</h1>
          <p className="mt-2 text-gray-600">Deze link is verlopen of ongeldig.</p>
        </div>
      </main>
    );
  }

  // Check of al ingediend
  const bestaand = await prisma.spelerZelfEvaluatie.findFirst({
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
        <div className="max-w-sm rounded-lg border bg-white p-8 text-center">
          <h1 className="text-lg font-bold text-green-600">Al ingevuld</h1>
          <p className="mt-2 text-gray-600">Je hebt je zelfevaluatie al ingediend. Bedankt!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-orange-600">Zelfevaluatie</h1>
        <p className="mt-2 text-gray-600">
          Hoi {uitnodiging.naam}! Vul onderstaande evaluatie eerlijk in.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Je antwoorden zijn anoniem voor trainers. Alleen de coordinator kan ze inzien.
        </p>
      </div>

      <SpelerZelfEvaluatieForm token={token} />
    </main>
  );
}
