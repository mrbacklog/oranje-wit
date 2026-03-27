export default async function BedanktPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="bg-surface-card max-w-sm rounded-lg border p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
          <svg
            className="h-6 w-6 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-green-400">Bedankt!</h1>
        <p className="text-text-secondary mt-2">
          Je evaluatie{team ? ` voor ${team}` : ""} is ontvangen.
        </p>
        <p className="text-text-muted mt-4 text-sm">Je kunt dit venster sluiten.</p>
      </div>
    </main>
  );
}
