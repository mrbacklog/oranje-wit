import { auth } from "./index";

/**
 * Controleer dat er een geldige sessie is.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Niet ingelogd");
  }
  return session;
}

/**
 * Controleer dat de gebruiker TC-lid is (isTC capability).
 */
export async function requireTC() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    throw new Error("Niet geautoriseerd — alleen TC-leden");
  }
  return session;
}

/**
 * Controleer dat de gebruiker scout of TC-lid is.
 */
export async function requireScout() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const isScout = user?.isScout === true;
  const isTC = user?.isTC === true;
  if (!session?.user || (!isScout && !isTC)) {
    throw new Error("Niet geautoriseerd — alleen scouts en TC-leden");
  }
  return session;
}

/**
 * Controleer dat de gebruiker TC-lid of coordinator is.
 */
export async function requireCoordinator() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const isTC = user?.isTC === true;
  const doelgroepen = (user?.doelgroepen as string[]) ?? [];
  const isCoordinator = doelgroepen.length > 0;
  if (!session?.user || (!isTC && !isCoordinator)) {
    throw new Error("Niet geautoriseerd — alleen TC-leden en coördinatoren");
  }
  return session;
}
