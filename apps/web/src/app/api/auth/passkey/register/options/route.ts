/**
 * POST /api/auth/passkey/register/options
 *
 * Genereer WebAuthn registratie-opties.
 * Vereist een actieve sessie (de gebruiker moet al ingelogd zijn).
 */

import { auth } from "@oranje-wit/auth";
import { generateRegistrationOpts } from "@oranje-wit/auth/passkey";
import { ok, fail } from "@oranje-wit/types";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return fail("Niet ingelogd", 401, "UNAUTHORIZED");
  }

  try {
    // Zoek de Gebruiker op in de database
    const gebruiker = await prisma.gebruiker.findUnique({
      where: { email: session.user.email },
    });

    if (!gebruiker) {
      return fail("Gebruiker niet gevonden", 404, "NOT_FOUND");
    }

    const options = await generateRegistrationOpts(gebruiker.id, gebruiker.email, gebruiker.naam);

    return ok(options);
  } catch (error) {
    logger.warn("Passkey registratie-opties fout:", error);
    return fail(error instanceof Error ? error.message : "Interne fout", 500, "INTERNAL_ERROR");
  }
}
