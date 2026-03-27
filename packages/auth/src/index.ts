import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getAllowedRole } from "./allowlist";

// NOTE: Nodemailer provider is verwijderd uit de top-level imports.
// Nodemailer gebruikt Node.js 'stream' module die incompatibel is met
// Edge Runtime (middleware). De email provider wordt later toegevoegd
// via een server-only registratie wanneer de infra daarvoor klaar is.
// Tot die tijd: alleen Google OAuth en E2E credentials.

export { bepaalClearance } from "./clearance";
export type { Clearance } from "@oranje-wit/types";

/**
 * Geïnjecteerde adapter voor verificatie-tokens (magic links).
 * Wordt gezet door de app via `setAuthAdapter()`.
 * Zonder adapter werkt alleen Google OAuth.
 */
let injectedAdapter: Partial<Adapter> | null = null;

/**
 * Registreer een NextAuth adapter voor email-verificatie.
 * Moet door de app worden aangeroepen bij initialisatie als
 * magic link login gewenst is.
 *
 * Voorbeeld:
 * ```ts
 * import { setAuthAdapter } from "@oranje-wit/auth";
 * import { owAdapter } from "@oranje-wit/auth/adapter";
 * import { prisma } from "@oranje-wit/database";
 * setAuthAdapter(owAdapter(prisma));
 * ```
 */
export function setAuthAdapter(adapter: Partial<Adapter>): void {
  injectedAdapter = adapter;
}

// === Providers ===

const providers: Provider[] = [Google];

// Magic link provider: wordt LAZY geladen (niet bij Edge Runtime).
// Nodemailer en createTransport worden pas geïmporteerd wanneer
// EMAIL_SERVER is geconfigureerd EN we NIET op Edge draaien.
// Dit voorkomt de "stream module not supported" error in middleware.
//
// Activatie: zet EMAIL_SERVER env var. Zonder die var toont de login
// pagina alleen "Inloggen met Google".
//
// NOTE: De daadwerkelijke Nodemailer provider wordt geregistreerd
// via de `registerEmailProvider()` functie, aangeroepen vanuit
// de app's instrumentation.ts (server-only context).

// Dev/E2E login: voeg Credentials provider toe zodat je lokaal kunt
// inloggen zonder Google OAuth. Actief in development of met E2E_TEST=true.
// Op Railway productie is NODE_ENV=production en E2E_TEST niet gezet.
const isDev = process.env.NODE_ENV === "development" || process.env.E2E_TEST === "true";
if (isDev) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev Login",
      credentials: { email: { type: "text" } },
      async authorize(credentials) {
        if (!isDev) return null;
        const email = credentials?.email as string;
        if (!email) return null;
        const role = await getAllowedRole(email);
        if (!role) return null;
        return { id: `dev-${email}`, email, name: email.split("@")[0] };
      },
    })
  );
}

// === NextAuth configuratie ===

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  // Adapter is nodig voor EmailProvider verificatie-tokens.
  // De cast naar Adapter is veilig: NextAuth v5 met JWT-strategie
  // gebruikt alleen createVerificationToken en useVerificationToken.
  adapter: (injectedAdapter ?? undefined) as Adapter | undefined,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dagen
  },
  providers,
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    async signIn({ user, profile, account }) {
      // Credentials provider (E2E) — altijd doorlaten (al gecheckt in authorize)
      if (account?.provider === "e2e-test") return true;

      // Email van de gebruiker bepalen
      // Google: profile.email, Email/Nodemailer: user.email
      const email = profile?.email ?? user?.email;
      if (!email) return false;

      // Check of email in Gebruiker tabel staat (actief=true)
      return (await getAllowedRole(email)) !== null;
    },
    async jwt({ token, user, profile, account }) {
      // Bij eerste login: email en rol opslaan in JWT
      const email = profile?.email ?? user?.email;
      if (email) {
        token.role = await getAllowedRole(email);
        // Onthoud welke provider is gebruikt
        if (account?.provider) {
          token.provider = account.provider;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as Record<string, unknown>;
        user.role = token.role as string;
        if (token.provider) {
          user.provider = token.provider as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email", // Pagina na magic link versturen
  },
  // Cross-subdomein sessie: alle apps op *.ckvoranjewit.app delen dezelfde cookie.
  // In development: standaard cookies (per-app, per-poort).
  ...(process.env.NODE_ENV === "production"
    ? {
        cookies: {
          sessionToken: {
            name: "ow-session",
            options: {
              httpOnly: true,
              secure: true,
              sameSite: "lax" as const,
              path: "/",
              domain: ".ckvoranjewit.app",
            },
          },
        },
      }
    : {}),
});
