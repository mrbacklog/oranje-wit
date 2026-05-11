import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TI Studio v2 — Test",
  description: "Test-instantie van TI Studio v2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
