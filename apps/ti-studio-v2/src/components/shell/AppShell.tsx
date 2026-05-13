"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    exact: true,
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/personen",
    label: "Personen",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M16 20c0-2.5 1.5-4 4-4" />
      </svg>
    ),
  },
  {
    href: "/indeling",
    label: "Werkbord",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/kader",
    label: "Kader",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    href: "/memo",
    label: "Memo",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: "/sync",
    label: "Sync",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
}

export function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "TC";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "46px 1fr",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-0)",
      }}
    >
      {/* Ribbon */}
      <nav
        aria-label="Hoofdnavigatie"
        style={{
          background: "var(--surface-page)",
          borderRight: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 0 8px",
          gap: 2,
        }}
      >
        {/* Logo → Home */}
        <Link
          href="/"
          title="TI Studio — Home"
          aria-label="TI Studio — Home"
          style={{
            width: 30,
            height: 30,
            marginBottom: 12,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: 9,
            transition: "background 120ms",
            textDecoration: "none",
          }}
        >
          <svg
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
          >
            <rect
              x="2"
              y="2"
              width="14"
              height="14"
              rx="1.5"
              stroke="#3b82f6"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="2"
              y1="6.7"
              x2="16"
              y2="6.7"
              stroke="#3b82f6"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <line
              x1="2"
              y1="11.3"
              x2="16"
              y2="11.3"
              stroke="#3b82f6"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <line
              x1="6.7"
              y1="2"
              x2="6.7"
              y2="16"
              stroke="#3b82f6"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <line
              x1="11.3"
              y1="2"
              x2="11.3"
              y2="16"
              stroke="#3b82f6"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <path d="M16 10l-4 4h4v-4z" fill="#3b82f6" opacity="0.15" />
            <path
              d="M16.5 5.5l-2-2-6 6-.5 2.5 2.5-.5 6-6zM14.5 7.5l-2-2"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  textDecoration: "none",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 120ms, color 120ms",
                  background: active ? "var(--accent-dim, rgba(255,107,0,0.12))" : "none",
                  color: active ? "var(--ow-accent)" : "var(--text-tertiary)",
                }}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: -1,
                      top: 7,
                      bottom: 7,
                      width: 3,
                      background: "var(--ow-accent)",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
                {item.icon}
              </Link>
            );
          })}
        </div>

        {/* Footer: avatar */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 22,
              height: 1,
              background: "var(--border-light)",
              margin: "4px 0",
            }}
          />
          <div
            title={userName ?? "TC-lid"}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#2a1a0a",
              border: "2px solid rgba(255,107,0,.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--ow-accent)",
              cursor: "default",
              userSelect: "none",
            }}
          >
            {initials}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
