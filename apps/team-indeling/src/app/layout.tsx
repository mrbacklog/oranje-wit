import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TISidebar } from "@/components/layout/TISidebar";
import SessionProvider from "@/components/providers/SessionProvider";
import SeizoenProvider from "@/components/providers/SeizoenProvider";
import { getActiefSeizoen, isWerkseizoenCheck } from "@/lib/seizoen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team-Indeling | c.k.v. Oranje Wit",
  description:
    "Intelligente teamindeling voor c.k.v. Oranje Wit — van blauwdruk via concepten naar definitieve indeling.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OW Teams",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-gray-900 antialiased`}
      >
        <SessionProvider>
          <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
            <TISidebar>{children}</TISidebar>
          </SeizoenProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
