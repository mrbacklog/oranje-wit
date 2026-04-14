import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Publieke routes die GEEN authenticatie vereisen.
 * - /login en /api/auth: NextAuth flows
 * - /api/smartlink: magic link validatie (pre-auth)
 * - /api/agent: agent backdoor, authentiseert via AGENT_SECRET in body
 * - /_next, /favicon.ico, /icons, /manifest.json: statische assets
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/health",
  "/api/scouting/health",
  "/api/smartlink",
  "/api/agent",
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
  const { pathname, search } = request.nextUrl;

  // 0. Redirect legacy ti-studio en teamindeling routes naar de ti-studio service.
  //    Fase B van de splitsing heeft alle TI-code uit apps/web verwijderd —
  //    bookmarks en deep-links worden via een 308 naar teamindeling.ckvoranjewit.app
  //    geleid. Gebeurt vóór elke andere check zodat ook unauth-gebruikers correct
  //    worden doorverwezen.
  if (pathname.startsWith("/ti-studio") || pathname.startsWith("/teamindeling")) {
    const target = new URL(`https://teamindeling.ckvoranjewit.app${pathname}${search}`);
    return NextResponse.redirect(target, 308);
  }

  // 1. Publieke routes — altijd doorlaten
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Daisy service key — programmatische toegang voor scripts/tests
  const serviceKey = request.headers.get("X-Daisy-Service-Key");
  const expectedKey = process.env.DAISY_SERVICE_KEY ?? "ow-daisy-service-2026";
  if (serviceKey && serviceKey === expectedKey) {
    return NextResponse.next();
  }

  // 3. Dev bypass — lokale ontwikkeling zonder auth
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // 3. Hub/portaal root — de pagina zelf handelt auth-state af
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 4. JWT uit session cookie (Edge-compatible, geen DB)
  // Cookie naam moet matchen met de NextAuth config in @oranje-wit/auth:
  // - Productie: "ow-session" (custom naam)
  // - Development: standaard NextAuth cookie
  const cookieName = process.env.NODE_ENV === "production" ? "ow-session" : "authjs.session-token";
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName,
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

  // Legacy check voor /ti-studio en /teamindeling is verwijderd: stap 0 redirect
  // deze pathnamen al naar de ti-studio service voordat auth überhaupt wordt gecheckt.

  // /evaluatie/* — elke geauthenticeerde gebruiker
  // (token check hierboven is voldoende)

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
