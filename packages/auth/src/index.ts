import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getAllowedRole } from "./allowlist";

export { bepaalClearance } from "./clearance";
export type { Clearance } from "@oranje-wit/types";

const providers: Provider[] = [Google];

// E2E test-only: voeg Credentials provider toe zodat Playwright
// kan inloggen zonder Google OAuth. Alleen actief met E2E_TEST=true.
// Deze env var wordt NOOIT gezet op Railway productie.
if (process.env.E2E_TEST === "true") {
  providers.push(
    Credentials({
      id: "e2e-test",
      name: "E2E Test",
      credentials: { email: { type: "text" } },
      authorize(credentials) {
        if (process.env.E2E_TEST !== "true") return null;
        const email = credentials?.email as string;
        if (!email) return null;
        const role = getAllowedRole(email);
        if (!role) return null;
        return { id: "e2e-test-user", email, name: "E2E Tester" };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dagen
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    signIn({ user, profile }) {
      // Credentials provider heeft geen profile, alleen user
      const email = profile?.email ?? user?.email;
      if (!email) return false;
      return getAllowedRole(email) !== null;
    },
    jwt({ token, user, profile }) {
      const email = profile?.email ?? user?.email;
      if (email) {
        token.role = getAllowedRole(email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
