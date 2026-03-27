/**
 * Next.js Instrumentation Hook.
 *
 * Registreert:
 * 1. Database-lookup voor gebruikersautorisatie (capabilities)
 * 2. Prisma client voor ToegangsToken operaties (smartlinks)
 *
 * Dit wordt uitgevoerd bij server-start, VOOR de eerste request.
 */
export async function register() {
  // Alleen op de server (niet in Edge middleware)
  if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
    const { setDbLookup } = await import("@oranje-wit/auth/allowlist");
    const { setPrismaClient } = await import("@oranje-wit/auth/tokens");
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
  }
}
