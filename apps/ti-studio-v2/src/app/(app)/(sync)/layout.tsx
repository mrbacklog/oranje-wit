import type { ReactNode } from "react";

export default function SyncLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{ flex: 1, overflowY: "auto", padding: "20px 24px", maxWidth: 1400, width: "100%" }}
    >
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
  );
}
