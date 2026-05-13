import type { ReactNode } from "react";

export default function MemoLayout({ children }: { children: ReactNode }) {
  return (
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
  );
}
