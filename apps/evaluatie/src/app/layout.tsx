import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { FloatingAppSwitcher } from "@/components/FloatingAppSwitcher";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evaluatie | c.k.v. Oranje Wit",
  description: "Spelerevaluaties voor c.k.v. Oranje Wit",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OW Evaluatie",
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
    <html lang="nl" data-theme="dark">
      <body
        className={`${geist.variable} font-sans antialiased`}
        style={{ backgroundColor: "var(--surface-page)", color: "var(--text-primary)" }}
      >
        {children}
        <FloatingAppSwitcher />
      </body>
    </html>
  );
}
