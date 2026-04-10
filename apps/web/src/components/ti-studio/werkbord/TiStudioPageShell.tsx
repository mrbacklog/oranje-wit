"use client";
// Importeert tokens.css EENMALIG voor alle TI Studio pagina's
import "./tokens.css";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Ribbon } from "./Ribbon";
import { useSeizoen } from "@/components/teamindeling/providers/SeizoenProvider";

interface TiStudioPageShellProps {
  children: React.ReactNode;
}

export function TiStudioPageShell({ children }: TiStudioPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { seizoen, isWerkseizoen } = useSeizoen();

  const email = session?.user?.email ?? "";
  const gebruikerInitialen = email
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  const isWerkbord = pathname.startsWith("/ti-studio/indeling");

  return (
    <>
      {/* Mobile: TI Studio is desktop-only */}
      <div
        className="flex md:hidden"
        style={{
          minHeight: "100svh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          background: "var(--bg-0)",
          color: "var(--text-1)",
        }}
      >
        <div style={{ fontSize: 48 }}>🖥️</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: "center" }}>
          TI Studio is alleen beschikbaar op desktop
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 280, textAlign: "center" }}>
          Open deze pagina op een laptop of computer voor de volledige Team-Indeling werkplaats.
        </p>
        <a
          href="/teamindeling"
          style={{
            marginTop: 8,
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            background: "var(--accent)",
            color: "white",
            textDecoration: "none",
          }}
        >
          Naar mobiele teamindeling
        </a>
      </div>

      {/* Desktop */}
      <div
        className="hidden md:grid"
        style={{
          gridTemplateColumns: "var(--ribbon) 1fr",
          height: "100vh",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13,
          lineHeight: 1.5,
          background: "var(--bg-0)",
          color: "var(--text-1)",
          userSelect: "none",
        }}
      >
        <Ribbon
          gebruikerInitialen={gebruikerInitialen}
          activeRoute={pathname}
          onNaarIndeling={() => router.push("/ti-studio/indeling")}
          onNaarKader={() => router.push("/ti-studio/kader")}
          onNaarPersonen={() => router.push("/ti-studio/personen")}
        />

        {/* Content kolom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Niet-werkseizoen banner */}
          {!isWerkseizoen && (
            <div
              style={{
                padding: "7px 20px",
                fontSize: 12,
                textAlign: "center",
                background: "rgba(234,179,8,.08)",
                color: "#fbbf24",
                borderBottom: "1px solid rgba(234,179,8,.15)",
                flexShrink: 0,
              }}
            >
              Je bekijkt seizoen {seizoen} — dit is niet het actieve werkseizoen (alleen-lezen)
            </div>
          )}

          {/* Werkbord: eigen layout, geen padding; Pages: scrollbaar */}
          {isWerkbord ? (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {children}
            </div>
          ) : (
            <main
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "24px 28px",
                userSelect: "text",
              }}
            >
              {children}
            </main>
          )}
        </div>
      </div>
    </>
  );
}
