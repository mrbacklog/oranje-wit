import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";
  redirect(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
