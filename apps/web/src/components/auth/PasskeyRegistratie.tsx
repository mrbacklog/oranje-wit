"use client";

/**
 * PasskeyRegistratie — component voor het registreren van een WebAuthn passkey.
 *
 * Toont een knop "Stel vingerafdruk in voor sneller inloggen".
 * Bij klik: start de WebAuthn registratie-ceremonie via @simplewebauthn/browser.
 * Detecteert automatisch of WebAuthn beschikbaar is op het device.
 */

import { useState, useEffect, useCallback } from "react";
import { startRegistration } from "@simplewebauthn/browser";

type Status = "idle" | "loading" | "success" | "error" | "unsupported";

export function PasskeyRegistratie() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Detecteer WebAuthn beschikbaarheid
  useEffect(() => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setStatus("unsupported");
    }
  }, []);

  const handleRegistreer = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      // Stap 1: Haal registratie-opties op van de server
      const optiesResponse = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });

      if (!optiesResponse.ok) {
        const body = await optiesResponse.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Kon registratie-opties niet ophalen");
      }

      const optiesJson = await optiesResponse.json();
      const opties = optiesJson.data;

      // Stap 2: Start de WebAuthn ceremonie in de browser
      const registratieResponse = await startRegistration({ optionsJSON: opties });

      // Stap 3: Stuur de response naar de server voor verificatie
      const verifyResponse = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: registratieResponse,
          deviceName: detectDeviceName(),
        }),
      });

      if (!verifyResponse.ok) {
        const body = await verifyResponse.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Verificatie mislukt");
      }

      setStatus("success");
    } catch (error) {
      // WebAuthn annulering door gebruiker
      if (
        error instanceof Error &&
        (error.name === "NotAllowedError" ||
          error.message.includes("cancelled") ||
          error.message.includes("canceled"))
      ) {
        setStatus("idle");
        return;
      }

      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Er ging iets mis bij het registreren"
      );
    }
  }, []);

  // Niet tonen als WebAuthn niet beschikbaar is
  if (status === "unsupported") {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      {status === "success" ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-white">Vingerafdruk ingesteld!</p>
            <p className="text-sm text-white/60">
              Je kunt nu snel inloggen met je vingerafdruk of gezichtsherkenning.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
              <svg
                className="h-5 w-5 text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Sneller inloggen</p>
              <p className="mt-0.5 text-sm text-white/60">
                Stel je vingerafdruk of gezichtsherkenning in zodat je volgende keer direct kunt
                inloggen.
              </p>
            </div>
          </div>

          {status === "error" && errorMessage && (
            <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleRegistreer}
            disabled={status === "loading"}
            className="mt-3 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Bezig...
              </span>
            ) : (
              "Vingerafdruk instellen"
            )}
          </button>
        </>
      )}
    </div>
  );
}

/** Detecteer een leesbare device-naam voor weergave */
function detectDeviceName(): string {
  if (typeof navigator === "undefined") return "Onbekend";
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Onbekend apparaat";
}
