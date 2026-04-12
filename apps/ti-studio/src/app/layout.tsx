import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@oranje-wit/teamindeling-shared/seizoen-provider";
import { getActiefSeizoen, isWerkseizoenCheck } from "@oranje-wit/teamindeling-shared/seizoen";
import { TiStudioPageShell } from "@/components/werkbord/TiStudioPageShell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TI Studio — c.k.v. Oranje Wit",
  description: "Team-Indeling Studio voor de TC",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }
  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <html lang="nl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
          <TiStudioPageShell>{children}</TiStudioPageShell>
        </SeizoenProvider>
      </body>
    </html>
  );
}
