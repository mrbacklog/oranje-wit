import { PersonenSubNav } from "./_components/PersonenSubNav";
import type { ReactNode } from "react";

export default function PersonenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl space-y-4">
      <PersonenSubNav />
      <div>{children}</div>
    </div>
  );
}
