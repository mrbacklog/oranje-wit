"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/teams", label: "Teams", icon: "🏃" },
  { href: "/spelers", label: "Spelers", icon: "👤" },
  { href: "/samenstelling", label: "Samenstelling", icon: "👥" },
  { href: "/retentie", label: "Ledendynamiek", icon: "🔄" },
  { href: "/projecties", label: "Jeugdpijplijn", icon: "🎯" },
  { href: "/signalering", label: "Signalering", icon: "⚠️" },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Hoofdnavigatie"
      className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white"
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
          <h1 className="text-ow-oranje text-base leading-tight font-bold">c.k.v. Oranje Wit</h1>
          <p className="text-xs text-gray-500">Verenigingsmonitor</p>
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
              onClick={onClose}
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
    </aside>
  );
}
