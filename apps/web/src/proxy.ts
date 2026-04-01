import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Publieke routes die GEEN authenticatie vereisen.
 * - /login en /api/auth: NextAuth flows
 * - /api/smartlink: magic link validatie (pre-auth)
 * - /_next, /favicon.ico, /icons, /manifest.json: statische assets
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/health",
  "/api/scouting/health",
  "/api/smartlink",
  "/_next",
  "/favicon.ico",
  "/icons",
  "/manifest.json",
];

/**
 * Capabilities-based middleware voor de geconsolideerde web-app.
 *
 * Leest de JWT uit de session cookie (Edge-compatible, geen DB-call).
 * De JWT bevat capabilities die bij login zijn opgeslagen:
 * - isTC: boolean      (TC-lid, volledige toegang)
 * - isScout: boolean   (scout, scouting-app toegang)
 * - doelgroepen: string[] (trainer/coordinator, teamindeling-toegang)
 * - clearance: number  (0-3, spelersdata zichtbaarheid)
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Publieke routes — altijd doorlaten
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Dev bypass — lokale ontwikkeling zonder auth
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // 3. Hub/portaal root — de pagina zelf handelt auth-state af
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 4. JWT uit session cookie (Edge-compatible, geen DB)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Route-level capability checks

  // /beheer/* en /monitor/* — alleen TC-leden
  if (pathname.startsWith("/beheer") || pathname.startsWith("/monitor")) {
    if (!token.isTC) {
      return NextResponse.redirect(new URL("/?error=geen-toegang", request.url));
    }
  }

  // /scouting/* — scouts en TC-leden
  if (pathname.startsWith("/scouting")) {
    if (!token.isScout && !token.isTC) {
      return NextResponse.redirect(new URL("/?error=geen-toegang", request.url));
    }
  }

  // /ti-studio/* en /teamindeling/* — TC-leden of gebruikers met doelgroepen (trainers/coordinatoren)
  if (pathname.startsWith("/ti-studio") || pathname.startsWith("/teamindeling")) {
    const doelgroepen = Array.isArray(token.doelgroepen) ? token.doelgroepen : [];
    if (!token.isTC && doelgroepen.length === 0) {
      return NextResponse.redirect(new URL("/?error=geen-toegang", request.url));
    }
  }

  // /evaluatie/* — elke geauthenticeerde gebruiker
  // (token check hierboven is voldoende)

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
