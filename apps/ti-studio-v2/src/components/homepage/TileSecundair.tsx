"use client";

import type { ReactNode } from "react";

interface TileSecundairProps {
  href: string;
  icon: ReactNode;
  titel: string;
  beschrijving: string;
  iconAccent?: boolean;
}

export function TileSecundair({
  href,
  icon,
  titel,
  beschrijving,
  iconAccent = false,
}: TileSecundairProps) {
  return (
    <a
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 14,
        padding: "18px 20px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-light)",
        borderRadius: 14,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "border-color 180ms, background 180ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-default)";
        (e.currentTarget as HTMLAnchorElement).style.background = "#1f1f23";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-light)";
        (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-card)";
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: iconAccent ? "rgba(234,179,8,.06)" : "rgba(255,255,255,.03)",
          border: `1px solid ${iconAccent ? "rgba(234,179,8,.15)" : "rgba(255,255,255,.06)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}
        >
          {titel}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
          {beschrijving}
        </div>
      </div>
    </a>
  );
}
