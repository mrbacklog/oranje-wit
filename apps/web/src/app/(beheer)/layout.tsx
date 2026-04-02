import type { Metadata } from "next";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { BeheerDomainShell } from "@/components/beheer/beheer-domain-shell";
import { DaisyChat } from "@/components/daisy/chat-trigger";
import { getDaisyBeschikbaarheid } from "@/app/(beheer)/beheer/systeem/daisy/actions";

export const metadata: Metadata = {
  title: "TC Beheer | c.k.v. Oranje Wit",
  description: "Centraal beheerpaneel voor de technische commissie van c.k.v. Oranje Wit",
};

export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    redirect("/login");
  }

  const { beschikbaar, actieveProvider } = await getDaisyBeschikbaarheid();

  return (
    <>
      <BeheerDomainShell>{children}</BeheerDomainShell>
      <DaisyChat beschikbaar={beschikbaar} actieveProvider={actieveProvider ?? undefined} />
    </>
  );
}
