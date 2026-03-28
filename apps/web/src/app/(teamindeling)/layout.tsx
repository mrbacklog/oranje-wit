import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
import SessionProvider from "@/components/teamindeling/providers/SessionProvider";
import { MobileShell } from "@/components/teamindeling/mobile/MobileShell";
import { getActiefSeizoen, isWerkseizoenCheck } from "@/lib/teamindeling/seizoen";

export default async function TeamIndelingMobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }

  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <div
      data-theme="dark"
      style={{
        backgroundColor: "var(--surface-page)",
        color: "var(--text-primary)",
        minHeight: "100dvh",
      }}
    >
      <SessionProvider>
        <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
          <MobileShell>{children}</MobileShell>
        </SeizoenProvider>
      </SessionProvider>
    </div>
  );
}
