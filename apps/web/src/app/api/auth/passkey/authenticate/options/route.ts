/**
 * POST /api/auth/passkey/authenticate/options
 *
 * Genereer WebAuthn authenticatie-opties.
 * Publiek endpoint — geen sessie vereist (dit IS de login-stap).
 */

import { generateAuthenticationOpts } from "@oranje-wit/auth/passkey";
import { ok, fail, parseBody } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;

    const { options, challengeKey } = await generateAuthenticationOpts(parsed.data.email);

    return ok({ options, challengeKey });
  } catch (error) {
    logger.warn("Passkey authenticatie-opties fout:", error);
    return fail(error instanceof Error ? error.message : "Interne fout", 500, "INTERNAL_ERROR");
  }
}
