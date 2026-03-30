/**
 * POST /api/auth/passkey/authenticate/verify
 *
 * Verifieer de WebAuthn authenticatie-response en log in.
 * Publiek endpoint — geen sessie vereist (dit IS de login-stap).
 *
 * Retourneert de challengeKey en response die de client kan gebruiken
 * om via signIn("passkey", { ... }) een NextAuth sessie te starten.
 */

import { verifyAuthentication } from "@oranje-wit/auth/passkey";
import { ok, fail, parseBody } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import { z } from "zod";

const Schema = z.object({
  response: z.record(z.unknown()),
  challengeKey: z.string(),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;

    const result = await verifyAuthentication(
      parsed.data.response as never, // AuthenticationResponseJSON
      parsed.data.challengeKey
    );

    if (!result.verified) {
      return fail(result.error ?? "Authenticatie mislukt", 401, "AUTH_FAILED");
    }

    // Retourneer de gebruiker-info zodat de client signIn("passkey") kan aanroepen
    return ok({
      verified: true,
      email: result.gebruiker.email,
    });
  } catch (error) {
    logger.warn("Passkey authenticatie-verificatie fout:", error);
    return fail(error instanceof Error ? error.message : "Interne fout", 500, "INTERNAL_ERROR");
  }
}
