/**
 * Next.js Instrumentation Hook.
 *
 * Registreert de database-lookup voor gebruikersautorisatie.
 * Dit wordt uitgevoerd bij server-start, VOOR de eerste request.
 */
export async function register() {
  // Alleen op de server (niet in Edge middleware)
  if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
    const { setDbLookup } = await import("@oranje-wit/auth/allowlist");
    const { prisma } = await import("@oranje-wit/database");

    setDbLookup(async (email: string) => {
      const g = await prisma.gebruiker.findUnique({
        where: { email },
      });
      return g ? { rol: g.rol, actief: g.actief } : null;
    });
  }
}
