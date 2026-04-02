"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarConfig } from "./types";
import { AppSwitcher } from "../navigation/app-switcher";
import { GridIcon } from "../navigation/bottom-nav";

interface SidebarProps extends SidebarConfig {
  onClose?: () => void;
}

export function Sidebar({ branding, navigation, footer, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="flex h-full w-64 flex-col"
      style={{
        backgroundColor: "var(--surface-card)",
        borderRight: "1px solid var(--border-default)",
      }}
      aria-label="Hoofdnavigatie"
    >
      {/* Branding */}
      <div
        className="px-4 py-4 text-center"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="text-ow-oranje text-xs font-bold tracking-widest">c.k.v. ORANJE WIT</div>
        <div className="mt-0.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {branding.title}
        </div>
        {branding.subtitle && (
          <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {branding.subtitle}
          </div>
        )}
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
                active ? "bg-ow-oranje-bg text-ow-oranje font-semibold" : ""
              }`}
              style={!active ? { color: "var(--text-secondary)" } : undefined}
              onMouseEnter={
                !active
                  ? (e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    }
                  : undefined
              }
              onMouseLeave={
                !active
                  ? (e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }
                  : undefined
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span className="bg-ow-oranje rounded-full px-2 py-0.5 text-[10px] font-medium text-white">
                  {item.badge}
                </span>
              )}
              {item.description && !item.badge && (
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {item.description}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border-light)" }}>
        {footer?.settingsHref && (
          <Link
            href={footer.settingsHref}
            onClick={onClose}
            aria-current={isActive(footer.settingsHref) ? "page" : undefined}
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(footer.settingsHref) ? "bg-ow-oranje-bg text-ow-oranje font-semibold" : ""
            }`}
            style={!isActive(footer.settingsHref) ? { color: "var(--text-tertiary)" } : undefined}
            onMouseEnter={
              !isActive(footer.settingsHref)
                ? (e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                : undefined
            }
            onMouseLeave={
              !isActive(footer.settingsHref)
                ? (e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                  }
                : undefined
            }
          >
            <span className="text-base">&#9881;</span>
            <span>Instellingen</span>
          </Link>
        )}

        {/* App Switcher knop */}
        {footer?.showAppSwitcher && (
          <div className="relative">
            <button
              onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
              className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--state-hover)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }}
              aria-label="Open app switcher"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <GridIcon active={appSwitcherOpen} />
              </span>
              <span>Apps</span>
            </button>
            <AppSwitcher
              open={appSwitcherOpen}
              onClose={() => setAppSwitcherOpen(false)}
              variant="dropdown"
            />
          </div>
        )}

        {footer?.userMenu && (
          <div className="flex items-center justify-between px-3 py-2 text-xs">
            <div>
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                {footer.userMenu.name}
              </div>
              <div style={{ color: "var(--text-tertiary)" }}>{footer.userMenu.role}</div>
            </div>
            <button
              onClick={footer.userMenu.onSignOut}
              className="transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }}
            >
              Uit
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
