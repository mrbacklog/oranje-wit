import { signIn } from "@oranje-wit/auth";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-8"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Branding */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
            }}
          >
            OW
          </div>
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--ow-oranje-500)" }}
          >
            c.k.v. Oranje Wit
          </div>
          <h1 className="mt-1 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            TC Beheer
          </h1>
        </div>

        <ErrorMessage searchParams={searchParams} />

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="bg-ow-oranje hover:bg-ow-oranje-light w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Inloggen met Google
          </button>
        </form>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          Alleen TC-leden met EDITOR-rol hebben toegang.
        </p>
      </div>
    </main>
  );
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (params.error === "geen-toegang") {
    return (
      <div
        className="mb-4 rounded-lg border p-3 text-sm"
        style={{
          backgroundColor: "var(--color-error-50)",
          borderColor: "rgba(239, 68, 68, 0.25)",
          color: "var(--color-error-500)",
        }}
      >
        Je hebt geen toegang tot het beheerpaneel. Neem contact op met de TC.
      </div>
    );
  }
  return null;
}
