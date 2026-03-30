"use client";

import { useState } from "react";

/**
 * Client component voor de smartlink login.
 *
 * Toont een duidelijke "Inloggen" knop die de gebruiker zelf moet klikken.
 * Dit voorkomt dat email security scanners (die GET-requests doen en
 * auto-submit detecteren) per ongeluk een sessie aanmaken.
 *
 * De daadwerkelijke login (POST naar NextAuth) vindt pas plaats
 * wanneer de gebruiker op de knop klikt.
 */
export function SmartlinkLoginKnop({
  naam,
  email,
  aanmeldenAction,
}: {
  naam: string;
  email: string;
  aanmeldenAction: () => Promise<void>;
}) {
  const [laden, setLaden] = useState(false);

  return (
    <div className="w-full max-w-sm text-center">
      {/* OW logo */}
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white"
        style={{
          background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
          boxShadow: "0 0 40px rgba(255, 107, 0, 0.25)",
        }}
      >
        OW
      </div>

      {/* Welkomtekst */}
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Welkom{naam ? `, ${naam}` : ""}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Klik hieronder om in te loggen als{" "}
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {naam || email}
        </span>
      </p>

      {/* Login knop — grote, duidelijke CTA */}
      <form
        action={async () => {
          setLaden(true);
          try {
            await aanmeldenAction();
          } catch {
            // Bij fout: knop weer vrijgeven
            setLaden(false);
          }
        }}
        className="mt-8"
      >
        <button
          type="submit"
          disabled={laden}
          className="w-full cursor-pointer rounded-xl px-6 py-4 text-base font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
            boxShadow: laden ? "none" : "0 4px 20px rgba(255, 107, 0, 0.4)",
            minHeight: "56px",
          }}
        >
          {laden ? "Even geduld..." : "Inloggen"}
        </button>
      </form>

      {/* Subtiele hint */}
      <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
        Je wordt ingelogd via een beveiligde link
      </p>
    </div>
  );
}
