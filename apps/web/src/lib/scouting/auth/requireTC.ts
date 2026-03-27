import { guardTC, guardScout } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import { fail } from "@/lib/api/response";

// Prisma 7 type recursion workaround
const db = prisma as any;

type TCScout = {
  id: string;
  naam: string;
  email: string;
  rol: "TC";
};

export type RequireTCResult =
  | { ok: true; scout: TCScout; userId: string }
  | { ok: false; response: Response };

/**
 * Verifieer dat de ingelogde gebruiker TC-lid is EN een Scout-profiel heeft.
 *
 * Stap 1: centrale auth-guard (JWT-based, geen DB query)
 * Stap 2: Scout-profiel ophalen (data-lookup)
 *
 * Retourneert het scout-profiel of een 401/403 fout-response.
 */
export async function requireTC(): Promise<RequireTCResult> {
  // Stap 1: centrale auth-check (JWT)
  const auth = await guardTC();
  if (!auth.ok) return auth;

  // Stap 2: Scout-profiel ophalen
  const scout = await db.scout.findUnique({
    where: { email: auth.session.user.email },
    select: { id: true, naam: true, email: true, rol: true, userId: true },
  });

  if (!scout || scout.rol !== "TC") {
    return {
      ok: false,
      response: fail("Alleen TC-leden mogen deze actie uitvoeren", 403, "FORBIDDEN"),
    };
  }

  return {
    ok: true,
    scout: { id: scout.id, naam: scout.naam, email: scout.email, rol: scout.rol },
    userId: scout.userId,
  };
}

type AuthScout = {
  id: string;
  naam: string;
  email: string;
  rol: "SCOUT" | "TC";
};

export type RequireScoutResult = { ok: true; scout: AuthScout } | { ok: false; response: Response };

/**
 * Verifieer dat de ingelogde gebruiker scout of TC-lid is EN een Scout-profiel heeft.
 *
 * Stap 1: centrale auth-guard (JWT-based, geen DB query)
 * Stap 2: Scout-profiel ophalen (data-lookup)
 *
 * Retourneert het scout-profiel of een 401/403 fout-response.
 */
export async function requireScout(): Promise<RequireScoutResult> {
  // Stap 1: centrale auth-check (JWT)
  const auth = await guardScout();
  if (!auth.ok) return auth;

  // Stap 2: Scout-profiel ophalen
  const scout = await db.scout.findUnique({
    where: { email: auth.session.user.email },
    select: { id: true, naam: true, email: true, rol: true },
  });

  if (!scout) {
    return {
      ok: false,
      response: fail("Geen scout-profiel gevonden", 403, "NO_SCOUT_PROFILE"),
    };
  }

  return {
    ok: true,
    scout: { id: scout.id, naam: scout.naam, email: scout.email, rol: scout.rol },
  };
}
