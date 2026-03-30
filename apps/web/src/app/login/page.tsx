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
        {/* Logo — stagger 0ms */}
        <div
          className="login-stagger-0 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white"
          style={{
            background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
            boxShadow: "0 0 40px rgba(255, 107, 0, 0.25), 0 0 80px rgba(255, 107, 0, 0.1)",
            animation: "logoAppear 300ms var(--ease-spring) both",
          }}
        >
          OW
        </div>

        {/* Titel — stagger 100ms */}
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{
            color: "var(--text-primary)",
            animation: "staggerFade 300ms 100ms var(--ease-out) both",
          }}
        >
          c.k.v. Oranje Wit
        </h1>

        {/* Subtitel — stagger 200ms */}
        <p
          className="mt-1 text-lg font-medium"
          style={{
            color: "var(--text-secondary)",
            animation: "staggerFade 300ms 200ms var(--ease-out) both",
          }}
        >
          Welkom
        </p>

        {/* Interactief login formulier — stagger via LoginForm intern */}
        <LoginForm googleSignInAction={googleSignIn} />

        {/* Footer — stagger 400ms */}
        <p
          className="mt-6 text-xs"
          style={{
            color: "var(--text-tertiary)",
            animation: "staggerFade 300ms 400ms var(--ease-out) both",
          }}
        >
          Digitaal platform voor trainers, scouts en TC
        </p>
      </div>

      {/* Staggered loading keyframes */}
      <style>{`
        @keyframes logoAppear {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes staggerFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-stagger-0,
          h1, p {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </main>
  );
}
