import { Suspense } from "react";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { InstallPrompt } from "@/components/pwa";
import {
  HeroGreeting,
  HeroTellers,
  SeizoensBalk,
  QuickActions,
  HubLeeg,
  HubSkeleton,
  AppGridCompact,
} from "@/components/hub";
import type { Teller } from "@/components/hub";
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
  return "Lid van c.k.v. Oranje Wit";
}

// ── Data ophalen voor tellers ────────────────────────────────────

async function getTellingen(isTC: boolean, isScout: boolean, email: string) {
  const [signaleringen, actiepunten, evaluaties, verzoeken, zelfevaluaties] = await Promise.all([
    isTC ? getSignaleringen() : [],
    isTC ? getOpenActiepunten() : [],
    getOpenEvaluaties(email),
    isScout ? getOpenVerzoeken(email) : [],
    getOpenZelfevaluaties(email),
  ]);

  return {
    signaleringen: signaleringen.length,
    actiepunten: actiepunten.length,
    evaluaties: evaluaties.length,
    verzoeken: verzoeken.length,
    zelfevaluaties: zelfevaluaties.length,
  };
}

function bouwTellers(
  isTC: boolean,
  isScout: boolean,
  tellingen: Awaited<ReturnType<typeof getTellingen>>
): Teller[] {
  if (isTC) {
    return [
      {
        label: "Open taken",
        waarde: tellingen.actiepunten + tellingen.evaluaties,
        href: "/taken",
      },
      {
        label: "Signaleringen",
        waarde: tellingen.signaleringen,
        href: "/monitor",
      },
    ];
  }

  if (isScout) {
    return [
      {
        label: "Opdrachten",
        waarde: tellingen.verzoeken,
        href: "/scouting",
      },
    ];
  }

  // Trainer / ouder / speler
  const tellers: Teller[] = [];
  if (tellingen.evaluaties > 0) {
    tellers.push({
      label: "Evaluaties",
      waarde: tellingen.evaluaties,
      href: "/evaluatie",
    });
  }
  if (tellingen.zelfevaluaties > 0) {
    tellers.push({
      label: "Zelfevaluaties",
      waarde: tellingen.zelfevaluaties,
      href: "/evaluatie",
    });
  }
  if (tellers.length === 0) {
    tellers.push({ label: "Taken", waarde: 0, href: "/taken" });
  }
  return tellers;
}

// ── Async content wrapper ────────────────────────────────────────

async function OverzichtContent({
  isTC,
  isScout,
  email,
  doelgroepen,
}: {
  isTC: boolean;
  isScout: boolean;
  email: string;
  doelgroepen: string[];
}) {
  const tellingen = await getTellingen(isTC, isScout, email);
  const tellers = bouwTellers(isTC, isScout, tellingen);

  const heeftData =
    tellingen.signaleringen > 0 ||
    tellingen.actiepunten > 0 ||
    tellingen.evaluaties > 0 ||
    tellingen.verzoeken > 0 ||
    tellingen.zelfevaluaties > 0;

  return (
    <>
      {/* Hero Tellers */}
      <HeroTellers tellers={tellers} />

      {/* Seizoensindicator */}
      <div className="mt-6">
        <SeizoensBalk />
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions
          isTC={isTC}
          isScout={isScout}
          doelgroepen={doelgroepen}
          tellingen={tellingen}
        />
      </div>

      {/* Leeg-staat als er niets te doen is */}
      {!heeftData && (
        <div className="mt-6 px-5">
          <HubLeeg />
        </div>
      )}
    </>
  );
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
    <main
      className="flex min-h-screen flex-col pb-20"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      {/* Hero Greeting */}
      <HeroGreeting naam={naam} rolLabel={getUserLabel(user)} />

      {/* Data-afhankelijke secties */}
      <Suspense
        fallback={
          <div className="px-5">
            <HubSkeleton />
          </div>
        }
      >
        <OverzichtContent isTC={isTC} isScout={isScout} email={email} doelgroepen={doelgroepen} />
      </Suspense>

      {/* App Grid */}
      <section className="mt-6 px-5">
        <h2
          className="animate-fade-in animate-fade-in-delay-6 mb-3 text-xs font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Apps
        </h2>
        <AppGridCompact
          isTC={isTC}
          isScout={isScout}
          doelgroepen={doelgroepen}
          userName={naam ?? "Gebruiker"}
        />
      </section>

      {/* Footer */}
      <footer className="mt-6 px-5 pb-4">
        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
          c.k.v. Oranje Wit &middot; Seizoen {HUIDIG_SEIZOEN} &middot; Dordrecht
        </p>
      </footer>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </main>
  );
}
