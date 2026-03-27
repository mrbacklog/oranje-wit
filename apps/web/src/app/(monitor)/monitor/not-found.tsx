import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="bg-surface-card rounded-xl p-8 shadow-sm">
        <p className="text-ow-oranje mb-2 text-5xl font-bold">404</p>
        <h2 className="text-text-primary mb-2 text-xl font-bold">Pagina niet gevonden</h2>
        <p className="text-text-muted mb-6 text-sm">Deze pagina bestaat niet of is verplaatst.</p>
        <Link
          href="/monitor"
          className="bg-ow-oranje hover:bg-ow-oranje-light rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Terug naar Dashboard
        </Link>
      </div>
    </div>
  );
}
