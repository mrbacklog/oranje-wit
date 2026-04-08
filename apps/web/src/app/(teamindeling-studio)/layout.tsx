import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import SeizoenProvider from "@/components/teamindeling/providers/SeizoenProvider";
import { TISidebar } from "@/components/teamindeling/layout/TISidebar";
import { getActiefSeizoen, isWerkseizoenCheck } from "@/lib/teamindeling/seizoen";
import "./teamindeling.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function TeamIndelingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const doelgroepen = Array.isArray(user?.doelgroepen) ? user.doelgroepen : [];
  if (!session?.user || (user?.isTC !== true && doelgroepen.length === 0)) {
    redirect("/login");
  }

  const seizoen = await getActiefSeizoen();
  const isWerkseizoen = await isWerkseizoenCheck(seizoen);

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme="dark"
      style={{ color: "var(--text-primary)" }}
    >
      {/* Mobile: desktop-only melding */}
      <div
        className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 md:hidden"
        style={{ background: "var(--surface-base)" }}
      >
        <div style={{ fontSize: 48 }}>🖥️</div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          TI Studio is alleen beschikbaar op desktop
        </h1>
        <p className="max-w-xs text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Open deze pagina op een laptop of computer voor de volledige Team-Indeling werkplaats.
        </p>
        <a
          href="/teamindeling"
          className="mt-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: "var(--ow-oranje-500)", color: "white" }}
        >
          Naar mobiele teamindeling
        </a>
      </div>

      {/* Desktop: normale layout */}
      <div className="hidden md:block">
        <SeizoenProvider seizoen={seizoen} isWerkseizoen={isWerkseizoen}>
          <TISidebar>{children}</TISidebar>
        </SeizoenProvider>
      </div>
    </div>
  );
}
