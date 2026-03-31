import type { Metadata } from "next";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { WwwDomainShell } from "@/components/www/layout/www-domain-shell";

export const metadata: Metadata = {
  title: "Mijn Oranje Wit | c.k.v. Oranje Wit",
  description: "Persoonlijk overzicht, taken en nieuws",
};

export default async function WwwLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <WwwDomainShell>{children}</WwwDomainShell>;
}
