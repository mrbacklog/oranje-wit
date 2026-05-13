import type { ReactNode } from "react";

export default function KaderLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{ flex: 1, overflowY: "auto", padding: "20px 24px", maxWidth: 1400, width: "100%" }}
    >
      {children}
    </main>
  );
}
