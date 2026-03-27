import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/scouting/bottom-nav";

export default async function ScoutLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col pb-16">
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
