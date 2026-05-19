/**
 * MemoIcon — canonieke memo-indicator voor TI Studio v2.
 *
 * Vervangt het oude ▲ driehoekje. Bron: prototypes/ti-studio/shared/icons.js
 * (document-vorm). Document-svg met regels, kleur via `kleur` prop.
 *
 * Varianten:
 *   <MemoIcon />                         — alleen icoon, default kleur (memo-open)
 *   <MemoIcon count={3} />               — icoon + getal, default kleur
 *   <MemoIcon kleur="..." size={16} />   — custom kleur en grootte
 */
"use client";
import { CSSProperties } from "react";

export interface MemoIconProps {
  /** Aantal open memo's; wordt naast het icoon getoond. Weglaten = alleen icoon. */
  count?: number | null;
  /** Tekstkleur en icoonkleur. Default: var(--memo-open). */
  kleur?: string;
  /** Breedte/hoogte van de SVG zelf in px. Default 14. */
  size?: number;
  /** Tooltip-tekst. Default: "{count} open memo['s]" wanneer count is gegeven. */
  title?: string;
  /** Extra inline-styles. */
  style?: CSSProperties;
}

export function MemoIcon({
  count,
  kleur = "var(--memo-open, #fde047)",
  size = 14,
  title,
  style,
}: MemoIconProps) {
  const heeftCount = typeof count === "number" && count > 0;
  const computedTitle =
    title ?? (heeftCount ? `${count} open memo${count !== 1 ? "'s" : ""}` : undefined);

  return (
    <span
      title={computedTitle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: kleur,
        fontWeight: 800,
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        style={{ flexShrink: 0 }}
      >
        <path d="M5 3h10l4 4v14H5z" />
        <path
          d="M15 3v4h4M8 12h8M8 15h8M8 18h5"
          stroke="var(--surface-sunken, #090910)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {heeftCount && <span style={{ fontSize: size - 2, lineHeight: 1 }}>{count}</span>}
    </span>
  );
}
