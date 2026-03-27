import { NextResponse } from "next/server";

// Beheer-app: geen Edge middleware auth check.
// Nodemailer in @oranje-wit/auth is incompatibel met Edge Runtime.
// Auth wordt afgedwongen via server components (requireEditor) en
// de layout. In productie beschermt de Cloudflare Worker + NextAuth sessie.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
