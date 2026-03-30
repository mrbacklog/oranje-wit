"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@oranje-wit/types";
import { IOSInstallInstructie } from "./ios-install-instructie";

/* ================================================================
   PWA Install Prompt
   ================================================================
   Subtiele banner onderaan het scherm die de native install-prompt
   triggert op Android/Chrome. Op iOS toont het de IOSInstallInstructie.

   Gedrag:
   - Verschijnt pas na het 2e bezoek (localStorage)
   - Na "Later": verdwijnt voor 7 dagen
   - Na sluiten (X): verdwijnt voor 30 dagen
   - Na "Installeren": trigger native prompt (Android) of toon iOS instructie
   - Detecteert display-mode: standalone — toont NIETS als al geinstalleerd
   - Max 3x tonen, daarna nooit meer
   ================================================================ */

const STORAGE_KEY = "ow-pwa-install";
const VISIT_COUNT_KEY = "ow-visit-count";

interface InstallState {
  dismissed: number; // Aantal keer weggeknikt
  lastDismiss: number; // Timestamp van laatste dismiss
  installed: boolean;
  dismissType: "later" | "close" | null;
}

function getInstallState(): InstallState {
  if (typeof window === "undefined") {
    return { dismissed: 0, lastDismiss: 0, installed: false, dismissType: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt localStorage
  }
  return { dismissed: 0, lastDismiss: 0, installed: false, dismissType: null };
}

function saveInstallState(state: InstallState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded
  }
}

function getVisitCount(): number {
  try {
    return parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? "0", 10);
  } catch {
    return 0;
  }
}

function incrementVisitCount(): number {
  const count = getVisitCount() + 1;
  try {
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
  } catch {
    // quota exceeded
  }
  return count;
}

/** Detecteer of de app al als standalone draait */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Check display-mode media query
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari standalone check
  if ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone)
    return true;
  return false;
}

/** Detecteer iOS Safari */
function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS && isSafari;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showIOSInstructie, setShowIOSInstructie] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Standalone? Nooit tonen
    if (isStandalone()) return;

    // Track bezoeken
    const visits = incrementVisitCount();
    if (visits < 2) return; // Pas na 2e bezoek

    const state = getInstallState();

    // Al geinstalleerd? Nooit meer tonen
    if (state.installed) return;

    // Max 3x getoond
    if (state.dismissed >= 3) return;

    // Cooldown controleren
    if (state.lastDismiss > 0) {
      const now = Date.now();
      const cooldownMs =
        state.dismissType === "later"
          ? 7 * 24 * 60 * 60 * 1000 // 7 dagen
          : 30 * 24 * 60 * 60 * 1000; // 30 dagen (close)
      if (now - state.lastDismiss < cooldownMs) return;
    }

    // Op iOS Safari: direct tonen (geen beforeinstallprompt event)
    if (isIOSSafari()) {
      setVisible(true);
      return;
    }

    // Android/Chrome: wacht op beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
      logger.info("[PWA] Install prompt beschikbaar");
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detecteer installatie
    const installedHandler = () => {
      const s = getInstallState();
      s.installed = true;
      saveInstallState(s);
      setVisible(false);
      logger.info("[PWA] App geinstalleerd");
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleDismiss = useCallback((type: "later" | "close") => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      const state = getInstallState();
      state.dismissed += 1;
      state.lastDismiss = Date.now();
      state.dismissType = type;
      saveInstallState(state);
    }, 300);
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS: toon instructie
    if (isIOSSafari()) {
      setShowIOSInstructie(true);
      return;
    }

    // Android/Chrome: trigger native prompt
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === "accepted") {
        const state = getInstallState();
        state.installed = true;
        saveInstallState(state);
        setVisible(false);
        logger.info("[PWA] Installatie geaccepteerd");
      } else {
        handleDismiss("later");
      }
    } catch (error) {
      logger.warn("[PWA] Install prompt fout:", error);
    }
    deferredPromptRef.current = null;
  }, [handleDismiss]);

  if (!visible && !showIOSInstructie) return null;

  if (showIOSInstructie) {
    return (
      <IOSInstallInstructie
        onClose={() => {
          setShowIOSInstructie(false);
          handleDismiss("later");
        }}
      />
    );
  }

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 px-4 pb-6"
      style={{
        opacity: closing ? 0 : 1,
        transform: closing ? "translateY(100%)" : "translateY(0)",
        transition: "opacity 300ms var(--ease-default), transform 300ms var(--ease-default)",
        animation: "slideUpIn 400ms var(--ease-spring) forwards",
      }}
    >
      <div
        className="relative mx-auto max-w-md overflow-hidden rounded-2xl border"
        style={{
          background: "rgba(34, 38, 46, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-xl), 0 0 60px rgba(255, 107, 0, 0.06)",
        }}
      >
        {/* Oranje accent-lijn links */}
        <div
          className="absolute top-0 bottom-0 left-0 w-1"
          style={{
            background: "linear-gradient(180deg, var(--ow-oranje-600), var(--ow-oranje-400))",
          }}
        />

        {/* Sluiten-knop */}
        <button
          type="button"
          onClick={() => handleDismiss("close")}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Sluiten"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <div className="flex items-start gap-4 py-4 pr-10 pl-5">
          {/* App icoon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-400))",
              boxShadow: "0 0 20px rgba(255, 107, 0, 0.2)",
            }}
          >
            OW
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Zet op je startscherm
            </h3>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Open Oranje Wit direct, zonder browser. Werkt ook offline.
            </p>

            {/* Knoppen */}
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--ow-oranje-600), var(--ow-oranje-500))",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
                }}
              >
                Installeren
              </button>
              <button
                type="button"
                onClick={() => handleDismiss("later")}
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-up animatie (inline keyframe) */}
      <style>{`
        @keyframes slideUpIn {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

/* ── Type definitie voor beforeinstallprompt event ─────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
