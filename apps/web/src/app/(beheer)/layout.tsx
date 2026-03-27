import type { Metadata } from "next";
import { BeheerSidebar } from "@/components/beheer/beheer-sidebar";

export const metadata: Metadata = {
  title: "TC Beheer | c.k.v. Oranje Wit",
  description: "Centraal beheerpaneel voor de technische commissie van c.k.v. Oranje Wit",
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return <BeheerSidebar>{children}</BeheerSidebar>;
}
