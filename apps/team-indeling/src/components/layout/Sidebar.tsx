"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";

const SEIZOEN = "2026-2027";

const navigatie = [
  { label: "Overzicht", href: "/" },
  { label: "Blauwdruk", href: "/blauwdruk" },
  { label: "Scenario's", href: "/scenarios" },
  { label: "Definitief", href: "/definitief" },
  { label: "Import", href: "/import" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Titel */}
      <div className="border-b border-gray-100 px-4 py-5">
        <h1 className="text-lg font-bold text-gray-900">Team-Indeling</h1>
        <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
          {SEIZOEN}
        </span>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigatie.map((item) => {
          const actief = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                actief
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Gebruiker */}
      <UserMenu />

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
        c.k.v. Oranje Wit
      </div>
    </aside>
  );
}
