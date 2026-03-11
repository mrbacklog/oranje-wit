"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarConfig } from "./types";

interface SidebarProps extends SidebarConfig {
  onClose?: () => void;
}

export function Sidebar({ branding, navigation, footer, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="flex h-full w-64 flex-col border-r border-gray-200 bg-white"
      aria-label="Hoofdnavigatie"
    >
      {/* Branding */}
      <div className="border-b border-gray-100 px-4 py-4 text-center">
        <div className="text-ow-oranje text-xs font-bold tracking-widest">c.k.v. ORANJE WIT</div>
        <div className="mt-0.5 text-sm font-semibold text-gray-900">{branding.title}</div>
        {branding.subtitle && <div className="mt-1 text-xs text-gray-500">{branding.subtitle}</div>}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ow-oranje-bg text-ow-oranje font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span className="bg-ow-oranje rounded-full px-2 py-0.5 text-[10px] font-medium text-white">
                  {item.badge}
                </span>
              )}
              {item.description && !item.badge && (
                <span className="text-[10px] text-gray-400">{item.description}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-2">
        {footer?.settingsHref && (
          <Link
            href={footer.settingsHref}
            onClick={onClose}
            aria-current={isActive(footer.settingsHref) ? "page" : undefined}
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(footer.settingsHref)
                ? "bg-ow-oranje-bg text-ow-oranje font-semibold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <span className="text-base">&#9881;</span>
            <span>Instellingen</span>
          </Link>
        )}
        {footer?.userMenu && (
          <div className="flex items-center justify-between px-3 py-2 text-xs">
            <div>
              <div className="font-medium text-gray-900">{footer.userMenu.name}</div>
              <div className="text-gray-500">{footer.userMenu.role}</div>
            </div>
            <button
              onClick={footer.userMenu.onSignOut}
              className="text-gray-400 hover:text-gray-600"
            >
              Uit
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
