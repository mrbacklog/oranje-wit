import { NextRequest, NextResponse } from "next/server";

function isValidBasicAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const credentials = Buffer.from(authHeader.slice(6), "base64").toString();
  const [user, pass] = credentials.split(":");

  return user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  if (process.env.BASIC_AUTH_ENABLED === "true") {
    const auth = request.headers.get("authorization");
    if (!isValidBasicAuth(auth)) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="TI Studio v2 Test"' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
