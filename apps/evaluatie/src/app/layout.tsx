import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evaluatie | c.k.v. Oranje Wit",
  description: "Spelerevaluaties voor c.k.v. Oranje Wit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${geist.variable} bg-gray-50 font-sans text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
