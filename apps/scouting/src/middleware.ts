import { auth } from "@oranje-wit/auth";
import { NextResponse } from "next/server";

export default process.env.NODE_ENV === "development" ? () => NextResponse.next() : auth;

export const config = {
  matcher: [
    "/((?!login|api/auth|api/health|_next/static|_next/image|icons|manifest\\.json|favicon\\.ico).*)",
  ],
};
