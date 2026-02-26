import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        wachtwoord: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.wachtwoord) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        // Eenvoudige wachtwoordcontrole voor 3 TC-leden
        // AUTH_SECRET-gebaseerde tokens — wachtwoord is het gedeelde TC-wachtwoord
        const tcWachtwoord = process.env.TC_WACHTWOORD;
        if (!tcWachtwoord || credentials.wachtwoord !== tcWachtwoord) return null;

        return {
          id: user.id,
          name: user.naam,
          email: user.email,
          role: user.rol,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
