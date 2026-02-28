import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getAllowedRole } from "./allowlist";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dagen
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    signIn({ profile }) {
      if (!profile?.email) return false;
      return getAllowedRole(profile.email) !== null;
    },
    jwt({ token, profile }) {
      if (profile?.email) {
        token.role = getAllowedRole(profile.email);
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
