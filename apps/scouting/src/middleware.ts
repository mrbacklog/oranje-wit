import { auth } from "@oranje-wit/auth";
import { NextResponse } from "next/server";

export default async function middleware() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/scout/:path*"],
};
