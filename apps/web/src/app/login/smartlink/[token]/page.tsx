import { signIn } from "@oranje-wit/auth";
import { valideerToegangsToken, markeerTokenGebruikt } from "@oranje-wit/auth/tokens";
import { getCapabilities } from "@oranje-wit/auth/allowlist";
import { SmartlinkLoginKnop } from "./SmartlinkLoginKnop";

/**
 * Smartlink login pagina.
 *
 * Waterval-authenticatie patroon:
 * - GET (page load) = VEILIG: valideert alleen het token, maakt GEEN sessie aan
 * - POST (knop klik) = LOGIN: markeert token als gebruikt + maakt NextAuth sessie aan
 *
 * Dit is bestand tegen email security scanners die URLs prefetchen:
 * - Scanners doen alleen GET-requests (geen POST)
 * - De pagina toont een "Inloggen" knop die de gebruiker zelf moet klikken
 * - Pas bij klik wordt de server action aangeroepen (POST)
 */
export default async function SmartlinkLoginPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Stap 1: Valideer het token (GET = veilig, geen side-effects)
  const validatie = await valideerToegangsToken(token);

  if (!validatie.ok || !validatie.data) {
    return <FoutPagina bericht={validatie.error ?? "Ongeldige of verlopen link"} />;
  }

  const { email, naam } = validatie.data;

  // Stap 2: Check of de gebruiker bestaat en actief is
  const capabilities = await getCapabilities(email);
  if (!capabilities) {
    return <FoutPagina bericht="Je account is niet (meer) actief. Neem contact op met de TC." />;
  }

  // Stap 3: Server action — wordt PAS aangeroepen bij klik op de knop
  async function aanmelden() {
    "use server";
    // Markeer token als gebruikt (tracking)
    await markeerTokenGebruikt(token);
    // Maak NextAuth sessie aan
    await signIn("smartlink", {
      email,
      naam: naam ?? email.split("@")[0],
      redirectTo: "/",
    });
  }

  // Stap 4: Toon de login-knop — GEEN auto-submit
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <SmartlinkLoginKnop naam={naam ?? ""} email={email} aanmeldenAction={aanmelden} />
    </main>
  );
}

function FoutPagina({ bericht }: { bericht: string }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Fout-icoon */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--color-error-500, #ef4444)",
          }}
        >
          !
        </div>

        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Link ongeldig
        </h1>

        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          {bericht}
        </p>

        {/* Twee opties: nieuwe link aanvragen of naar login */}
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/login"
            className="inline-block w-full cursor-pointer rounded-xl px-6 py-4 text-center text-base font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
              boxShadow: "0 4px 20px rgba(255, 107, 0, 0.4)",
              minHeight: "56px",
              lineHeight: "24px",
            }}
          >
            Nieuwe link aanvragen
          </a>

          <a
            href="/login"
            className="inline-block w-full rounded-lg px-6 py-2.5 text-center text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--surface-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            Naar inlogpagina
          </a>
        </div>
      </div>
    </main>
  );
}
