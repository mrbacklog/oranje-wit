import { NextResponse, type NextRequest } from "next/server";

/**
 * Basic-Auth middleware voor de TI Studio v2 test-instantie.
 *
 * Activatie: `BASIC_AUTH_ENABLED=true`. Credentials komen uit
 * `BASIC_AUTH_USER` en `BASIC_AUTH_PASS`. Op v2-prod is de variabele
 * niet (of op `false`) gezet en wordt de check overgeslagen.
 *
 * Het `/api/health` endpoint en de NextAuth-routes (`/api/auth/*`)
 * worden expliciet uitgezonderd via de matcher hieronder.
 */
export function middleware(request: NextRequest) {
  if (process.env.BASIC_AUTH_ENABLED !== "true") {
    return NextResponse.next();
  }

  const expectedUser = process.env.BASIC_AUTH_USER ?? "";
  const expectedPass = process.env.BASIC_AUTH_PASS ?? "";

  const header = request.headers.get("authorization");
  if (header && header.toLowerCase().startsWith("basic ")) {
    const encoded = header.slice(6).trim();
    try {
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const user = sep === -1 ? decoded : decoded.slice(0, sep);
      const pass = sep === -1 ? "" : decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass && expectedUser !== "") {
        return NextResponse.next();
      }
    } catch {
      // negeer decode-fouten, val door naar 401
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="TI Studio v2 Test"' },
  });
}

export const config = {
  // Skip Basic-Auth voor health endpoint, NextAuth-routes en Next.js statics.
  matcher: ["/((?!api/health|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
