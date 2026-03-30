/**
 * POST /api/auth/passkey/register/verify
 *
 * Verifieer de WebAuthn registratie-response en sla de passkey op.
 * Vereist een actieve sessie (de gebruiker moet al ingelogd zijn).
 */

import { auth } from "@oranje-wit/auth";
import { verifyAndSaveRegistration } from "@oranje-wit/auth/passkey";
import { ok, fail, parseBody } from "@oranje-wit/types";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { z } from "zod";

const Schema = z.object({
  response: z.record(z.unknown()),
  deviceName: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return fail("Niet ingelogd", 401, "UNAUTHORIZED");
  }

  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;

    // Zoek de Gebruiker op
    const gebruiker = await prisma.gebruiker.findUnique({
      where: { email: session.user.email },
    });

    if (!gebruiker) {
      return fail("Gebruiker niet gevonden", 404, "NOT_FOUND");
    }

    const result = await verifyAndSaveRegistration(
      gebruiker.id,
      parsed.data.response as never, // RegistrationResponseJSON
      parsed.data.deviceName
    );

    if (!result.verified) {
      return fail(result.error ?? "Verificatie mislukt", 400, "VERIFICATION_FAILED");
    }

    return ok({ verified: true });
  } catch (error) {
    logger.warn("Passkey registratie-verificatie fout:", error);
    return fail(error instanceof Error ? error.message : "Interne fout", 500, "INTERNAL_ERROR");
  }
}
