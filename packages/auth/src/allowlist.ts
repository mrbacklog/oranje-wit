export type Rol = "EDITOR" | "REVIEWER" | "VIEWER";

/**
 * Hardcoded fallback — wordt gebruikt als de Gebruiker-tabel
 * nog niet bestaat of als de DB niet bereikbaar is.
 */
const ALLOWED_USERS: Record<string, Rol> = {
  "antjanlaban@gmail.com": "EDITOR",
  "merelvangurp@gmail.com": "EDITOR",
  "thomasisarin@gmail.com": "EDITOR",
};

/** Primaire admin (TC-voorzitter) */
export const ADMIN_EMAIL = "antjanlaban@gmail.com";

/**
 * Type voor de database-lookup functie.
 * Wordt geïnjecteerd door de app via `setDbLookup()`.
 */
export type DbRolLookup = (email: string) => Promise<{
  rol: string;
  actief: boolean;
} | null>;

/** Geïnjecteerde DB-lookup functie (null = niet geconfigureerd) */
let dbLookup: DbRolLookup | null = null;

/**
 * Registreer een database-lookup functie.
 * Moet door elke app worden aangeroepen bij initialisatie.
 *
 * Voorbeeld:
 * ```ts
 * import { setDbLookup } from "@oranje-wit/auth/allowlist";
 * import { prisma } from "@oranje-wit/database";
 *
 * setDbLookup(async (email) => {
 *   const g = await prisma.gebruiker.findUnique({ where: { email } });
 *   return g ? { rol: g.rol, actief: g.actief } : null;
 * });
 * ```
 */
export function setDbLookup(fn: DbRolLookup): void {
  dbLookup = fn;
}

/**
 * Bepaal de rol voor een e-mailadres.
 *
 * 1. Als een DB-lookup is geregistreerd, check de Gebruiker-tabel
 * 2. Als de gebruiker inactief is, return null (geblokkeerd)
 * 3. Fallback naar hardcoded ALLOWED_USERS
 */
export async function getAllowedRole(email: string): Promise<Rol | null> {
  if (dbLookup) {
    try {
      const gebruiker = await dbLookup(email.toLowerCase());
      if (gebruiker) {
        return gebruiker.actief ? (gebruiker.rol as Rol) : null;
      }
    } catch {
      // DB niet bereikbaar — fallback naar hardcoded lijst
    }
  }
  return ALLOWED_USERS[email.toLowerCase()] ?? null;
}
