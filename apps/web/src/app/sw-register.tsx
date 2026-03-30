"use client";

import { useEffect } from "react";
import { logger } from "@oranje-wit/types";

/**
 * Registreert de custom service worker.
 * Alleen in production (navigator.serviceWorker is beschikbaar).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Registreer bij window load om de initiële paginalaadtijd niet te vertragen
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              logger.info("[SW] Nieuwe versie geactiveerd");
            }
          });
        });

        logger.info("[SW] Geregistreerd, scope:", registration.scope);
      } catch (error) {
        logger.warn("[SW] Registratie mislukt:", error);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
