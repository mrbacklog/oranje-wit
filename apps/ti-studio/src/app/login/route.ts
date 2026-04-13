import { signIn } from "@oranje-wit/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "/";
  await signIn("google", { redirectTo: callbackUrl });
}
