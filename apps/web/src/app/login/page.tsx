import { signIn } from "@oranje-wit/auth";

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white"
          style={{
            background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
            boxShadow: "0 0 40px rgba(255, 107, 0, 0.25), 0 0 80px rgba(255, 107, 0, 0.1)",
          }}
        >
          OW
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          c.k.v. Oranje Wit
        </h1>

        <p className="mt-1 text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
          Welkom
        </p>

        {/* Login card */}
        <div
          className="mt-8 rounded-xl border p-6"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
                boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
              }}
            >
              Inloggen met Google
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Digitaal platform voor trainers, scouts en TC
        </p>
      </div>
    </main>
  );
}
