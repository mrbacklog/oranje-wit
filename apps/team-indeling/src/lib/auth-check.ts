import { auth } from "./auth";

/**
 * Controleer of de huidige gebruiker EDITOR-rechten heeft.
 * Gebruik in server actions en API routes die schrijfacties uitvoeren.
 */
export async function requireEditor() {
  const session = await auth();
  if (!session?.user || session.user.role !== "EDITOR") {
    throw new Error("Niet geautoriseerd");
  }
  return session;
}

/**
 * Controleer of de gebruiker ingelogd is (ongeacht rol).
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Niet ingelogd");
  }
  return session;
}
