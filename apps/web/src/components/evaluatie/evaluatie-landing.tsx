"use client";

import { EmptyState } from "@oranje-wit/ui";

interface EvaluatieLandingProps {
  ingelogd?: boolean;
  bericht?: string;
}

export function EvaluatieLanding({ ingelogd, bericht }: EvaluatieLandingProps) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-5"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <h1 className="text-ow-oranje text-2xl font-bold">Evaluatie</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
            c.k.v. Oranje Wit
          </p>
        </div>

        <EmptyState
          icon={
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          }
          title={
            ingelogd ? (bericht ?? "Geen evaluaties beschikbaar") : "Gebruik de link in je e-mail"
          }
          description={
            ingelogd
              ? "Neem contact op met de TC als je denkt dat dit niet klopt."
              : "Heb je een uitnodiging ontvangen? Klik op de link in de e-mail om je evaluatie in te vullen."
          }
        />
      </div>
    </main>
  );
}
