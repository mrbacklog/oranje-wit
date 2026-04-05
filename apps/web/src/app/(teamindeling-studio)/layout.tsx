import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
import { TISidebar } from "@/components/teamindeling/layout/TISidebar";
import { getActiefSeizoen, isWerkseizoenCheck } from "@/lib/teamindeling/seizoen";
import "./teamindeling.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function TeamIndelingLayout({
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
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme="dark"
      style={{ color: "var(--text-primary)" }}
    >
      <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
        <TISidebar>{children}</TISidebar>
      </SeizoenProvider>
    </div>
  );
}
