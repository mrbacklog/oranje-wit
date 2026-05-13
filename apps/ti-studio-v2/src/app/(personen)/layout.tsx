import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PersonenSubNav } from "@/components/personen/shared/PersonenSubNav";

export default async function PersonenLayout({ children }: { children: ReactNode }) {
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
        <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
          {String(user?.name ?? user?.email ?? "")}
        </span>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1400, width: "100%" }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--text-1)",
            margin: "0 0 16px",
          }}
        >
          Personen
        </h1>
        <PersonenSubNav />
        <div style={{ marginTop: 16 }}>{children}</div>
      </main>
    </div>
  );
}
