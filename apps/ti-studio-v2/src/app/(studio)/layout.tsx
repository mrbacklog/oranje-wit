import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function StudioLayout({ children }: { children: ReactNode }) {
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
      {children}
    </div>
  );
}
