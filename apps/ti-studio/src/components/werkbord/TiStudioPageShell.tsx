"use client";
// Importeert tokens.css EENMALIG voor alle TI Studio pagina's
import "./tokens.css";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Ribbon } from "./Ribbon";
import { useSeizoen } from "@oranje-wit/teamindeling-shared/seizoen-provider";
import { getOpenMemoCount } from "@/app/(protected)/indeling/memo-count-actions";

interface TiStudioPageShellProps {
  children: React.ReactNode;
}

export function TiStudioPageShell({ children }: TiStudioPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { seizoen, isWerkseizoen } = useSeizoen();

  const [gebruikerInitialen, setGebruikerInitialen] = useState("");
  const [openMemoCount, setOpenMemoCount] = useState(0);
  const [nieuweVersie, setNieuweVersie] = useState(false);
  const huidigeVersie = useRef<string | null>(null);

  // Initialen client-side berekenen — voorkomt hydration mismatch (server heeft geen sessie)
  useEffect(() => {
    const email = session?.user?.email ?? "";
    const initials = email
      .split("@")[0]
      .split(".")
      .map((p) => p.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
    setGebruikerInitialen(initials);
  }, [session]);

  useEffect(() => {
    getOpenMemoCount()
      .then(setOpenMemoCount)
      .catch(() => {});
  }, []);

  // Versiedetectie: poll /api/health elke 60s, toon banner bij nieuwe deploy
  useEffect(() => {
    async function checkVersie() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (!data.version) return;
        if (huidigeVersie.current === null) {
          huidigeVersie.current = data.version;
        } else if (huidigeVersie.current !== data.version) {
          setNieuweVersie(true);
        }
      } catch {
        // netwerk even weg — negeer
      }
    }
    checkVersie();
    const interval = setInterval(checkVersie, 60_000);
    return () => clearInterval(interval);
  }, []);

  const isWerkbord = pathname.startsWith("/indeling");

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
          onNaarIndeling={() => router.push("/indeling")}
          onNaarKader={() => router.push("/kader")}
          onNaarPersonen={() => router.push("/personen")}
          onNaarMemo={() => router.push("/memo")}
          openMemoCount={openMemoCount}
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
          {/* Nieuwe versie banner */}
          {nieuweVersie && (
            <div
              style={{
                padding: "7px 20px",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                background: "rgba(255,107,0,.1)",
                color: "var(--accent)",
                borderBottom: "1px solid rgba(255,107,0,.2)",
                flexShrink: 0,
              }}
            >
              <span>Nieuwe versie beschikbaar — sla lopend werk op en vernieuw de pagina.</span>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "2px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--accent)",
                  background: "transparent",
                  color: "var(--accent)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Vernieuwen
              </button>
            </div>
          )}

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
