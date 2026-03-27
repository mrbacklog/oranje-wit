import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "OW Scout | c.k.v. Oranje Wit",
  description: "Scouting app voor c.k.v. Oranje Wit",
};

export const viewport: Viewport = {
  themeColor: "#FF6B00",
};

export default function ScoutingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
