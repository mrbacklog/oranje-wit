import type { Metadata } from "next";
import { MonitorDomainShell } from "@/components/monitor/layout/monitor-domain-shell";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "Verenigingsmonitor | c.k.v. Oranje Wit",
};

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return <MonitorDomainShell>{children}</MonitorDomainShell>;
}
