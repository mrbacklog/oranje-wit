"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { vraagSmartlinkAan } from "./actions";
import { logger } from "@oranje-wit/types";
import { GoogleIcon } from "./login-icons";
import {
  isPasskeyBeschikbaar,
  haptic,
  prefersReducedMotion,
  staggerDelay,
  loginAnimations,
} from "./login-helpers";
import { PasskeyStaat, GoogleStaat, SmartlinkStaat, DevLoginStaat } from "./login-states";

type Status =
  | { stap: "detectie" }
  | { stap: "passkey" }
  | { stap: "invoer" }
  | { stap: "laden" }
  | { stap: "google"; email: string }
  | { stap: "smartlink"; email: string }
  | { stap: "fout"; melding: string };

const isDev = process.env.NODE_ENV === "development";

export function LoginForm({ googleSignInAction }: { googleSignInAction: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ stap: "detectie" });
  const [isPending, startTransition] = useTransition();
  const [retryTimer, setRetryTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [devEmail, setDevEmail] = useState("");
  const [devLaden, setDevLaden] = useState(false);

  // ── Initialisatie: detecteer passkey beschikbaarheid ────────────

  useEffect(() => {
    let cancelled = false;
    async function detecteer() {
      const passkeyOK = await isPasskeyBeschikbaar();
      if (cancelled) return;
      if (passkeyOK) {
        setStatus({ stap: "passkey" });
        logger.info("[Auth] Passkey conditional UI beschikbaar");
      } else {
        setStatus({ stap: "invoer" });
      }
    }
    detecteer();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Retry timer voor "check je inbox" ──────────────────────────

  useEffect(() => {
    if (status.stap !== "smartlink") {
      if (timerRef.current) clearInterval(timerRef.current);
      setRetryTimer(0);
      return;
    }
    setRetryTimer(30);
    timerRef.current = setInterval(() => {
      setRetryTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status.stap]);

  // ── Passkey authenticatie ───────────────────────────────────────

  const handlePasskeyLogin = useCallback(async () => {
    haptic(5);
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: "preferred",
          timeout: 60000,
        },
        mediation: "optional",
      });
      if (!credential) {
        setStatus({ stap: "invoer" });
        return;
      }
      logger.info("[Auth] Passkey credential ontvangen");
      haptic([10, 50, 10]);
      setStatus({ stap: "invoer" });
    } catch (error) {
      logger.warn("[Auth] Passkey authenticatie mislukt:", error);
      haptic(20);
      setStatus({ stap: "invoer" });
    }
  }, []);

  // ── E-mail submit ──────────────────────────────────────────────

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    haptic(5);
    startTransition(async () => {
      setStatus({ stap: "laden" });
      try {
        const result = await vraagSmartlinkAan(email.trim());
        if (!result.ok) {
          setStatus({ stap: "fout", melding: result.error });
          haptic(20);
          return;
        }
        if (result.data.methode === "google") {
          setStatus({ stap: "google", email: email.trim() });
        } else {
          setStatus({ stap: "smartlink", email: email.trim() });
          haptic([10, 50, 10]);
        }
      } catch (error) {
        logger.warn("E-mail submit mislukt:", error);
        setStatus({ stap: "fout", melding: "Er ging iets mis. Probeer het opnieuw." });
        haptic(20);
      }
    });
  }

  // ── Dev login ──────────────────────────────────────────────────

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setDevLaden(true);
    try {
      await signIn("dev-login", { email: devEmail.trim(), redirectTo: "/" });
    } catch (error) {
      logger.warn("Dev login mislukt:", error);
      setDevLaden(false);
    }
  }

  // ── Detectie staat: lege placeholder ───────────────────────────

  if (status.stap === "detectie") {
    return (
      <div className="mt-8">
        <div
          className="h-48 animate-pulse rounded-xl"
          style={{ backgroundColor: "var(--surface-card)" }}
        />
      </div>
    );
  }

  const reduced = prefersReducedMotion();

  return (
    <>
      {status.stap === "passkey" && (
        <PasskeyStaat
          onLogin={handlePasskeyLogin}
          onFallback={() => setStatus({ stap: "invoer" })}
        />
      )}

      {(status.stap === "invoer" || status.stap === "laden" || status.stap === "fout") && (
        <EmailInvoerStaat
          email={email}
          setEmail={setEmail}
          status={status}
          setStatus={setStatus}
          isPending={isPending}
          onSubmit={handleEmailSubmit}
          reduced={reduced}
        />
      )}

      {status.stap === "google" && (
        <GoogleStaat
          googleSignInAction={googleSignInAction}
          onBack={() => setStatus({ stap: "invoer" })}
        />
      )}

      {status.stap === "smartlink" && (
        <SmartlinkStaat
          email={status.email}
          retryTimer={retryTimer}
          onRetry={() => {
            setEmail(status.email);
            setStatus({ stap: "invoer" });
          }}
          onBack={() => {
            setEmail("");
            setStatus({ stap: "invoer" });
          }}
        />
      )}

      {(status.stap === "invoer" || status.stap === "laden" || status.stap === "fout") && (
        <GoogleOAuthShortcut googleSignInAction={googleSignInAction} reduced={reduced} />
      )}

      {isDev && (
        <DevLoginStaat
          devEmail={devEmail}
          setDevEmail={setDevEmail}
          devLaden={devLaden}
          onSubmit={handleDevLogin}
        />
      )}

      <style>{loginAnimations}</style>
    </>
  );
}

