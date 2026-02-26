import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "TC-monitor voor gezonde groei — actieve leden, cohorten, teams, verloop en signalering",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
