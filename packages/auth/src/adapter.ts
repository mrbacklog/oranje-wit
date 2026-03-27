/**
 * Custom NextAuth adapter voor c.k.v. Oranje Wit.
 *
 * Implementeert ALLEEN de verificatie-token methodes die NextAuth
 * EmailProvider nodig heeft. We gebruiken bewust NIET @auth/prisma-adapter
 * omdat die een volledige User/Account/Session tabelstructuur vereist
 * die niet past bij ons Gebruiker-model.
 *
 * NextAuth v5 met JWT-strategie heeft geen adapter nodig voor sessies,
 * alleen voor de EmailProvider verificatie-tokens.
 */

import type { Adapter, VerificationToken } from "next-auth/adapters";

/**
 * Type voor de Prisma client — we injecteren deze om een directe
 * dependency op @oranje-wit/database te vermijden (peer dependency).
 */
interface PrismaVerificatieToken {
  verificatieToken: {
    create: (args: {
      data: { identifier: string; token: string; expires: Date };
    }) => Promise<{ identifier: string; token: string; expires: Date }>;
    findUnique: (args: {
      where: { identifier_token: { identifier: string; token: string } };
    }) => Promise<{ identifier: string; token: string; expires: Date } | null>;
    delete: (args: {
      where: { identifier_token: { identifier: string; token: string } };
    }) => Promise<unknown>;
  };
}

/**
 * Minimale NextAuth adapter die alleen verificatie-tokens beheert.
 *
 * Wordt als Partial<Adapter> geretourneerd — NextAuth gebruikt alleen
 * de methodes die het nodig heeft (createVerificationToken, useVerificationToken).
 */
export function owAdapter(prisma: PrismaVerificatieToken): Partial<Adapter> {
  return {
    async createVerificationToken(data: VerificationToken): Promise<VerificationToken> {
      const result = await prisma.verificatieToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return {
        identifier: result.identifier,
        token: result.token,
        expires: result.expires,
      };
    },

    async useVerificationToken(params: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      const result = await prisma.verificatieToken.findUnique({
        where: {
          identifier_token: {
            identifier: params.identifier,
            token: params.token,
          },
        },
      });

      if (!result) return null;

      // Verwijder het token na gebruik (one-time use)
      await prisma.verificatieToken.delete({
        where: {
          identifier_token: {
            identifier: params.identifier,
            token: params.token,
          },
        },
      });

      return {
        identifier: result.identifier,
        token: result.token,
        expires: result.expires,
      };
    },
  };
}
