import type { Clearance } from "@oranje-wit/types";

/**
 * Capabilities van een gebruiker.
 * Vervangt het oude Rol-enum systeem.
 */
export interface GebruikerCapabilities {
  isTC: boolean;
  isScout: boolean;
  clearance: Clearance;
  doelgroepen: string[];
  actief: boolean;
}

/** Primaire admin (TC-voorzitter) */
export const ADMIN_EMAIL = "antjanlaban@gmail.com";

/**
 * Hardcoded TC-leden — fallback als de Gebruiker-tabel
 * niet bereikbaar is.
 */
const TC_FALLBACK: Record<string, GebruikerCapabilities> = {
  "antjanlaban@gmail.com": {
    isTC: true,
    isScout: false,
    clearance: 3,
    doelgroepen: ["ALLE"],
    actief: true,
  },
  "merelvangurp@gmail.com": {
    isTC: true,
    isScout: false,
    clearance: 3,
    doelgroepen: ["ALLE"],
    actief: true,
  },
  "thomasisarin@gmail.com": {
    isTC: true,
    isScout: false,
    clearance: 3,
    doelgroepen: ["ALLE"],
    actief: true,
  },
};

/**
 * Type voor de database-lookup functie.
 * Wordt geïnjecteerd door de app via `setDbLookup()`.
 */
export type DbCapabilityLookup = (email: string) => Promise<GebruikerCapabilities | null>;

/** Geïnjecteerde DB-lookup functie (null = niet geconfigureerd) */
let dbLookup: DbCapabilityLookup | null = null;

/**
 * Registreer een database-lookup functie.
 * Moet door de app worden aangeroepen bij initialisatie (instrumentation.ts).
 */
export function setDbLookup(fn: DbCapabilityLookup): void {
  dbLookup = fn;
}

/**
 * Bepaal de capabilities voor een e-mailadres.
 *
 * 1. Als een DB-lookup is geregistreerd, check de Gebruiker-tabel
 * 2. Als de gebruiker inactief is, return null (geblokkeerd)
 * 3. Fallback naar hardcoded TC_FALLBACK
 */
export async function getCapabilities(email: string): Promise<GebruikerCapabilities | null> {
  if (dbLookup) {
    try {
      const cap = await dbLookup(email.toLowerCase());
      if (cap) return cap.actief ? cap : null;
    } catch {
      // DB niet bereikbaar — fallback naar hardcoded lijst
    }
  }
  return TC_FALLBACK[email.toLowerCase()] ?? null;
}
