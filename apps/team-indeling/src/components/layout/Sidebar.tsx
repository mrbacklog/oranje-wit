"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSeizoen } from "@/components/providers/SeizoenProvider";
import UserMenu from "./UserMenu";

const NAV_ITEMS = [
  { href: "/", label: "Overzicht", icon: "📋" },
  { href: "/blauwdruk", label: "Blauwdruk", icon: "🗂️" },
  { href: "/scenarios", label: "Scenario's", icon: "🏗️" },
  { href: "/definitief", label: "Definitief", icon: "✅" },
  { href: "/import", label: "Import", icon: "📥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { seizoen, alleSeizoenen, isWerkseizoen, setSeizoen, setWerkseizoen, isPending } =
    useSeizoen();

  return (
    <aside
      aria-label="Hoofdnavigatie"
      className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white"
    >
      {/* Branding */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
        <Image
          src="/logo-ow.png"
          alt="c.k.v. Oranje Wit logo"
          width={44}
          height={44}
          className="shrink-0"
        />
        <div>
          <h1 className="text-ow-oranje text-base leading-tight font-bold">Oranje Wit</h1>
          <p className="text-xs text-gray-500">Team-Indeling</p>
        </div>
      </div>

      {/* Seizoen-selector */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            value={seizoen}
            onChange={(e) => setSeizoen(e.target.value)}
            className="focus:border-ow-oranje focus:ring-ow-oranje flex-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 focus:ring-1 focus:outline-none"
          >
            {alleSeizoenen.map((s) => (
              <option key={s.seizoen} value={s.seizoen}>
                {s.isWerkseizoen ? "★ " : ""}
                {s.seizoen}
              </option>
            ))}
          </select>
          {!isWerkseizoen && (
            <button
              onClick={() => setWerkseizoen(seizoen)}
              disabled={isPending}
              title={`${seizoen} instellen als werkseizoen`}
              className="rounded p-1 text-gray-400 transition-colors hover:text-yellow-500 disabled:opacity-50"
            >
              ☆
            </button>
          )}
          {isWerkseizoen && (
            <span title="Dit is het werkseizoen" className="p-1 text-yellow-500">
              ★
            </span>
          )}
        </div>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ow-oranje-bg text-ow-oranje font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Gebruiker */}
      <UserMenu />
    </aside>
  );
}
