import { redirect } from "next/navigation";
import { signIn } from "@oranje-wit/auth";
import { valideerToegangsToken, markeerTokenGebruikt } from "@oranje-wit/auth/tokens";
import { getCapabilities } from "@oranje-wit/auth/allowlist";

/**
 * Smartlink login pagina.
 *
 * Flow:
 * 1. Token uit URL valideren
 * 2. Gebruiker opzoeken in Gebruiker-tabel
 * 3. Token markeren als gebruikt
 * 4. NextAuth sessie aanmaken via signIn("smartlink")
 *
 * Dit is een server component. De form wordt automatisch gesubmit
 * via een client-side script zodra de validatie slaagt.
 */
export default async function SmartlinkLoginPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Stap 1: Valideer het token
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

  // Stap 3: Markeer token als gebruikt (voor tracking, token blijft geldig)
  await markeerTokenGebruikt(token);

  // Stap 4: Maak NextAuth sessie aan via server action
  async function aanmelden() {
    "use server";
    await signIn("smartlink", {
      email,
      naam: naam ?? email.split("@")[0],
      redirectTo: "/",
    });
  }

  // Auto-submit form: de client-side script submit zodra de pagina laadt
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white"
          style={{
            background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
            boxShadow: "0 0 40px rgba(255, 107, 0, 0.25)",
          }}
        >
          OW
        </div>

        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Even geduld...
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Je wordt ingelogd als {naam ?? email}
        </p>

        <form id="smartlink-form" action={aanmelden} className="mt-6">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
              boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
            }}
          >
            Doorgaan
          </button>
        </form>

        {/* Auto-submit: form wordt direct verstuurd */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById("smartlink-form").requestSubmit();`,
          }}
        />
      </div>
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
          Link ongeldig
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
