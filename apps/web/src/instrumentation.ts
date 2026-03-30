/**
 * Next.js Instrumentation Hook.
 *
 * Registreert:
 * 1. Database-lookup voor gebruikersautorisatie (capabilities)
 * 2. Prisma client voor ToegangsToken operaties (smartlinks)
 * 3. Passkey DB-operaties voor WebAuthn authenticatie
 *
 * Dit wordt uitgevoerd bij server-start, VOOR de eerste request.
 */
export async function register() {
  // Alleen op de server (niet in Edge middleware)
  if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
    const { setDbLookup } = await import("@oranje-wit/auth/allowlist");
    const { setPrismaClient } = await import("@oranje-wit/auth/tokens");
    const { setPasskeyDb } = await import("@oranje-wit/auth/passkey");
    const { prisma } = await import("@oranje-wit/database");

    // Capabilities lookup voor NextAuth signIn/JWT callbacks
    setDbLookup(async (email: string) => {
      const g = await prisma.gebruiker.findUnique({
        where: { email },
        select: {
          isTC: true,
          isScout: true,
          clearance: true,
          doelgroepen: true,
          actief: true,
        },
      });
      if (!g) return null;
      return {
        isTC: g.isTC,
        isScout: g.isScout,
        clearance: g.clearance as 0 | 1 | 2 | 3,
        doelgroepen: g.doelgroepen,
        actief: g.actief,
      };
    });

    // Prisma client voor ToegangsToken operaties (smartlink validatie)
    setPrismaClient(prisma);

    // Passkey DB-operaties voor WebAuthn registratie en authenticatie
    setPasskeyDb({
      findByGebruikerId: async (gebruikerId) => {
        const passkeys = await prisma.passkey.findMany({
          where: { gebruikerId },
          select: {
            credentialId: true,
            credentialPublicKey: true,
            counter: true,
            credentialDeviceType: true,
            credentialBackedUp: true,
            transports: true,
          },
        });
        return passkeys;
      },
      findByCredentialId: async (credentialId) => {
        const passkey = await prisma.passkey.findUnique({
          where: { credentialId },
          select: {
            id: true,
            gebruikerId: true,
            credentialId: true,
            credentialPublicKey: true,
            counter: true,
            credentialDeviceType: true,
            credentialBackedUp: true,
            transports: true,
            gebruiker: { select: { email: true } },
          },
        });
        return passkey;
      },
      create: async (data) => {
        await prisma.passkey.create({
          data: {
            ...data,
            credentialPublicKey: new Uint8Array(data.credentialPublicKey),
          },
        });
      },
      updateCounterAndLastUsed: async (id, counter, lastUsedAt) => {
        await prisma.passkey.update({
          where: { id },
          data: { counter, lastUsedAt },
        });
      },
      findGebruikerByEmail: async (email) => {
        return prisma.gebruiker.findUnique({
          where: { email },
          select: { id: true, email: true, naam: true },
        });
      },
    });
  }
}
