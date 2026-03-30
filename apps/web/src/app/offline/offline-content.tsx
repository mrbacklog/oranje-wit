"use client";

export function OfflineContent() {
  return (
    <div className="bg-surface-page flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Club icon */}
      <div className="mb-8">
        <img
          src="/icons/icon-192.png"
          alt="c.k.v. Oranje Wit"
          width={96}
          height={96}
          className="mx-auto rounded-2xl opacity-80"
        />
      </div>

      {/* Status indicator */}
      <div className="mb-6 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        <span className="text-text-secondary text-sm font-medium">Geen verbinding</span>
      </div>

      {/* Heading */}
      <h1 className="text-text-primary text-3xl font-bold tracking-tight">Je bent offline</h1>

      {/* Description */}
      <p className="text-text-secondary mt-3 max-w-sm text-base">
        Er is geen internetverbinding beschikbaar. Controleer je wifi of mobiele data en probeer het
        opnieuw.
      </p>

      {/* Retry button */}
      <button
        onClick={() => window.location.reload()}
        className="bg-ow-oranje shadow-ow-oranje/20 mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.97]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-9.624-3.848a5.5 5.5 0 019.201-2.466l.312.311H12.768a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V2.537a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 003.628 7.397a.75.75 0 001.449.39z"
            clipRule="evenodd"
          />
        </svg>
        Probeer opnieuw
      </button>
    </div>
  );
}
