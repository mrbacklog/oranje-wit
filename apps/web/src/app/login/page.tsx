import { signIn } from "@oranje-wit/auth";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  async function googleSignIn() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

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

        {/* Interactief login formulier */}
        <LoginForm googleSignInAction={googleSignIn} />

        <p className="mt-6 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Digitaal platform voor trainers, scouts en TC
        </p>
      </div>
    </main>
  );
}
