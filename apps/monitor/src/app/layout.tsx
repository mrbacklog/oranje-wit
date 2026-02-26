import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "TC-monitor voor gezonde groei",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-screen">
          <Suspense>
            <Sidebar />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
