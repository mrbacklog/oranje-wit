import type { Metadata } from "next";
import { MonitorShell } from "@/components/monitor/layout/monitor-shell";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "Verenigingsmonitor | c.k.v. Oranje Wit",
};

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return <MonitorShell>{children}</MonitorShell>;
}
