"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSeizoen } from "@/components/teamindeling/providers/SeizoenProvider";

const NAV_ITEMS = [
  { label: "Kaders", href: "/ti-studio/kaders", icon: "📐" },
  { label: "Indeling", href: "/ti-studio/indeling", icon: "🏗️" },
  { label: "Werkbord", href: "/ti-studio/werkbord", icon: "📋" },
  { label: "Personen", href: "/ti-studio/personen", icon: "👥" },
];

interface TISidebarProps {
  children: ReactNode;
}

export function TISidebar({ children }: TISidebarProps) {
  const { data: session } = useSession();
  const { seizoen, isWerkseizoen } = useSeizoen();
  const pathname = usePathname();

  // Indeling heeft eigen full-screen TiStudioShell
  if (pathname.startsWith("/ti-studio/indeling")) {
    return <>{children}</>;
  }

  // Mobile: TI Studio is desktop-only
  const mobileBlock = (
    <div
      className="flex md:hidden"
      style={{
        minHeight: "100svh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 48 }}>🖥️</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: "center" }}>
        TI Studio is alleen beschikbaar op desktop
      </h1>
      <p style={{ fontSize: 14, color: "#a3a3a3", maxWidth: 280, textAlign: "center" }}>
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
          background: "#ff6b00",
          color: "white",
          textDecoration: "none",
        }}
      >
        Naar mobiele teamindeling
      </a>
    </div>
  );

  const userName = session?.user?.name ?? "Gebruiker";
  const initialen = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {mobileBlock}
      <div
        className="hidden md:flex"
        style={{
          height: "100vh",
          overflow: "hidden",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: 224,
            flexShrink: 0,
            background: "#141414",
            borderRight: "1px solid #262626",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          aria-label="TI Studio navigatie"
        >
          {/* Branding */}
          <div
            style={{ padding: "20px 16px 16px", borderBottom: "1px solid #262626", flexShrink: 0 }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", letterSpacing: "0.02em" }}
            >
              Team-Indeling
            </div>
            {seizoen && (
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Seizoen {seizoen}</div>
            )}
          </div>

          {/* Navigation */}
          <div style={{ padding: 8, flex: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#ff6b00" : "#a3a3a3",
                    background: active ? "rgba(255,107,0,.12)" : "transparent",
                    textDecoration: "none",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User footer */}
          {session?.user && (
            <div style={{ padding: "12px", borderTop: "1px solid #262626", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,107,0,.15)",
                    border: "1px solid rgba(255,107,0,.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#ff6b00",
                    flexShrink: 0,
                  }}
                >
                  {initialen}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fafafa",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userName}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Uitloggen"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    padding: 4,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Niet-werkseizoen banner */}
          {!isWerkseizoen && (
            <div
              style={{
                padding: "8px 20px",
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

          <main
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#0a0a0a",
              padding: "24px 28px",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
