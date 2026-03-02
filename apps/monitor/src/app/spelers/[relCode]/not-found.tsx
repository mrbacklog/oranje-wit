import Link from "next/link";

export default function SpelerNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-ow-oranje mb-2 text-5xl font-bold">404</p>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Speler niet gevonden</h2>
        <p className="mb-6 text-sm text-gray-500">
          Deze speler bestaat niet of is niet meer actief.
        </p>
        <Link
          href="/spelers"
          className="bg-ow-oranje hover:bg-ow-oranje-light rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Terug naar Spelers
        </Link>
      </div>
    </div>
  );
}
