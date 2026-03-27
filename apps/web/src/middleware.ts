import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login", "/api/auth", "/_next", "/favicon.ico", "/icons", "/manifest"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Altijd doorlaten: publieke routes
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Development: geen auth check (dev bypass)
  // Productie: auth via server components (Edge Runtime incompatibel met nodemailer)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
