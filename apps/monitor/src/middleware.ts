export { auth as middleware } from "@oranje-wit/auth";

export const config = {
  matcher: [
    "/((?!login|api/auth|api/foto|_next/static|_next/image|favicon.ico).*)",
  ],
};
