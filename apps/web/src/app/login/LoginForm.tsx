"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { vraagSmartlinkAan } from "./actions";

type Status =
  | { stap: "invoer" }
  | { stap: "laden" }
  | { stap: "google"; email: string }
  | { stap: "smartlink"; email: string }
  | { stap: "fout"; melding: string };

const isDev = process.env.NODE_ENV === "development";

export function LoginForm({ googleSignInAction }: { googleSignInAction: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ stap: "invoer" });
  const [isPending, startTransition] = useTransition();

  // Dev login state
  const [devEmail, setDevEmail] = useState("");
  const [devLaden, setDevLaden] = useState(false);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      setStatus({ stap: "laden" });
      try {
        const result = await vraagSmartlinkAan(email.trim());
        if (!result.ok) {
          setStatus({ stap: "fout", melding: result.error });
          return;
        }
        if (result.data.methode === "google") {
          setStatus({ stap: "google", email: email.trim() });
        } else {
          setStatus({ stap: "smartlink", email: email.trim() });
        }
      } catch {
        setStatus({
          stap: "fout",
          melding: "Er ging iets mis. Probeer het opnieuw.",
        });
      }
    });
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setDevLaden(true);
    try {
      await signIn("dev-login", {
        email: devEmail.trim(),
        redirectTo: "/",
      });
    } catch {
      setDevLaden(false);
    }
  }

  return (
    <>
      {/* Login card */}
      <div
        className="mt-8 rounded-xl border p-6"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Flow 1: E-mail invoer */}
        {(status.stap === "invoer" || status.stap === "laden" || status.stap === "fout") && (
          <form onSubmit={handleEmailSubmit}>
            <label
              htmlFor="email"
              className="block text-left text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="naam@voorbeeld.nl"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status.stap === "fout") setStatus({ stap: "invoer" });
              }}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
              style={{
                backgroundColor: "var(--surface-sunken)",
                borderColor:
                  status.stap === "fout"
                    ? "var(--color-error-500, #ef4444)"
                    : "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />

            {/* Foutmelding */}
            {status.stap === "fout" && (
              <p
                className="mt-2 text-left text-xs"
                style={{ color: "var(--color-error-500, #ef4444)" }}
              >
                {status.melding}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="mt-4 w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
                boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
              }}
            >
              {isPending ? "Even geduld..." : "Doorgaan"}
            </button>
          </form>
        )}

        {/* Flow: Google redirect voor TC-leden */}
        {status.stap === "google" && (
          <div>
            <div
              className="mb-4 rounded-lg border p-3 text-left text-sm"
              style={{
                backgroundColor: "rgba(255, 107, 0, 0.08)",
                borderColor: "rgba(255, 107, 0, 0.2)",
                color: "var(--ow-oranje-400)",
              }}
            >
              Je bent TC-lid. Log in met je Google-account.
            </div>
            <form action={googleSignInAction}>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
                }}
              >
                <GoogleIcon />
                Inloggen met Google
              </button>
            </form>
            <button
              type="button"
              onClick={() => setStatus({ stap: "invoer" })}
              className="mt-3 w-full cursor-pointer text-xs transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              Ander e-mailadres gebruiken
            </button>
          </div>
        )}

        {/* Flow: Smartlink verstuurd */}
        {status.stap === "smartlink" && (
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.12)",
              }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#4ade80"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Check je inbox!
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              We hebben een inloglink gestuurd naar{" "}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {status.email}
              </span>
            </p>
            <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              De link is 14 dagen geldig. Check ook je spam-map.
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail("");
                setStatus({ stap: "invoer" });
              }}
              className="mt-4 cursor-pointer text-xs transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              Ander e-mailadres gebruiken
            </button>
          </div>
        )}
      </div>

      {/* Flow 2: Google OAuth shortcut (secundair) */}
      {(status.stap === "invoer" || status.stap === "laden" || status.stap === "fout") && (
        <div className="mt-4">
          <div className="flex items-center gap-3" style={{ color: "var(--text-tertiary)" }}>
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border-default)" }} />
            <span className="text-xs">of</span>
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border-default)" }} />
          </div>
          <form action={googleSignInAction} className="mt-4">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: "transparent",
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <GoogleIcon />
              TC-lid? Log in met Google
            </button>
          </form>
        </div>
      )}

      {/* Flow 3: Dev login (alleen in development) */}
      {isDev && (
        <div
          className="mt-6 rounded-lg border p-4"
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.06)",
            borderColor: "rgba(139, 92, 246, 0.2)",
          }}
        >
          <p
            className="mb-3 text-xs font-semibold tracking-wide uppercase"
            style={{ color: "rgba(167, 139, 250, 0.8)" }}
          >
            Dev Login
          </p>
          <form onSubmit={handleDevLogin}>
            <input
              type="email"
              required
              placeholder="test@example.com"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--surface-sunken)",
                borderColor: "rgba(139, 92, 246, 0.2)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={devLaden || !devEmail.trim()}
              className="mt-2 w-full cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              }}
            >
              {devLaden ? "Inloggen..." : "Dev Login"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
