import { auth } from "@oranje-wit/auth";
import { NextResponse } from "next/server";

// In development: sla authenticatie over zodat Playwright en lokale browsers
// zonder Google-login kunnen werken.
export default process.env.NODE_ENV === "development" ? () => NextResponse.next() : auth;

export const config = {
  matcher: ["/((?!login|api/auth|api/foto|_next/static|_next/image|favicon.ico).*)"],
};
