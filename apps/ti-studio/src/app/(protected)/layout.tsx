import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@oranje-wit/teamindeling-shared/seizoen-provider";
import { getActiefSeizoen, isWerkseizoenCheck } from "@oranje-wit/teamindeling-shared/seizoen";
import { TiStudioPageShell } from "@/components/werkbord/TiStudioPageShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }
  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
      <TiStudioPageShell>{children}</TiStudioPageShell>
    </SeizoenProvider>
  );
}
