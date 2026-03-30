import type { Metadata } from "next";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { BeleidDomainShell } from "@/components/beleid/beleid-domain-shell";

export const metadata: Metadata = {
  title: "Beleid | c.k.v. Oranje Wit",
  description: "Technisch beleid, visie en doelgroepenstrategie",
};

export default async function BeleidLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    redirect("/login");
  }
  return <BeleidDomainShell>{children}</BeleidDomainShell>;
}
