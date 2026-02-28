import { auth } from "./index";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Niet ingelogd");
  }
  return session;
}

export async function requireEditor() {
  const session = await auth();
  if (!session?.user || session.user.role !== "EDITOR") {
    throw new Error("Niet geautoriseerd");
  }
  return session;
}
