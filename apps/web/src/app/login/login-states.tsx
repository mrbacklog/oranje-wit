"use client";

import { GoogleIcon, FingerprintIcon, EnvelopeIcon, ExternalLinkIcon } from "./login-icons";
import { getEmailDeepLinks, prefersReducedMotion, staggerDelay } from "./login-helpers";

/* ═══════════════════════════════════════════════════════════════
   Staat 1: Passkey beschikbaar — vingerafdruk/Face ID
   ═══════════════════════════════════════════════════════════════ */

export function PasskeyStaat({
  onLogin,
  onFallback,
}: {
  onLogin: () => void;
  onFallback: () => void;
}) {
  const reduced = prefersReducedMotion();
  return (
    <div
      className="mt-8 overflow-hidden rounded-xl border"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-lg)",
        animation: reduced ? "none" : `cardAppear 400ms ${staggerDelay(3)} var(--ease-spring) both`,
      }}
    >
      <button
        type="button"
        onClick={onLogin}
        className="w-full cursor-pointer p-8 text-center transition-all active:scale-[0.97]"
        style={{ minHeight: "96px" }}
        aria-label="Inloggen met vingerafdruk of Face ID"
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(255, 107, 0, 0.08)",
            animation: reduced ? "none" : "passkeyPulse 3s ease-in-out infinite",
          }}
        >
          <FingerprintIcon />
        </div>
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Inloggen met vingerafdruk
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Tik om in te loggen
        </p>
      </button>
      <div className="mx-6 h-px" style={{ backgroundColor: "var(--border-default)" }} />
      <div className="p-4 text-center">
        <button
          type="button"
          onClick={onFallback}
          className="cursor-pointer text-sm transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          Of log in met e-mail
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Google redirect voor TC-leden
   ═══════════════════════════════════════════════════════════════ */

export function GoogleStaat({
  googleSignInAction,
  onBack,
}: {
  googleSignInAction: () => Promise<void>;
  onBack: () => void;
}) {
  const reduced = prefersReducedMotion();
  return (
    <div
      className="mt-8 rounded-xl border p-6"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-lg)",
        animation: reduced ? "none" : "slideLeft 300ms var(--ease-default) both",
      }}
    >
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
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.97]"
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
        onClick={onBack}
        className="mt-3 w-full cursor-pointer text-xs transition-colors"
        style={{ color: "var(--text-tertiary)" }}
      >
        Ander e-mailadres gebruiken
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Staat 4: "Check je inbox" — met deep-links
   ═══════════════════════════════════════════════════════════════ */

export function SmartlinkStaat({
  email,
  retryTimer,
  onRetry,
  onBack,
}: {
  email: string;
  retryTimer: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const reduced = prefersReducedMotion();
  const links = getEmailDeepLinks(email);

  return (
    <div
      className="mt-8 rounded-xl border p-6 text-center"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-lg)",
        animation: reduced ? "none" : "cardAppear 400ms var(--ease-spring) both",
      }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: "rgba(34, 197, 94, 0.12)",
          animation: reduced ? "none" : "envelopeFly 800ms var(--ease-spring) both",
        }}
      >
        <EnvelopeIcon />
      </div>

      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Check je inbox!
      </h2>

      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        We hebben een inloglink gestuurd naar{" "}
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {email}
        </span>
      </p>

      <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
        De link is 14 dagen geldig. Check ook je spam-map.
      </p>

      {links.length > 0 && (
        <div className="mt-4 flex justify-center gap-3">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-all active:scale-[0.97]"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                backgroundColor: "var(--surface-sunken)",
              }}
            >
              <ExternalLinkIcon />
              {link.label}
            </a>
          ))}
        </div>
      )}

      {retryTimer === 0 && (
        <p
          className="mt-4 text-xs"
          style={{
            color: "var(--text-tertiary)",
            animation: reduced ? "none" : "fadeIn 300ms var(--ease-out) both",
          }}
        >
          Nog niks ontvangen?{" "}
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer font-medium underline transition-colors"
            style={{ color: "var(--ow-oranje-400)" }}
          >
            Probeer opnieuw
          </button>
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-4 cursor-pointer text-xs transition-colors"
        style={{ color: "var(--text-tertiary)" }}
      >
        Ander e-mailadres gebruiken
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dev login (alleen in development)
   ═══════════════════════════════════════════════════════════════ */

export function DevLoginStaat({
  devEmail,
  setDevEmail,
  devLaden,
  onSubmit,
}: {
  devEmail: string;
  setDevEmail: (v: string) => void;
  devLaden: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
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
      <form onSubmit={onSubmit}>
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
  );
}
