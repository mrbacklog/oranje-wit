import { NextResponse } from "next/server";

// Dev: geen auth check in middleware. Productie: via server components.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
