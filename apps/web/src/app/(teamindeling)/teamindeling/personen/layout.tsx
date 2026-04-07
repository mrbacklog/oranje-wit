import { PersonenSubNav } from "./_components/PersonenSubNav";
import type { ReactNode } from "react";

export default function PersonenLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <PersonenSubNav />
      <div>{children}</div>
    </div>
  );
}
