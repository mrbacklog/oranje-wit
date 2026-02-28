"use client";

import { useState } from "react";

interface SpelerAvatarProps {
  spelerId: string;
  naam: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZES = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-6 h-6 text-[9px]",
  md: "w-8 h-8 text-xs",
};

export default function SpelerAvatar({
  spelerId,
  naam,
  size = "sm",
  className = "",
}: SpelerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initiaal = naam.charAt(0).toUpperCase();

  if (failed) {
    return (
      <span
        className={`${SIZES[size]} flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-500 ${className}`}
      >
        {initiaal}
      </span>
    );
  }

  return (
    <img
      src={`/api/foto/${spelerId}`}
      alt={naam}
      className={`${SIZES[size]} flex-shrink-0 rounded-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
