"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSeizoen } from "@/components/providers/SeizoenProvider";
import NieuwSeizoenDialog from "./NieuwSeizoenDialog";
import UserMenu from "./UserMenu";

function berekenVolgendSeizoen(seizoen: string): string {
  const [start] = seizoen.split("-").map(Number);
  return `${start + 1}-${start + 2}`;
}

const navigatie = [
  { label: "Overzicht", href: "/" },
  { label: "Blauwdruk", href: "/blauwdruk" },
  { label: "Scenario's", href: "/scenarios" },
  { label: "Notities", href: "/notities" },
  { label: "Definitief", href: "/definitief" },
  { label: "Import", href: "/import" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { seizoen, alleSeizoenen, isHuidig, setSeizoen } = useSeizoen();

  return (
    <aside className="flex min-h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Titel */}
      <div className="border-b border-gray-100 px-4 py-5">
        <h1 className="text-lg font-bold text-gray-900">Team-Indeling</h1>
        {alleSeizoenen.length > 1 ? (
          <select
            value={seizoen}
            onChange={(e) => setSeizoen(e.target.value)}
            className="mt-1 rounded-full border-none bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 focus:ring-2 focus:ring-orange-300"
          >
            {alleSeizoenen.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            {seizoen}
          </span>
        )}
        {isHuidig && <NieuwSeizoenDialog volgendSeizoen={berekenVolgendSeizoen(seizoen)} />}
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
