import { Suspense } from "react";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { HubTC, HubEvaluatie, HubScouting, HubZelf, HubLeeg, HubSkeleton } from "@/components/hub";
import { InstallPrompt } from "@/components/pwa";
import { AppGrid } from "./app-grid";
import {
  getSignaleringen,
  getOpenEvaluaties,
  getOpenVerzoeken,
  getOpenZelfevaluaties,
  getOpenActiepunten,
} from "@/lib/hub/queries";

// ── Helpers ──────────────────────────────────────────────────────

function getUserLabel(user: Record<string, unknown>): string {
  if (user.isTC === true) return "Technische Commissie";
  if (user.isScout === true) return "Scout";
  const doelgroepen = user.doelgroepen as string[] | undefined;
  if (doelgroepen && doelgroepen.length > 0) return "Coordinator";
  return "Welkom bij c.k.v. Oranje Wit";
}

// ── Async sectie-wrappers (voor Suspense boundaries) ─────────────

async function TCSection() {
  return <HubTC />;
}

async function EvaluatieSection({ email }: { email: string }) {
  return <HubEvaluatie email={email} />;
}

async function ScoutingSection({ email }: { email: string }) {
  return <HubScouting email={email} />;
}

async function ZelfSection({ email }: { email: string }) {
  return <HubZelf email={email} />;
}

/**
 * Wrapper die checkt of er uberhaupt secties getoond worden.
 * Als alles null retourneert, toon de "Alles bijgewerkt" staat.
 */
async function HubContent({
  isTC,
  isScout,
  email,
}: {
  isTC: boolean;
  isScout: boolean;
  email: string;
}) {
  // Render alle secties; de individuele componenten retourneren null als er geen data is
  const secties = (
    <>
      {isTC && (
        <Suspense fallback={<HubSkeleton />}>
          <TCSection />
        </Suspense>
      )}
      <Suspense fallback={<HubSkeleton />}>
        <EvaluatieSection email={email} />
      </Suspense>
      {isScout && (
        <Suspense fallback={<HubSkeleton />}>
          <ScoutingSection email={email} />
        </Suspense>
      )}
      <Suspense fallback={<HubSkeleton />}>
        <ZelfSection email={email} />
      </Suspense>
    </>
  );

  return secties;
}

// ── Root pagina ──────────────────────────────────────────────────

export default async function HubPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as unknown as Record<string, unknown>;
  const isTC = user.isTC === true;
  const isScout = user.isScout === true;
  const email = (user.email as string) ?? "";
  const naam = user.name as string | undefined;
  const doelgroepen = (user.doelgroepen as string[]) ?? [];

  return (
    <main className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mx-auto w-full max-w-2xl px-5 pt-10 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              Welkom{naam ? `, ${naam.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
              {getUserLabel(user)}
            </p>
          </div>

          {/* Uitlog knop via app-grid component (client) */}
        </div>
      </header>

      {/* ── Hub secties ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        <div className="space-y-6">
          <HubContent isTC={isTC} isScout={isScout} email={email} />

          {/* Fallback: toon "alles bijgewerkt" als er geen secties zichtbaar zijn.
              Dit wordt server-side gerenderd; de individuele componenten retourneren
              null als er geen data is, maar de HubLeeg staat is altijd zichtbaar
              onderaan als vangnet. */}
          <Suspense fallback={null}>
            <LeegCheck isTC={isTC} isScout={isScout} email={email} />
          </Suspense>
        </div>
      </section>

      {/* ── App-launcher (altijd zichtbaar onderaan) ─────────────── */}
      <section className="mx-auto w-full max-w-2xl px-5 pb-6">
        <h2
          className="mb-3 text-xs font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Apps
        </h2>
        <AppGrid
          isTC={isTC}
          isScout={isScout}
          doelgroepen={doelgroepen}
          userName={naam ?? "Gebruiker"}
        />
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mx-auto w-full max-w-2xl px-5 pb-8">
        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
          c.k.v. Oranje Wit &middot; Seizoen 2025-2026 &middot; Dordrecht
        </p>
      </footer>

      {/* ── PWA Install Prompt (subtiele banner onderaan) ─────────── */}
      <InstallPrompt />
    </main>
  );
}

// ── LeegCheck: toon "alles bijgewerkt" als er niets is ───────────

async function LeegCheck({
  isTC,
  isScout,
  email,
}: {
  isTC: boolean;
  isScout: boolean;
  email: string;
}) {
  // Parallel queries voor alle relevante secties
  const [signaleringen, actiepunten, evaluaties, verzoeken, zelfevaluaties] = await Promise.all([
    isTC ? getSignaleringen() : [],
    isTC ? getOpenActiepunten() : [],
    getOpenEvaluaties(email),
    isScout ? getOpenVerzoeken(email) : [],
    getOpenZelfevaluaties(email),
  ]);

  const heeftData =
    signaleringen.length > 0 ||
    actiepunten.length > 0 ||
    evaluaties.length > 0 ||
    verzoeken.length > 0 ||
    zelfevaluaties.length > 0;

  if (heeftData) return null;

  return <HubLeeg />;
}
