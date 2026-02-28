"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SeizoenSelector } from "./seizoen-selector";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/teams", label: "Teams", icon: "🏃" },
  { href: "/spelers", label: "Spelers", icon: "👤" },
  { href: "/samenstelling", label: "Samenstelling", icon: "👥" },
  { href: "/cohorten", label: "Cohorten", icon: "📈" },
  { href: "/verloop", label: "Verloop", icon: "🔄" },
  { href: "/projecties", label: "Projecties", icon: "🎯" },
  { href: "/signalering", label: "Signalering", icon: "⚠️" },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const seizoen = params.get("seizoen") || "";
  const qs = seizoen ? `?seizoen=${seizoen}` : "";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Branding */}
      <div className="border-b border-gray-200 px-6 py-5">
        <h1 className="text-ow-oranje text-lg font-bold">Oranje Wit</h1>
        <p className="text-xs text-gray-500">Verenigingsmonitor</p>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href + qs}
              onClick={onClose}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ow-oranje-bg text-ow-oranje font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Seizoen-selector */}
      <div className="border-t border-gray-200 px-4 py-4">
        <p className="mb-2 text-xs font-medium text-gray-500">Seizoen</p>
        <SeizoenSelector />
      </div>
    </aside>
  );
}
