import { prisma } from "@/lib/db/prisma";

/**
 * Valideer een uitnodigings-token.
 * Retourneert de uitnodiging met ronde- en team-info als het token geldig is.
 * Retourneert null als het token onbekend is of de ronde niet actief is.
 */
export async function valideerToken(token: string) {
  // Prisma 7 type recursie workaround (TS2321)
  const uitnodiging = await (prisma.evaluatieUitnodiging.findUnique as Function)({
    where: { token },
    include: {
      ronde: {
        select: {
          id: true,
          seizoen: true,
          ronde: true,
          naam: true,
          type: true,
          deadline: true,
          status: true,
        },
      },
      owTeam: {
        select: { id: true, naam: true, seizoen: true },
      },
    },
  });

  if (!uitnodiging) return null;
  if (uitnodiging.ronde.status !== "actief") return null;

  return uitnodiging;
}

/** Type voor het resultaat van valideerToken */
export type ValidUitnodiging = NonNullable<Awaited<ReturnType<typeof valideerToken>>>;
