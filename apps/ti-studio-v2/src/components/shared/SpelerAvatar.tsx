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
  // Foto wordt pas getoond als laden geslaagd is — anders blijven initialen zichtbaar.
  const [fotoOk, setFotoOk] = useState(false);

  const px = SIZE_PX[size];
  const initials = (roepnaam[0] ?? "").toUpperCase() + (achternaam[0] ?? "").toUpperCase();

  const isVrouw = geslacht === "V";
  const sexeKleur = isVrouw ? "var(--sexe-v)" : "var(--sexe-h)";
  const sexeBg = isVrouw ? "rgba(217,70,239,.15)" : "rgba(37,99,235,.15)";

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: 4,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        background: sexeBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      aria-label={`${roepnaam} ${achternaam}`}
    >
      <span
        style={{
          fontSize: FONT_SIZE[size],
          fontWeight: 800,
          color: sexeKleur,
          pointerEvents: "none",
        }}
      >
        {initials}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/foto/${relCode}.webp`}
        alt=""
        width={px}
        height={px}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 25%",
          display: "block",
          filter: "grayscale(1)",
          opacity: fotoOk ? 1 : 0,
          transition: "opacity 120ms",
        }}
        onLoad={(e) => {
          // Veronderstel "ok" alleen als afbeelding daadwerkelijk afmetingen heeft.
          const img = e.currentTarget;
          if (img.naturalWidth > 1 && img.naturalHeight > 1) {
            setFotoOk(true);
          }
        }}
      />
      {fotoOk && (
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
      )}
    </div>
  );
}
