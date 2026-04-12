"use client";

import { logger } from "@oranje-wit/types";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  logger.error("Team-Indeling error boundary:", error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Er ging iets mis</h2>
        <p className="mb-6 text-sm text-gray-500">
          Er is een fout opgetreden bij het laden van deze pagina.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#ff6b00] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e05e00]"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
