import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getCapabilities } from "./allowlist";
import { verifyEmailLink } from "./hmac-link";
import { verifyAuthentication } from "./passkey";

// NOTE: Nodemailer provider is verwijderd uit de top-level imports.
// Nodemailer gebruikt Node.js 'stream' module die incompatibel is met
// Edge Runtime (middleware). De email provider wordt later toegevoegd
// via een server-only registratie wanneer de infra daarvoor klaar is.
// Tot die tijd: alleen Google OAuth en E2E credentials.

export { bepaalClearance, filterSpelersData } from "./clearance";
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
        const cap = await getCapabilities(email);
        if (!cap) return null;
        return { id: `dev-${email}`, email, name: email.split("@")[0] };
      },
    })
  );
}

// Smartlink login: valideer token, maak sessie.
// Altijd beschikbaar (ook in productie) — trainers, scouts, coördinatoren
// loggen in via een tijdelijke link die de TC verstuurt.
providers.push(
  Credentials({
    id: "smartlink",
    name: "Smartlink",
    credentials: {
      email: { type: "text" },
      naam: { type: "text" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string;
      const naam = credentials?.naam as string;
      if (!email) return null;
      // Alleen toelaten als de gebruiker in de Gebruiker-tabel staat
      const cap = await getCapabilities(email);
      if (!cap) return null;
      return { id: `smartlink-${email}`, email, name: naam || email.split("@")[0] };
    },
  })
);

// Email-link login: HMAC-gesignde stateless links.
// Altijd beschikbaar (ook in productie) — langlevende links voor
// terugkerende gebruikers (coördinatoren, trainers).
// Geen database nodig — de link zelf bevat alle informatie.
providers.push(
  Credentials({
    id: "email-link",
    name: "Email Link",
    credentials: {
      token: { type: "text" },
    },
    async authorize(credentials) {
      const token = credentials?.token as string;
      if (!token) return null;

      // Valideer HMAC-token (stateless, geen DB)
      const verificatie = verifyEmailLink(token);
      if (!verificatie.valid) return null;

      const email = verificatie.email;
      if (!email) return null;

      // Check of de gebruiker bestaat en actief is
      const cap = await getCapabilities(email);
      if (!cap) return null;

      return {
        id: `email-link-${email}`,
        email,
        name: email.split("@")[0],
      };
    },
  })
);

// Passkey login: WebAuthn authenticatie via biometrie (vingerafdruk, Face ID).
// Altijd beschikbaar — gebruikers die een passkey hebben geregistreerd
// kunnen daarmee snel inloggen zonder wachtwoord of link.
providers.push(
  Credentials({
    id: "passkey",
    name: "Passkey",
    credentials: {
      response: { type: "text" },
      challengeKey: { type: "text" },
    },
    async authorize(credentials) {
      const responseJson = credentials?.response as string;
      const challengeKey = credentials?.challengeKey as string;
      if (!responseJson || !challengeKey) return null;

      try {
        const parsed = JSON.parse(responseJson);
        const result = await verifyAuthentication(parsed, challengeKey);
        if (!result.verified) return null;

        const email = result.gebruiker.email;
        // Controleer of de gebruiker nog actief is
        const cap = await getCapabilities(email);
        if (!cap) return null;

        return {
          id: `passkey-${email}`,
          email,
          name: email.split("@")[0],
        };
      } catch {
        return null;
      }
    },
  })
);

// === NextAuth configuratie ===

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  // Adapter is nodig voor EmailProvider verificatie-tokens.
  // De cast naar Adapter is veilig: NextAuth v5 met JWT-strategie
  // gebruikt alleen createVerificationToken en useVerificationToken.
  adapter: (injectedAdapter ?? undefined) as Adapter | undefined,
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // 90 dagen
    updateAge: 24 * 60 * 60, // 24 uur — sessie wordt bij elk gebruik verlengd
  },
  providers,
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    async signIn({ user, profile, account }) {
      // Credentials providers (E2E, dev, smartlink, email-link, passkey) — altijd doorlaten (al gecheckt in authorize)
      if (
        account?.provider === "e2e-test" ||
        account?.provider === "dev-login" ||
        account?.provider === "smartlink" ||
        account?.provider === "email-link" ||
        account?.provider === "passkey"
      )
        return true;

      // Email van de gebruiker bepalen
      // Google: profile.email, Email/Nodemailer: user.email
      const email = profile?.email ?? user?.email;
      if (!email) return false;

      // Check of email in Gebruiker tabel staat (actief=true)
      return (await getCapabilities(email)) !== null;
    },
    async jwt({ token, user, profile, account }) {
      // Bij eerste login: capabilities opslaan in JWT
      const email = profile?.email ?? user?.email;
      if (email) {
        const cap = await getCapabilities(email);
        if (cap) {
          token.isTC = cap.isTC;
          token.isScout = cap.isScout;
          token.clearance = cap.clearance;
          token.doelgroepen = cap.doelgroepen;
        }
        // Onthoud welke provider is gebruikt
        if (account?.provider) {
          token.provider = account.provider;
          token.authMethode =
            account.provider === "google"
              ? "google"
              : account.provider === "passkey"
                ? "passkey"
                : "smartlink";
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as Record<string, unknown>;
        // Capabilities
        user.isTC = token.isTC ?? false;
        user.isScout = token.isScout ?? false;
        user.clearance = token.clearance ?? 0;
        user.doelgroepen = token.doelgroepen ?? [];
        user.authMethode = token.authMethode ?? "google";
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
  // Productie cookie: host-only op ckvoranjewit.app.
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
            },
          },
        },
      }
    : {}),
});
