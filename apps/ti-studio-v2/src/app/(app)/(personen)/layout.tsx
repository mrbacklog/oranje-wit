import type { ReactNode } from "react";
import { PersonenSubNav } from "@/components/personen/shared/PersonenSubNav";

export default function PersonenLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{ flex: 1, overflowY: "auto", padding: "20px 24px", maxWidth: 1400, width: "100%" }}
    >
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
  );
}
