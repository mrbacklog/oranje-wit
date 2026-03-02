"use client";

import { usePathname } from "next/navigation";
import { useSeizoen } from "@/components/providers/SeizoenProvider";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { seizoen, isHuidig } = useSeizoen();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
          <span className="text-sm font-medium text-gray-500">Seizoen {seizoen}</span>
        </header>
        {!isHuidig && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-700">
            Je bekijkt seizoen {seizoen}. Dit seizoen is alleen-lezen.
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
