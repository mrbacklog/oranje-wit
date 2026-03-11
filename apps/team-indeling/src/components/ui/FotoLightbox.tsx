"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";

interface FotoLightboxProps {
  spelerId: string;
  naam: string;
  onClose: () => void;
}

export default function FotoLightbox({ spelerId, naam, onClose }: FotoLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-label={`Foto van ${naam}`}
    >
      <div
        className="relative flex max-w-lg flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100"
          aria-label="Sluiten"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <Image
          src={`/api/foto/${spelerId}`}
          alt={naam}
          width={400}
          height={400}
          className="rounded-lg object-cover shadow-lg"
          unoptimized
        />

        <p className="mt-3 text-lg font-medium text-white">{naam}</p>
      </div>
    </div>
  );
}
