import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    redirect("/login");
  }

  const userName = String(user?.name ?? user?.email ?? "TC-lid");

  return <AppShell userName={userName}>{children}</AppShell>;
}
