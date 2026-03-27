import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { ScoutingDomainShell } from "@/components/scouting/scouting-domain-shell";

export default async function ScoutLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <ScoutingDomainShell>{children}</ScoutingDomainShell>;
}
