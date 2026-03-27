import Link from "next/link";
import { auth } from "@oranje-wit/auth";
import { DashboardGamification } from "./dashboard-gamification";
import { DashboardVerzoeken } from "./dashboard-verzoeken";

export default async function DashboardPage() {
  const session = await auth();
  const naam = session?.user?.name ?? "Scout";

  // Begroeting op basis van dagdeel
  const uur = new Date().getHours();
  let begroeting = "Hoi";
  if (uur >= 6 && uur < 12) begroeting = "Goedemorgen";
  else if (uur >= 12 && uur < 18) begroeting = "Goedemiddag";
  else if (uur >= 18 && uur < 23) begroeting = "Goedenavond";

  return (
    <div className="px-4 pt-6 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          {begroeting}, {naam}
        </h1>
      </header>

      <div className="grid gap-4">
        {/* XP-balk (client component) */}
        <DashboardGamification />

        {/* Scout acties */}
        <section className="bg-surface-card rounded-2xl p-5">
          <h2 className="mb-3 text-lg font-semibold">Scouten</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/zoek"
              className="touch-target bg-ow-oranje/10 active:bg-ow-oranje/20 flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-center transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="text-ow-oranje h-6 w-6"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="text-ow-oranje text-sm font-medium">Scout een speler</span>
            </Link>
            <Link
              href="/team"
              className="touch-target bg-surface-elevated active:bg-surface-dark flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-center transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="text-text-secondary h-6 w-6"
                strokeWidth={2}
              >
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="7" r="4" stroke="currentColor" />
                <path
                  d="M23 21v-2a4 4 0 00-3-3.87"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13a4 4 0 010 7.75"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium">Scout een team</span>
            </Link>
          </div>
        </section>

        {/* Verzoeken + onafgeronde drafts */}
        <DashboardVerzoeken />

        {/* Recente activiteit placeholder */}
        <section className="bg-surface-card rounded-2xl p-5">
          <h2 className="mb-3 text-lg font-semibold">Recente rapporten</h2>
          <p className="text-text-muted text-sm">Nog geen rapporten ingediend.</p>
        </section>
      </div>
    </div>
  );
}
