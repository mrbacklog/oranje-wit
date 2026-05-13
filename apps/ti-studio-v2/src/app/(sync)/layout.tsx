import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function SyncLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    redirect("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Topbar */}
      <header
        style={{
          height: 52,
          borderBottom: "1px solid var(--border-0)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ow-accent)" }}>
          TI Studio v2
        </span>
        <nav style={{ display: "flex", gap: 2, marginLeft: 16 }}>
          <a
            href="/personen/spelers"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Personen
          </a>
          <a
            href="/kader"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Kader
          </a>
          <a
            href="/memo"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Memo&apos;s
          </a>
          <a
            href="/sync"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary)",
              textDecoration: "none",
              borderRadius: 6,
              background: "rgba(255,255,255,.05)",
            }}
          >
            Sync
          </a>
        </nav>
        <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
          {String(user?.name ?? user?.email ?? "")}
        </span>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1400, width: "100%" }}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}
        >
          KNKV Sync
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            margin: "0 0 24px",
          }}
        >
          Sportlink API synchronisatie — leden, teamindeling en competitie
        </p>
        {children}
      </main>
    </div>
  );
}
