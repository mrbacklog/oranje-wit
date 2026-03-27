import { Geist, Geist_Mono } from "next/font/google";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
import { TIDomainShell } from "@/components/teamindeling/layout/ti-domain-shell";
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
  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme="light"
      style={{
        backgroundColor: "var(--surface-page)",
        color: "var(--text-primary)",
        minHeight: "100dvh",
      }}
    >
      <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
        <TIDomainShell>{children}</TIDomainShell>
      </SeizoenProvider>
    </div>
  );
}
