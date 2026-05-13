import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function MemoLayout({ children }: { children: ReactNode }) {
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
        overflow: "hidden",
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
              color: "var(--text-primary)",
              textDecoration: "none",
              borderRadius: 6,
              background: "rgba(255,255,255,.05)",
            }}
          >
            Memo&apos;s
          </a>
        </nav>
        <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
          {String(user?.name ?? user?.email ?? "")}
        </span>
      </header>

      {/* Shell content — padding: 0, kanban vult volledige hoogte */}
      <main
        className="shell-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
