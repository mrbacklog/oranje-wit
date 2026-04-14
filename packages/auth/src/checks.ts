/**
 * Auth guards voor c.k.v. Oranje Wit
 *
 * Twee patronen:
 *
 * 1. require*() — throw-based, voor Server Actions
 *    ```ts
 *    const session = await requireTC(); // throws als niet TC
 *    ```
 *
 * 2. guard*() — result-based, voor API routes
 *    ```ts
 *    const result = await guardTC();
 *    if (!result.ok) return result.response;
 *    const { session } = result;
 *    ```
 *
 * Alle guards gebruiken de capabilities uit de JWT sessie
 * (isTC, isScout, clearance, doelgroepen). Geen database-queries.
 */

import { auth } from "./index";
import { fail } from "@oranje-wit/types";
import type { Clearance } from "@oranje-wit/types";

// ============================================================
// Types
// ============================================================

/** Getypte sessie met capability-velden uit de JWT */
export interface AuthSession {
  user: {
    email: string;
    name?: string | null;
    isTC: boolean;
    isScout: boolean;
    clearance: Clearance;
    doelgroepen: string[];
    role?: string;
    provider?: string;
    authMethode?: string;
    isAgent?: boolean;
    agentRunId?: string;
  };
}

/** Result type voor guard*() functies */
export type AuthResult<T = AuthSession> =
  | { ok: true; session: T }
  | { ok: false; response: Response };

// ============================================================
// require*() — throw-based guards (voor Server Actions)
// ============================================================

/**
 * Controleer dat er een geldige sessie is.
 * Gooit een Error als de gebruiker niet is ingelogd.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Niet ingelogd");
  }
  return session;
}

/**
 * Controleer dat de gebruiker TC-lid is (isTC capability).
 * Gooit een Error als de gebruiker geen TC-lid is.
 */
export async function requireTC() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    throw new Error("Niet geautoriseerd — alleen TC-leden");
  }
  return session;
}

/**
 * Controleer dat de gebruiker scout of TC-lid is.
 * Gooit een Error als de gebruiker geen scout of TC-lid is.
 */
export async function requireScout() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const isScout = user?.isScout === true;
  const isTC = user?.isTC === true;
  if (!session?.user || (!isScout && !isTC)) {
    throw new Error("Niet geautoriseerd — alleen scouts en TC-leden");
  }
  return session;
}

/**
 * Controleer dat de gebruiker TC-lid of coordinator is.
 * Gooit een Error als de gebruiker geen TC-lid of coordinator is.
 */
export async function requireCoordinator() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const isTC = user?.isTC === true;
  const doelgroepen = (user?.doelgroepen as string[]) ?? [];
  const isCoordinator = doelgroepen.length > 0;
  if (!session?.user || (!isTC && !isCoordinator)) {
    throw new Error("Niet geautoriseerd — alleen TC-leden en coördinatoren");
  }
  return session;
}

// ============================================================
// guard*() — result-based guards (voor API routes)
// ============================================================

/**
 * Guard: controleer dat er een geldige sessie is.
 * Retourneert `{ ok: true, session }` of `{ ok: false, response }`.
 */
export async function guardAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, response: fail("Niet ingelogd", 401, "UNAUTHORIZED") };
  }
  // Cast de sessie naar AuthSession — de JWT callback vult deze velden
  const user = session.user as Record<string, unknown>;
  const typed: AuthSession = {
    user: {
      email: session.user.email!,
      name: session.user.name,
      isTC: (user.isTC as boolean) ?? false,
      isScout: (user.isScout as boolean) ?? false,
      clearance: (user.clearance as Clearance) ?? 0,
      doelgroepen: (user.doelgroepen as string[]) ?? [],
      role: user.role as string | undefined,
      provider: user.provider as string | undefined,
      authMethode: user.authMethode as string | undefined,
      isAgent: user.isAgent as boolean | undefined,
      agentRunId: user.agentRunId as string | undefined,
    },
  };
  return { ok: true, session: typed };
}

/**
 * Guard: controleer dat de gebruiker TC-lid is.
 * TC-leden hebben `isTC: true` in hun JWT.
 */
export async function guardTC(): Promise<AuthResult> {
  const result = await guardAuth();
  if (!result.ok) return result;
  if (!result.session.user.isTC) {
    return { ok: false, response: fail("Alleen TC-leden", 403, "FORBIDDEN") };
  }
  return result;
}

/**
 * Guard: controleer dat de gebruiker scout of TC-lid is.
 */
export async function guardScout(): Promise<AuthResult> {
  const result = await guardAuth();
  if (!result.ok) return result;
  const { isScout, isTC } = result.session.user;
  if (!isScout && !isTC) {
    return { ok: false, response: fail("Alleen scouts en TC-leden", 403, "FORBIDDEN") };
  }
  return result;
}

/**
 * Guard: controleer dat de gebruiker TC-lid of coordinator is.
 * Coordinatoren hebben minstens 1 doelgroep.
 */
export async function guardCoordinator(): Promise<AuthResult> {
  const result = await guardAuth();
  if (!result.ok) return result;
  const { isTC, doelgroepen } = result.session.user;
  if (!isTC && (!doelgroepen || doelgroepen.length === 0)) {
    return {
      ok: false,
      response: fail("Alleen TC-leden en coordinatoren", 403, "FORBIDDEN"),
    };
  }
  return result;
}

/**
 * Guard: controleer dat de gebruiker minimaal het opgegeven clearance-niveau heeft.
 *
 * @param minLevel - Minimaal vereist clearance-niveau (0-3)
 */
export async function guardClearance(minLevel: Clearance): Promise<AuthResult> {
  const result = await guardAuth();
  if (!result.ok) return result;
  const clearance = result.session.user.clearance ?? 0;
  if (clearance < minLevel) {
    return {
      ok: false,
      response: fail(`Clearance ${minLevel} vereist`, 403, "INSUFFICIENT_CLEARANCE"),
    };
  }
  return result;
}
