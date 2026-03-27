"use client";

import { logger } from "@oranje-wit/types";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  logger.error("Scouting error boundary:", error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div
        className="rounded-xl p-8"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Er ging iets mis
        </h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Er is een fout opgetreden bij het laden van deze pagina.
        </p>
        <button
          onClick={reset}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--ow-oranje-500)" }}
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
