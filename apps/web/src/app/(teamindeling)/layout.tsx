import { Geist, Geist_Mono } from "next/font/google";
import { TISidebar } from "@/components/teamindeling/layout/TISidebar";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
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
        backgroundColor: "#ffffff",
        color: "#111827",
        minHeight: "100dvh",
      }}
    >
      <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
        <TISidebar>{children}</TISidebar>
      </SeizoenProvider>
    </div>
  );
}
