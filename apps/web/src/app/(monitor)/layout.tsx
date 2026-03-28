import type { Metadata } from "next";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { MonitorDomainShell } from "@/components/monitor/layout/monitor-domain-shell";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "Verenigingsmonitor | c.k.v. Oranje Wit",
};

export default async function MonitorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    redirect("/login");
  }
  return <MonitorDomainShell>{children}</MonitorDomainShell>;
}
