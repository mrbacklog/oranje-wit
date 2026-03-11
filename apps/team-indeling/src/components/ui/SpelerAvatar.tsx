"use client";

import { useState } from "react";
import Image from "next/image";

interface SpelerAvatarProps {
  spelerId: string;
  naam: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

const SIZES = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-6 h-6 text-[9px]",
  md: "w-8 h-8 text-xs",
  lg: "w-24 h-24 text-2xl",
  xl: "w-36 h-36 text-3xl",
};

const IMAGE_DIMS: Record<string, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 96,
  xl: 144,
};

export default function SpelerAvatar({
  spelerId,
  naam,
  size = "sm",
  className = "",
  onClick,
}: SpelerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initiaal = naam.charAt(0).toUpperCase();
  const clickProps = onClick ? { onClick, role: "button" as const, tabIndex: 0 } : {};
  const cursorClass = onClick ? "cursor-pointer" : "";

  if (failed) {
    return (
      <span
        className={`${SIZES[size]} flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-500 ${cursorClass} ${className}`}
        {...clickProps}
      >
        {initiaal}
      </span>
    );
  }

  return (
    <Image
      src={`/api/foto/${spelerId}`}
      alt={naam}
      width={IMAGE_DIMS[size]}
      height={IMAGE_DIMS[size]}
      className={`${SIZES[size]} flex-shrink-0 rounded-full object-cover ${cursorClass} ${className}`}
      onError={() => setFailed(true)}
      unoptimized
      {...clickProps}
    />
  );
}
