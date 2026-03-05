export default function ZelfBedanktPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-sm rounded-lg border bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-green-700">Bedankt!</h1>
        <p className="mt-2 text-gray-600">Je zelfevaluatie is ontvangen.</p>
        <p className="mt-4 text-sm text-gray-400">Je kunt dit venster sluiten.</p>
      </div>
    </main>
  );
}
