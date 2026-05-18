"use client";

import { useState } from "react";
import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";
import { MemoCorner } from "./MemoCorner";

export type AvatarSize = "sm" | "md" | "lg" | "hero" | "hover";

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 52,
  hero: 96,
  hover: 120,
};

const FONT_SIZE: Record<AvatarSize, number> = {
  sm: 11,
  md: 13,
  lg: 16,
  hero: 28,
  hover: 34,
};

interface SpelerAvatarProps {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  geslacht?: "M" | "V";
  size?: AvatarSize;
  hasFoto: boolean;
  status?: SpelerStatus;
  isNieuw?: boolean;
  memoStatus?: WerkitemStatus | null;
  className?: string;
  style?: React.CSSProperties;
}

function statusToKlasse(status?: SpelerStatus): string {
  if (!status) return "";
  switch (status) {
    case "NIEUW_POTENTIEEL":
    case "NIEUW_DEFINITIEF":
      return "st-nieuw";
    case "TWIJFELT":
    case "GEBLESSEERD":
      return "st-twijfelt";
    case "GAAT_STOPPEN":
    case "GESTOPT":
    case "RECREANT":
    case "NIET_SPELEND":
      return "st-stopt";
    case "ALGEMEEN_RESERVE":
      return "st-ar";
    default:
      return "";
  }
}

export function SpelerAvatar({
  relCode,
  roepnaam,
  achternaam,
  geslacht,
  size = "md",
  hasFoto,
  status,
  isNieuw = false,
  memoStatus,
  className,
  style,
}: SpelerAvatarProps) {
  const [fotoOk, setFotoOk] = useState(false);

  const px = SIZE_PX[size];
  const fontSize = FONT_SIZE[size];
  const initials =
    (roepnaam[0] ?? "").toUpperCase() + (achternaam[0] ?? "").toUpperCase();

  const isVrouw = geslacht === "V";
  const sexeKleur = isVrouw ? "var(--sexe-v)" : "var(--sexe-h)";
  const sexeBg = isVrouw ? "rgba(217,70,239,.15)" : "rgba(37,99,235,.15)";
  const statusKlasse = statusToKlasse(status);
  const isGeblesseerd = status === "GEBLESSEERD";
  // Stopt/AR: verlaag opacity op foto
  const isStopt =
    status === "GAAT_STOPPEN" ||
    status === "GESTOPT" ||
    status === "RECREANT" ||
    status === "NIET_SPELEND";
  const isAR = status === "ALGEMEEN_RESERVE";
  const fotoOpacity = isStopt ? 0.75 : isAR ? 0.85 : 1;

  const memoGrootte =
    size === "hero"
      ? "hero"
      : size === "hover"
        ? "hover"
        : size === "lg"
          ? "rijk"
          : "normaal";

  return (
    <div
      className={`sq-av${isVrouw ? " vrouw" : ""}${statusKlasse ? ` ${statusKlasse}` : ""}${className ? ` ${className}` : ""}`}
      style={{
        width: px,
        height: px,
        background: sexeBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      aria-label={`${roepnaam} ${achternaam}`}
    >
      {/* Initialen — onderlaag, altijd aanwezig */}
      <span
        style={{
          fontSize,
          fontWeight: 800,
          color: sexeKleur,
          pointerEvents: "none",
          position: "relative",
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {initials}
      </span>

      {/* Foto-overlay — alleen als hasFoto true */}
      {hasFoto && (
        // eslint-disable-next-line @next/next/no-img-element
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
            opacity: fotoOk ? fotoOpacity : 0,
            transition: "opacity 120ms",
            borderRadius: "inherit",
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 1 && img.naturalHeight > 1) {
              setFotoOk(true);
            }
          }}
        />
      )}

      {/* Geblesseerd-badge — rechtsonder */}
      {isGeblesseerd && (
        <div className="blessure">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
          </svg>
        </div>
      )}

      {/* Nieuw-lid sparkle — rechtsboven */}
      {isNieuw && (
        <div className="nieuw-sparkle">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
          </svg>
        </div>
      )}

      {/* Memo-corner — linksboven */}
      {memoStatus && memoStatus !== "GEARCHIVEERD" && (
        <MemoCorner status={memoStatus} size={memoGrootte} />
      )}
    </div>
  );
}
