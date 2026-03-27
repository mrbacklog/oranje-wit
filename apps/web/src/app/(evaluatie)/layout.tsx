import type { Metadata } from "next";
import { EvaluatieDomainShell } from "@/components/evaluatie/evaluatie-domain-shell";

export const metadata: Metadata = {
  title: "Evaluatie | c.k.v. Oranje Wit",
  description: "Spelerevaluaties voor c.k.v. Oranje Wit",
};

export default function EvaluatieLayout({ children }: { children: React.ReactNode }) {
  return <EvaluatieDomainShell>{children}</EvaluatieDomainShell>;
}
