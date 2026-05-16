"use client";

import { useState } from "react";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 52,
};

const FONT_SIZE: Record<AvatarSize, number> = {
  sm: 11,
  md: 13,
  lg: 16,
};

interface SpelerAvatarProps {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  geslacht?: "M" | "V";
  size?: AvatarSize;
  className?: string;
  style?: React.CSSProperties;
}

export function SpelerAvatar({
  relCode,
  roepnaam,
  achternaam,
  geslacht,
  size = "md",
  className,
  style,
}: SpelerAvatarProps) {
  const [fotoFout, setFotoFout] = useState(false);

  const px = SIZE_PX[size];
  const initials =
    (roepnaam[0] ?? "").toUpperCase() + (achternaam[0] ?? "").toUpperCase();

  const isVrouw = geslacht === "V";
  const sexeKleur = isVrouw ? "var(--sexe-v)" : "var(--sexe-h)";
  const sexeBg = isVrouw ? "rgba(217,70,239,.15)" : "rgba(37,99,235,.15)";

  const baseStyle: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: 4,
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
    background: "var(--surface-card)",
    ...style,
  };

  if (fotoFout) {
    return (
      <div
        className={className}
        style={{
          ...baseStyle,
          background: sexeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: FONT_SIZE[size],
          fontWeight: 800,
          color: sexeKleur,
        }}
        aria-label={`${roepnaam} ${achternaam}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={baseStyle}
      aria-label={`${roepnaam} ${achternaam}`}
    >
      <img
        src={`/api/foto/${relCode}.webp`}
        alt=""
        width={px}
        height={px}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 25%",
          display: "block",
          filter: "grayscale(1)",
        }}
        onError={() => setFotoFout(true)}
      />
      {/* Geslacht-kleur overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: sexeKleur,
          opacity: 0.15,
          mixBlendMode: "color",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
