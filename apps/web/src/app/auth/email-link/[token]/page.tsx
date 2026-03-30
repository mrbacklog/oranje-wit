import { redirect } from "next/navigation";
import { auth } from "@oranje-wit/auth";
import { verifyEmailLink } from "@oranje-wit/auth/hmac-link";
import { getCapabilities } from "@oranje-wit/auth/allowlist";
import { EmailLinkClient } from "./EmailLinkClient";

/**
 * Email-link login pagina.
 *
 * Flow:
 * 1. Server-side: valideer HMAC-token (stateless, geen DB)
 * 2. Check of gebruiker al ingelogd is -> redirect naar destination
 * 3. Check of gebruiker bestaat en actief is (DB lookup via allowlist)
 * 4. Toon "Inloggen" knop (client component, POST via signIn)
 *
 * Bij ongeldig/verlopen token: foutpagina met uitleg.
 */
export default async function EmailLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Stap 1: Valideer het HMAC-token (stateless)
  const verificatie = verifyEmailLink(token);

  // Verlopen link
  if (verificatie.expired) {
    return (
      <FoutPagina
        titel="Link verlopen"
        bericht="Deze link is niet meer geldig. Vraag een nieuwe link aan bij de TC."
      />
    );
  }

  // Ongeldige link (gemanipuleerd, corrupt, etc.)
  if (!verificatie.valid) {
    return (
      <FoutPagina
        titel="Link ongeldig"
        bericht="Deze link is niet geldig. Controleer of je de volledige link hebt gekopieerd."
      />
    );
  }

  const { email, destination } = verificatie;

  // Stap 2: Check of gebruiker al ingelogd is
  const session = await auth();
  if (session?.user?.email) {
    // Al ingelogd — redirect naar destination of homepage
    redirect(destination || "/");
  }

  // Stap 3: Check of de gebruiker bestaat en actief is
  const capabilities = await getCapabilities(email);
  if (!capabilities) {
    return (
      <FoutPagina
        titel="Geen toegang"
        bericht="Je account is niet (meer) actief. Neem contact op met de TC."
      />
    );
  }

  // Stap 4: Toon login-pagina met knop
  const naam = email.split("@")[0];

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <EmailLinkClient token={token} naam={naam} destination={destination} />
    </main>
  );
}

/**
 * Foutpagina — consistent met de smartlink foutpagina.
 */
function FoutPagina({ titel, bericht }: { titel: string; bericht: string }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--color-error-500, #ef4444)",
          }}
        >
          !
        </div>

        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {titel}
        </h1>

        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          {bericht}
        </p>

        <a
          href="/login"
          className="mt-6 inline-block rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--surface-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          Naar inlogpagina
        </a>
      </div>
    </main>
  );
}