/* ── E-mail invoer (inline, klein genoeg) ─────────────────────── */

function EmailInvoerStaat({
  email,
  setEmail,
  status,
  setStatus,
  isPending,
  onSubmit,
  reduced,
}: {
  email: string;
  setEmail: (v: string) => void;
  status: { stap: string; melding?: string };
  setStatus: (s: Status) => void;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  reduced: boolean;
}) {
  return (
    <div
      className="mt-8 rounded-xl border p-6"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-lg)",
        animation: reduced ? "none" : `cardAppear 400ms ${staggerDelay(3)} var(--ease-spring) both`,
      }}
    >
      <form onSubmit={onSubmit}>
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
          autoComplete="username webauthn"
          placeholder="naam@voorbeeld.nl"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.stap === "fout") setStatus({ stap: "invoer" });
          }}
          className="mt-2 w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none"
          style={{
            backgroundColor: "var(--surface-sunken)",
            borderColor:
              status.stap === "fout" ? "var(--color-error-500, #ef4444)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => {
            if (status.stap !== "fout") {
              e.currentTarget.style.borderColor = "var(--border-focus)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 133, 51, 0.1)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor =
              status.stap === "fout" ? "var(--color-error-500, #ef4444)" : "var(--border-default)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {status.stap === "fout" && "melding" in status && (
          <p
            className="mt-2 text-left text-xs"
            style={{
              color: "var(--color-error-500, #ef4444)",
              animation: reduced ? "none" : "shakeError 400ms var(--ease-bounce)",
            }}
          >
            {(status as { melding: string }).melding}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="mt-4 w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
            boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
          }}
        >
          {isPending ? "Even geduld..." : "Doorgaan"}
        </button>
      </form>
    </div>
  );
}

/* ── Google OAuth shortcut (secundair) ────────────────────────── */

function GoogleOAuthShortcut({
  googleSignInAction,
  reduced,
}: {
  googleSignInAction: () => Promise<void>;
  reduced: boolean;
}) {
  return (
    <div
      className="mt-4"
      style={{
        animation: reduced ? "none" : `fadeIn 300ms ${staggerDelay(4)} var(--ease-out) both`,
      }}
    >
      <div className="flex items-center gap-3" style={{ color: "var(--text-tertiary)" }}>
        <div className="h-px flex-1" style={{ backgroundColor: "var(--border-default)" }} />
        <span className="text-xs">of</span>
        <div className="h-px flex-1" style={{ backgroundColor: "var(--border-default)" }} />
      </div>
      <form action={googleSignInAction} className="mt-4">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
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
  );
}
