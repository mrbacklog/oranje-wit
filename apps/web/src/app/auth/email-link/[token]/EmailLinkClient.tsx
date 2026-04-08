"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { logger } from "@oranje-wit/types";

/**
 * Client component voor de email-link login knop.
 *
 * Roept NextAuth signIn("email-link") aan met het HMAC-token.
 * Na succesvolle login: redirect naar destination of homepage.
 */
export function EmailLinkClient({
  token,
  naam,
  destination,
}: {
  token: string;
  naam: string;
  destination?: string;
}) {
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState(false);

  async function handleLogin() {
    setLaden(true);
    setFout(false);
    try {
      // signIn met redirect:true navigeert weg (return type: never).
      // Als er een fout optreedt, gooit het een error.
      await signIn("email-link", {
        token,
        redirectTo: destination || "/",
        redirect: true,
      });
    } catch (error) {
      logger.warn("Email-link login mislukt:", error);
      setFout(true);
      setLaden(false);
    }
  }

  return (
    <div className="w-full max-w-sm text-center">
      {/* Logo */}
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
        Welkom terug
      </h1>

      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Inloggen als {naam}
      </p>

      {destination && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Je wordt doorgestuurd na het inloggen.
        </p>
      )}

      {/* Login knop */}
      <button
        type="button"
        onClick={handleLogin}
        disabled={laden}
        className="mt-6 w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
          boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
        }}
      >
        {laden ? "Even geduld..." : "Inloggen"}
      </button>

      {/* Foutmelding */}
      {fout && (
        <p className="mt-3 text-xs" style={{ color: "var(--color-error-500, #ef4444)" }}>
          Er ging iets mis bij het inloggen. Probeer het opnieuw.
        </p>
      )}
    </div>
  );
}
