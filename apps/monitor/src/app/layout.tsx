import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { MonitorShell } from "@/components/layout/monitor-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "Verenigingsmonitor | c.k.v. Oranje Wit",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OW Monitor",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" data-theme="dark">
      <body className="antialiased">
        <SessionProvider>
          <MonitorShell>{children}</MonitorShell>
        </SessionProvider>
      </body>
    </html>
  );
}
