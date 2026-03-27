"use client";

import { logger } from "@oranje-wit/types";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  logger.error("Evaluatie admin error boundary:", error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="rounded-xl p-8" style={{ backgroundColor: "var(--surface-card)" }}>
        <h2 className="mb-2 text-xl font-bold">Er ging iets mis</h2>
        <p className="text-text-muted mb-6 text-sm">
          Er is een fout opgetreden bij het laden van deze pagina.
        </p>
        <button
          onClick={reset}
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
