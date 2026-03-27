import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { BeheerSidebar } from "@/components/beheer-sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TC Beheer | c.k.v. Oranje Wit",
  description: "Centraal beheerpaneel voor de technische commissie van c.k.v. Oranje Wit",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OW Beheer",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" data-theme="dark" className={inter.variable}>
      <body
        className="font-sans antialiased"
        style={{ backgroundColor: "#0f1115", color: "#f3f4f6" }}
      >
        <SessionProvider>
          <BeheerSidebar>{children}</BeheerSidebar>
        </SessionProvider>
      </body>
    </html>
  );
}
