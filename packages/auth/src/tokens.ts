/**
 * ToegangsToken helpers — tijdelijke links voor evaluaties, scouting, etc.
 *
 * Deze tokens werken BUITEN NextAuth: het zijn standalone, scoped
 * toegangslinks die geen account vereisen. De link IS de authenticatie.
 *
 * Flow:
 * 1. TC maakt uitnodiging -> maakToegangsToken() genereert token
 * 2. Email met link: https://evaluatie.ckvoranjewit.app/t/{token}
 * 3. App valideert: valideerToegangsToken(token)
 * 4. Na gebruik: markeerTokenGebruikt(token) (token blijft geldig tot verlooptOp)
 */

import { logger } from "@oranje-wit/types";

/** Standaard geldigheidsduur in dagen */
const STANDAARD_GELDIGHEID_DAGEN = 14;

/**
 * Type voor de Prisma client — geïnjecteerd om directe dependency
 * op @oranje-wit/database te vermijden.
 */
interface PrismaTokenClient {
  toegangsToken: {
    create: (args: {
      data: {
        email: string;
        naam?: string;
        type: string;
        scope: unknown;
        verlooptOp: Date;
      };
    }) => Promise<{ token: string }>;
    findUnique: (args: { where: { token: string } }) => Promise<{
      id: string;
      token: string;
      email: string;
      naam: string | null;
      type: string;
      scope: unknown;
      verlooptOp: Date;
      gebruiktOp: Date | null;
      actief: boolean;
    } | null>;
    update: (args: { where: { token: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
}

/** Geïnjecteerde Prisma client */
let prismaClient: PrismaTokenClient | null = null;

/**
 * Registreer de Prisma client voor token-operaties.
 * Moet door de app worden aangeroepen bij initialisatie.
 *
 * Voorbeeld:
 * ```ts
 * import { setPrismaClient } from "@oranje-wit/auth/tokens";
 * import { prisma } from "@oranje-wit/database";
 * setPrismaClient(prisma);
 * ```
 */
export function setPrismaClient(client: PrismaTokenClient): void {
  prismaClient = client;
}

function getPrisma(): PrismaTokenClient {
  if (!prismaClient) {
    throw new Error(
      "Prisma client niet geconfigureerd voor tokens. Roep setPrismaClient() aan bij app-initialisatie."
    );
  }
  return prismaClient;
}

/** Resultaat van token-validatie */
export interface TokenValidatieResultaat {
  ok: boolean;
  data?: {
    email: string;
    naam: string | null;
    type: string;
    scope: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Maak een nieuw toegangstoken aan.
 *
 * @returns De token-string die in de URL wordt opgenomen
 */
export async function maakToegangsToken(data: {
  email: string;
  naam?: string;
  type: string;
  scope: Record<string, unknown>;
  verlooptOverDagen?: number;
}): Promise<string> {
  const prisma = getPrisma();
  const dagen = data.verlooptOverDagen ?? STANDAARD_GELDIGHEID_DAGEN;
  const verlooptOp = new Date();
  verlooptOp.setDate(verlooptOp.getDate() + dagen);

  const result = await prisma.toegangsToken.create({
    data: {
      email: data.email,
      naam: data.naam,
      type: data.type,
      scope: data.scope,
      verlooptOp,
    },
  });

  logger.info(
    `ToegangsToken aangemaakt voor ${data.email} (type: ${data.type}, geldig tot ${verlooptOp.toISOString()})`
  );

  return result.token;
}

/**
 * Valideer een toegangstoken.
 *
 * Controles:
 * 1. Token bestaat
 * 2. Token is actief
 * 3. Token is niet verlopen
 */
export async function valideerToegangsToken(token: string): Promise<TokenValidatieResultaat> {
  const prisma = getPrisma();

  const record = await prisma.toegangsToken.findUnique({
    where: { token },
  });

  if (!record) {
    return { ok: false, error: "Token niet gevonden" };
  }

  if (!record.actief) {
    return { ok: false, error: "Token is gedeactiveerd" };
  }

  if (new Date() > record.verlooptOp) {
    return {
      ok: false,
      error: "Deze link is verlopen. Neem contact op met de TC.",
    };
  }

  return {
    ok: true,
    data: {
      email: record.email,
      naam: record.naam,
      type: record.type,
      scope: record.scope as Record<string, unknown>,
    },
  };
}

/**
 * Markeer een token als gebruikt (registreert tijdstip eerste gebruik).
 * Het token blijft geldig tot verlooptOp — dit is alleen voor tracking.
 */
export async function markeerTokenGebruikt(token: string): Promise<void> {
  const prisma = getPrisma();

  await prisma.toegangsToken.update({
    where: { token },
    data: { gebruiktOp: new Date() },
  });
}

/**
 * Deactiveer een token (bijv. bij annulering van een uitnodiging).
 * Het token wordt niet verwijderd maar gemarkeerd als inactief.
 */
export async function deactiveerToken(token: string): Promise<void> {
  const prisma = getPrisma();

  await prisma.toegangsToken.update({
    where: { token },
    data: { actief: false },
  });
}
