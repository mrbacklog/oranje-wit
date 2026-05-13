import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReadOnlyProvider } from "@/lib/read-only";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TI Studio v2 — c.k.v. Oranje Wit",
  description: "Schaduw-app voor de Team-Indeling Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const readOnly = process.env.READ_ONLY === "true";
  return (
    <html lang="nl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ReadOnlyProvider value={readOnly}>{children}</ReadOnlyProvider>
      </body>
    </html>
  );
}
